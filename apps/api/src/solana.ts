import { Connection, Keypair, PublicKey } from '@solana/web3.js';

export function solanaConnection(): Connection {
  const rpc = process.env.SOLANA_RPC_URL;
  if (!rpc) throw new Error('SOLANA_RPC_URL is required');
  return new Connection(rpc, 'confirmed');
}

export function usdcMint(): PublicKey {
  const mint = process.env.USDC_MINT;
  if (!mint) throw new Error('USDC_MINT is required');
  return new PublicKey(mint);
}

export function treasuryKeypair(): Keypair {
  const b64 = process.env.SOLANA_TREASURY_KEYPAIR_B64;
  if (!b64) throw new Error('SOLANA_TREASURY_KEYPAIR_B64 is required');
  const raw = Buffer.from(b64, 'base64').toString('utf8');
  const secret = Uint8Array.from(JSON.parse(raw));
  return Keypair.fromSecretKey(secret);
}
