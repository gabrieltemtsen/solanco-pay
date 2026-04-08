import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db.js';

const CreateOrderSchema = z.object({
  amountUsdc: z.string(), // store as string -> Prisma Decimal
  payoutCurrency: z.string().default('NGN'),
  payoutAmountFiat: z.string().optional(),
  recipientName: z.string().min(1),
  recipientAccount: z.string().min(7).max(15),
  recipientBankCode: z.string().min(1),
  memo: z.string().optional(),
});

export async function registerOrderRoutes(app: FastifyInstance) {
  app.post('/orders', async (req, reply) => {
    const body = CreateOrderSchema.parse(req.body);

    const order = await prisma.offrampOrder.create({
      data: {
        status: 'awaiting_deposit',
        amountUsdc: body.amountUsdc,
        payoutCurrency: body.payoutCurrency,
        payoutAmountFiat: body.payoutAmountFiat,
        recipientName: body.recipientName,
        recipientAccount: body.recipientAccount,
        recipientBankCode: body.recipientBankCode,
        metadata: body.memo ? { memo: body.memo } : undefined,
      },
      select: {
        id: true,
        status: true,
        amountUsdc: true,
        payoutCurrency: true,
        payoutAmountFiat: true,
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
