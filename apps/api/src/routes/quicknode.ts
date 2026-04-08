import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db.js';

function requireQuicknodeAuth(req: any): boolean {
  const token = process.env.QUICKNODE_WEBHOOK_TOKEN;
  if (!token) return true; // allow if not configured
  const auth = req.headers?.authorization as string | undefined;
  if (!auth?.startsWith('Bearer ')) return false;
  return auth.slice('Bearer '.length) === token;
}

// This endpoint is designed to be tolerant of QuickNode payload variations.
// Ideally, configure your QuickNode stream/webhook to include an explicit orderId in the payload.
export async function registerQuicknodeRoutes(app: FastifyInstance) {
  app.post('/webhooks/quicknode', async (req, reply) => {
    if (!requireQuicknodeAuth(req)) {
      return reply.code(401).send({ error: 'unauthorized' });
    }

    const body = req.body as any;

    // Preferred: QuickNode webhook includes explicit fields.
    // For unique deposit address per order, include the destination token account.
    const normalized = z
      .object({
        orderId: z.string().optional(),
        signature: z.string().optional(),
        amountUsdc: z.number().optional(),
        memo: z.string().optional(),
        destinationTokenAccount: z.string().optional(),
      })
      .passthrough()
      .safeParse(body);

    let orderId: string | undefined = undefined;
    let signature: string | undefined = undefined;
    let destinationTokenAccount: string | undefined = undefined;

    if (normalized.success) {
      orderId = normalized.data.orderId ?? normalized.data.memo;
      signature = normalized.data.signature;
      destinationTokenAccount = normalized.data.destinationTokenAccount;
    }

    // Update order as deposit confirmed. In later iterations we’ll validate signature + amounts.
    const updated = await prisma.offrampOrder.updateMany({
      where: {
        ...(orderId ? { id: orderId } : {}),
        ...(destinationTokenAccount ? { depositTokenAccount: destinationTokenAccount } : {}),
        status: { in: ['awaiting_deposit', 'deposit_confirmed', 'payout_pending'] },
      },
      data: {
        status: 'deposit_confirmed',
        solanaSignature: signature,
        metadata: {
          ...(body ? { quicknode: body } : {}),
        },
      },
    });

    if (updated.count === 0) {
      return reply.send({ received: true, ignored: 'no_matching_order' });
    }

    return reply.send({ received: true, updated: updated.count });
  });
}
