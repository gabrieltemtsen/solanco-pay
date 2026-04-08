import type { FastifyInstance } from 'fastify';
import { DEFAULT_PRICING_CONFIG } from '@solanco/config';
import { z } from 'zod';
import { prisma } from '../db.js';
import { computeNgnPayoutFromUsdc } from '../pricing.js';
import { getUsdToNgnRate } from '../rates/index.js';

const CreateOrderSchema = z.object({
  amountUsdc: z.number().positive(),
  payoutCurrency: z.string().default('NGN'),
  recipientName: z.string().min(1),
  recipientAccount: z.string().min(7).max(15),
  recipientBankCode: z.string().min(1),
  memo: z.string().optional(),
});

export async function registerOrderRoutes(app: FastifyInstance) {
  app.get('/quote', async (req, reply) => {
    const query = z
      .object({
        amountUsdc: z.coerce.number().positive(),
        payoutCurrency: z.string().default('NGN'),
      })
      .parse(req.query);

    if (query.payoutCurrency !== 'NGN') {
      return reply.code(400).send({ error: 'unsupported_currency', supported: ['NGN'] });
    }

    const { rate, source, asOf } = await getUsdToNgnRate();
    const pricing = computeNgnPayoutFromUsdc({ amountUsdc: query.amountUsdc, usdToNgn: rate });
    const quoteExpiresAt = new Date(Date.now() + DEFAULT_PRICING_CONFIG.quoteTtlSeconds * 1000);

    return reply.send({
      quote: {
        amountUsdc: query.amountUsdc,
        payoutCurrency: 'NGN',
        payoutAmountFiat: pricing.payoutNgn,
        payoutAmountKobo: pricing.payoutKobo,
        grossNgn: pricing.grossNgn,
        grossKobo: pricing.grossKobo,
        usdToNgn: rate,
        spreadBps: pricing.spreadBps,
        flatFeeKobo: pricing.flatFeeKobo,
        rateSource: source,
        rateAsOf: asOf.toISOString(),
        quoteExpiresAt: quoteExpiresAt.toISOString(),
      },
    });
  });

  app.post('/orders', async (req, reply) => {
    const body = CreateOrderSchema.parse(req.body);

    if (body.payoutCurrency !== 'NGN') {
      return reply.code(400).send({ error: 'unsupported_currency', supported: ['NGN'] });
    }

    const { rate, source, asOf } = await getUsdToNgnRate();
    const pricing = computeNgnPayoutFromUsdc({
      amountUsdc: body.amountUsdc,
      usdToNgn: rate,
    });

    const quoteExpiresAt = new Date(Date.now() + DEFAULT_PRICING_CONFIG.quoteTtlSeconds * 1000);

    const order = await prisma.offrampOrder.create({
      data: {
        status: 'awaiting_deposit',
        amountUsdc: String(body.amountUsdc),
        payoutCurrency: body.payoutCurrency,
        payoutAmountFiat: String(pricing.payoutNgn),
        fxUsdToNgn: String(rate),
        spreadBps: pricing.spreadBps,
        flatFeeKobo: pricing.flatFeeKobo,
        quoteExpiresAt,
        recipientName: body.recipientName,
        recipientAccount: body.recipientAccount,
        recipientBankCode: body.recipientBankCode,
        metadata: {
          ...(body.memo ? { memo: body.memo } : {}),
          rateSource: source,
          rateAsOf: asOf.toISOString(),
          grossNgn: pricing.grossNgn,
        },
      },
      select: {
        id: true,
        status: true,
        amountUsdc: true,
        payoutCurrency: true,
        payoutAmountFiat: true,
        fxUsdToNgn: true,
        spreadBps: true,
        flatFeeKobo: true,
        quoteExpiresAt: true,
        recipientName: true,
        createdAt: true,
      },
    });

    return reply.code(201).send({ order });
  });

  app.get('/orders/:id', async (req, reply) => {
    const params = z.object({ id: z.string() }).parse(req.params);

    const order = await prisma.offrampOrder.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        status: true,
        amountUsdc: true,
        payoutCurrency: true,
        payoutAmountFiat: true,
        recipientName: true,
        recipientAccount: true,
        recipientBankCode: true,
        solanaSignature: true,
        paystackReference: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!order) return reply.code(404).send({ error: 'not_found' });
    return reply.send({ order });
  });
}
