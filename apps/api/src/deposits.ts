import { Keypair, PublicKey } from '@solana/web3.js';
import { createAccount, getAccount } from '@solana/spl-token';
import { solanaConnection, treasuryKeypair, usdcMint } from './solana.js';

/**
 * Creates a new SPL token account for USDC with owner = treasury.
 * This gives each order a unique deposit address without requiring memo matching.
 */
export async function createUsdcDepositTokenAccount(): Promise<string> {
  const connection = solanaConnection();
  const treasury = treasuryKeypair();
  const mint = usdcMint();

  // Create a new token account address (not ATA) for USDC.
  // The `Keypair` is only needed at creation-time; authority is the treasury.
  const newAccount = Keypair.generate();

  const pubkey = await createAccount(connection, treasury, mint, treasury.publicKey, newAccount);
  return pubkey.toBase58();
}

export async function getTokenAccountBalanceUi(tokenAccount: string): Promise<number> {
  const connection = solanaConnection();
  const acct = await getAccount(connection, new PublicKey(tokenAccount));
  // amount is bigint in base units; for MVP assume USDC has 6 decimals
  const ui = Number(acct.amount) / 1_000_000;
  return ui;
}
