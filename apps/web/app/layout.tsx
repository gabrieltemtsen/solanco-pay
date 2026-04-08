import type { ReactNode } from 'react';

export const metadata = {
  title: 'Solanco Pay',
  description: 'Private merchant settlement from Solana USDC to NGN (Paystack)',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0 }}>{children}</body>
    </html>
  );
}
