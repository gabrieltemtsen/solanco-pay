export type PricingConfig = {
  /** e.g. 200 = 2% */
  spreadBps: number;
  /** flat fee in kobo */
  flatFeeKobo: number;
  /** quote TTL in seconds */
  quoteTtlSeconds: number;
};

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  spreadBps: Number(process.env.SOLANCO_SPREAD_BPS ?? 200),
  flatFeeKobo: Number(process.env.SOLANCO_FLAT_FEE_KOBO ?? 0),
  quoteTtlSeconds: Number(process.env.SOLANCO_QUOTE_TTL_SECONDS ?? 120),
};
