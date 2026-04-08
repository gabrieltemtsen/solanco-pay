export async function fetchUsdToNgn(): Promise<number> {
  // exchangerate.host is free/no-key. Endpoint returns latest FX rate.
  // Example: https://api.exchangerate.host/latest?base=USD&symbols=NGN
  const res = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=NGN');
  if (!res.ok) throw new Error(`FX fetch failed: ${res.status}`);
  const json = (await res.json()) as any;
  const rate = json?.rates?.NGN;
  if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) {
    throw new Error('Invalid FX rate from exchangerate.host');
  }
  return rate;
}
