import Fastify from 'fastify';
import { prisma } from './db.js';
import { registerOrderRoutes } from './routes/orders.js';
import { registerWebhookRoutes } from './routes/webhooks.js';

const app = Fastify({
  logger: true,
});

// Capture rawBody for webhook signature verification
app.addContentTypeParser(
  'application/json',
  { parseAs: 'string' },
  function (req, body, done) {
    const raw = typeof body === 'string' ? body : body.toString('utf8');
    (req as any).rawBody = raw;
    try {
      const json = raw ? JSON.parse(raw) : {};
      done(null, json);
    } catch (err) {
      done(err as Error, undefined);
    }
  },
);

app.get('/health', async () => {
  await prisma.$queryRaw`SELECT 1`;
  return { ok: true };
});

await registerOrderRoutes(app);
await registerWebhookRoutes(app);

const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? '0.0.0.0';

await app.listen({ port, host });
