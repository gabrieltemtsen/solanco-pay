import { DEFAULT_PRICING_CONFIG } from '@solanco/config';

export function computeNgnPayoutFromUsdc(input: {
  amountUsdc: number;
  usdToNgn: number;
  spreadBps?: number;
  flatFeeKobo?: number;
}): {
  payoutNgn: number;
  payoutKobo: number;
  spreadBps: number;
  flatFeeKobo: number;
  grossNgn: number;
  grossKobo: number;
} {
  const spreadBps = input.spreadBps ?? DEFAULT_PRICING_CONFIG.spreadBps;
  const flatFeeKobo = input.flatFeeKobo ?? DEFAULT_PRICING_CONFIG.flatFeeKobo;

  // USDC assumed ~1 USD for MVP
  const grossNgn = input.amountUsdc * input.usdToNgn;
  const grossKobo = Math.floor(grossNgn * 100);

  const spreadMultiplier = 1 - spreadBps / 10_000;
  const afterSpreadKobo = Math.floor(grossKobo * spreadMultiplier);
  const payoutKobo = Math.max(0, afterSpreadKobo - flatFeeKobo);

  return {
    payoutNgn: payoutKobo / 100,
    payoutKobo,
    spreadBps,
    flatFeeKobo,
    grossNgn,
    grossKobo,
  };
}
