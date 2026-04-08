import { fetchUsdToNgn } from './exchangerate-host.js';

let cached: { rate: number; ts: number } | null = null;

export async function getUsdToNgnRate(): Promise<{ rate: number; source: string; asOf: Date }> {
  const now = Date.now();
  // 60s cache
  if (cached && now - cached.ts < 60_000) {
    return { rate: cached.rate, source: 'exchangerate.host', asOf: new Date(cached.ts) };
  }
  const rate = await fetchUsdToNgn();
  cached = { rate, ts: now };
  return { rate, source: 'exchangerate.host', asOf: new Date(now) };
}
