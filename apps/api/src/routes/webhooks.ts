import type { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';
import { verifyPaystackWebhook } from '../paystack.js';

// Paystack webhook signature header: x-paystack-signature
export async function registerWebhookRoutes(app: FastifyInstance) {
  app.post('/webhooks/paystack', async (req, reply) => {
    const signature = req.headers['x-paystack-signature'];
    const rawBody = (req as any).rawBody as string | undefined;

    const ok = verifyPaystackWebhook({
      rawBody: rawBody ?? JSON.stringify(req.body ?? {}),
      signature: typeof signature === 'string' ? signature : undefined,
    });

    if (!ok) return reply.code(401).send({ error: 'invalid_signature' });

    const evt = req.body as any;
    const event = evt?.event as string | undefined;
    const data = evt?.data;

    // We treat these as final.
    // - transfer.success
    // - transfer.failed
    if (event === 'transfer.success' || event === 'transfer.failed') {
      const reference = data?.reference as string | undefined;
      if (!reference) return reply.code(400).send({ error: 'missing_reference' });

      await prisma.offrampOrder.updateMany({
        where: { paystackReference: reference },
        data: {
          status: event === 'transfer.success' ? 'payout_succeeded' : 'payout_failed',
          metadata: {
            ...(data ? { paystack: data } : {}),
          },
        },
      });
    }

    return reply.send({ received: true });
  });
}
