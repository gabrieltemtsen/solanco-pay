import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db.js';
import { createTransferRecipient, initiateTransfer } from '../paystack.js';
import { ngnToKobo } from '../money.js';

export async function registerPayoutRoutes(app: FastifyInstance) {
  app.post('/orders/:id/payout', async (req, reply) => {
    const params = z.object({ id: z.string() }).parse(req.params);

    const order = await prisma.offrampOrder.findUnique({
      where: { id: params.id },
    });

    if (!order) return reply.code(404).send({ error: 'not_found' });

    // Quote expiry enforcement: do not silently reprice.
    if (order.quoteExpiresAt && order.quoteExpiresAt.getTime() < Date.now()) {
      return reply.code(409).send({
        error: 'quote_expired',
        quoteExpiresAt: order.quoteExpiresAt.toISOString(),
      });
    }

    if (order.payoutCurrency !== 'NGN') {
      return reply.code(400).send({ error: 'unsupported_currency', supported: ['NGN'] });
    }

    if (!order.payoutAmountFiat) {
      return reply.code(400).send({ error: 'missing_payout_amount' });
    }

    // Only allow payout once order is funded/confirmed.
    // (We'll relax this later for admin/testing.)
    if (order.status !== 'deposit_confirmed' && order.status !== 'payout_pending') {
      return reply.code(409).send({
        error: 'invalid_status',
        status: order.status,
        allowed: ['deposit_confirmed', 'payout_pending'],
      });
    }

    // Create Paystack recipient if missing.
    let recipientCode = order.paystackRecipientCode;
    if (!recipientCode) {
      const rec = await createTransferRecipient({
        name: order.recipientName,
        account_number: order.recipientAccount,
        bank_code: order.recipientBankCode,
        currency: order.payoutCurrency,
      });
      recipientCode = rec.recipient_code;

      await prisma.offrampOrder.update({
        where: { id: order.id },
        data: { paystackRecipientCode: recipientCode },
      });
    }

    // Initiate transfer. Reference = order id (stable, idempotency-friendly).
    const amountKobo = ngnToKobo(order.payoutAmountFiat.toString());

    const transfer = await initiateTransfer({
      amountNgn: amountKobo,
      recipient: recipientCode,
      reference: order.id,
      reason: (order.metadata as any)?.memo ?? 'Solanco Pay offramp',
    });

    await prisma.offrampOrder.update({
      where: { id: order.id },
      data: {
        status: 'payout_submitted',
        paystackReference: transfer.reference,
        paystackTransferId: String(transfer.id),
      },
    });

    return reply.send({
      ok: true,
      orderId: order.id,
      paystack: {
        reference: transfer.reference,
        transferId: transfer.id,
        transferCode: transfer.transfer_code,
      },
    });
  });
}
