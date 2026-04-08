# solanco-pay

Solanco Pay is a **Solana USDC → NGN** offramp prototype designed for a clean, fintech-like UX (not P2P-looking).

Core idea:
- Users pay **USDC on Solana**.
- Liquidity providers **pre-fund NGN** into the platform’s **Paystack balance**.
- The platform executes NGN payouts via **Paystack Transfer API**.

## Why this exists
Two problems we solve:
1) **Offramp UX in Nigeria**: make cashing out USDC straightforward with bank payouts.
2) **Onchain financial privacy (Umbra track)**: users/merchants shouldn’t have to expose wallet balances, cashout amounts, or payment history publicly to use an offramp.

Privacy is central: the default flow uses **Umbra** so deposits/cashout funding can be done privately, with **selective disclosure** available when needed.

## Target users
- **Merchants** receiving USDC on Solana who want **private settlement** to NGN bank accounts.
- (Later) individuals cashing out USDC privately.

## Components (planned)
- `apps/web`: Offramp UI (merchant settlement + order status)
- `apps/api`: Backend (Paystack integration, webhooks, ledger, reconciliation)
- `programs/*`: Solana programs (minimal where needed)
- `packages/sdk`: JS/TS SDK for integrators

## Milestones
See: [MILESTONES.md](./MILESTONES.md)

## Non-goals (MVP)
- Multi-country payouts
- Permissionless providers
- Fully trustless fiat settlement (Paystack is a custodial rail)

## License
MIT (proposed)
