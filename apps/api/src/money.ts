export function ngnToKobo(amountNgn: string | number): number {
  const n = typeof amountNgn === 'number' ? amountNgn : Number(amountNgn);
  if (!Number.isFinite(n)) throw new Error('Invalid NGN amount');
  return Math.round(n * 100);
}
