# Solanco Pay — Milestones

Assumption: **Nigeria-only**, **USDC-only**, permissioned/KYC’d providers, payouts via **Paystack Transfer API**.

## Milestone 0 — Repo + Foundations (Day 0–1)
**Deliverables**
- Monorepo structure (`apps/`, `packages/`, `programs/`)
- Env + config templates (`.env.example`)
- CI (lint/test placeholder) + formatting
- High-level docs (README) + architecture diagram (simple)

**Acceptance**
- New dev can run `pnpm i` (or `npm i`) and start web + api locally.

---

## Milestone 1 — Offramp Core (Week 1)
**Goal**: end-to-end offramp order lifecycle (without Umbra privacy yet).

**Deliverables**
- Create offramp order (amount, recipient bank details)
- Detect USDC deposit on Solana (Devnet)
- Trigger Paystack Transfer + handle idempotency
- Paystack webhook verification + order status updates
- Admin view for orders

**Acceptance**
- Demo: user pays devnet USDC → Paystack transfer is created → webhook updates order to `paid`.

---

## Milestone 2 — Provider Liquidity + Ledger (Week 2)
**Goal**: providers pre-fund NGN float; system tracks balances and fees.

**Deliverables**
- Provider model (KYC status, limits)
- Internal NGN ledger (provider balances, fees, debits)
- Provider deposit workflow (manual + reconciliation hooks)
- Payout routing policy (choose provider based on available NGN balance + limits)
- Provider dashboard (balance, history)

**Fees**
- Provider earns fees credited to their **internal NGN balance** (MVP). (Optional later: USDC fee payout.)

**Acceptance**
- Admin can assign/auto-route payouts against provider balances.
- Ledger reconciles: starting balance − payouts + fees = ending balance.

---

## Milestone 3 — Umbra Privacy Integration (Week 3)
**Goal**: make privacy central: private funding + selective disclosure.

**Deliverables**
- Umbra SDK integration for **private USDC funding** (default)
- Privacy-first merchant settlement flow (default)
- “Disclosure bundle” generation (viewing key / proof artifact) for selective compliance
- Docs: what is private, what isn’t (fiat side), threat model

**Acceptance**
- Demo: merchant funds cashout privately → platform processes payout → public chain does not trivially reveal merchant’s main wallet balances/relationships.

---

## Milestone 4 — Production Hardening + Demo Package (Week 4)
**Goal**: ship a submission-grade prototype.

**Deliverables**
- Rate limits + per-user/provider caps
- Manual review thresholds
- Reconciliation job vs Paystack balance and transfer history
- Audit logs (immutable append-only table)
- Full README: build/run/test instructions
- 3–5 min demo video script + recording checklist

**Acceptance**
- One command deploy (or clear deployment steps)
- Repeatable demo on devnet with stable results

---

## Stretch
- QuickNode integration (webhooks/indexing) for deposit detection
- Solana Pay checkout links for merchants
- Multi-bank verification improvements
