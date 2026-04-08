import crypto from 'node:crypto';

export type PaystackEvent = {
  event: string;
  data: any;
};

function paystackKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error('PAYSTACK_SECRET_KEY is required');
  return key;
}

export function verifyPaystackWebhook({
  rawBody,
  signature,
}: {
  rawBody: string;
  signature: string | undefined;
}): boolean {
  const secret = process.env.PAYSTACK_WEBHOOK_SECRET;
  if (!secret) throw new Error('PAYSTACK_WEBHOOK_SECRET is required');
  if (!signature) return false;
  const hash = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
}

async function paystackFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`https://api.paystack.co${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${paystackKey()}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const json = (await res.json()) as any;
  if (!res.ok || json?.status === false) {
    throw new Error(`Paystack error (${res.status}): ${json?.message ?? res.statusText}`);
  }
  return json as T;
}

export async function createTransferRecipient(input: {
  name: string;
  account_number: string;
  bank_code: string;
  currency?: string;
}): Promise<{ recipient_code: string }> {
  type Resp = { status: true; data: { recipient_code: string } };
  const json = await paystackFetch<Resp>('/transferrecipient', {
    method: 'POST',
    body: JSON.stringify({
      type: 'nuban',
      name: input.name,
      account_number: input.account_number,
      bank_code: input.bank_code,
      currency: input.currency ?? 'NGN',
    }),
  });
  return { recipient_code: json.data.recipient_code };
}

export async function initiateTransfer(input: {
  amountNgn: number; // Paystack expects kobo for NGN
  recipient: string; // recipient_code
  reference: string;
  reason?: string;
}): Promise<{ transfer_code: string; reference: string; id: number }> {
  type Resp = {
    status: true;
    data: { transfer_code: string; reference: string; id: number };
  };

  const json = await paystackFetch<Resp>('/transfer', {
    method: 'POST',
    body: JSON.stringify({
      source: 'balance',
      amount: input.amountNgn,
      recipient: input.recipient,
      reference: input.reference,
      reason: input.reason,
    }),
  });

  return {
    transfer_code: json.data.transfer_code,
    reference: json.data.reference,
    id: json.data.id,
  };
}
