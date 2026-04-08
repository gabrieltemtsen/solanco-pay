import Fastify from 'fastify';
import { prisma } from './db.js';

const app = Fastify({ logger: true });

app.get('/health', async () => {
  // basic DB check
  await prisma.$queryRaw`SELECT 1`;
  return { ok: true };
});

const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? '0.0.0.0';

await app.listen({ port, host });
