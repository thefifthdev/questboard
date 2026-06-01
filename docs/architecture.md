# Architecture

QuestBoard is a three-layer system: an on-chain escrow contract holds funds and
enforces the quest lifecycle, an off-chain indexer stores human-readable briefs,
and a web app ties them together with wallet-signed transactions.

```
┌──────────────┐     wallet-signed tx      ┌────────────────────────┐
│   Web (Next) │ ────────────────────────► │  quest-escrow (Soroban)│
│              │ ◄──────  reads  ────────── │  • reward escrow       │
│  Freighter / │                            │  • lifecycle state     │
│  Wallets Kit │                            │  • events              │
└──────┬───────┘                            └────────────────────────┘
       │ REST (titles, descriptions)
       ▼
┌──────────────┐
│ server (API) │  Express + Prisma + SQLite/Postgres
│  QuestMeta   │  keyed by on-chain quest id
└──────────────┘
```

## Why split on-chain / off-chain?

On-chain storage is expensive and public. We keep only what must be trustless on
the contract — the escrowed reward, the owner/worker addresses, the lifecycle
status, and a short `metadata` pointer. Rich text (titles, descriptions,
acceptance criteria, deliverable bodies) lives in the indexer, referenced by the
pointer. The contract is the source of truth for **money and state**; the indexer
is a convenience layer for **content**.

## Contract state machine

```
Open ──claim──► Claimed ──submit──► Submitted ──approve──► Approved
  │                │                                 (reward → worker)
  │ cancel         │ reclaim_expired (after deadline)
  ▼                ▼
Cancelled        Cancelled  (reward → owner)
```

- **post_quest** moves `reward` of `token` from the owner into the contract.
- **approve** is the only path that releases funds to the worker.
- **cancel** (while Open) and **reclaim_expired** (Claimed, past deadline) refund
  the owner. There is no path that lets the contract keep funds.

## Storage & rent

Quest records are persistent entries bumped ~30 days on every access; the
instance entry (the id counter) is bumped ~14 days on every invocation. Actively
used quests never expire. See `contracts/quest-escrow/src/storage.rs`.

## Trust model

- The contract never has an admin that can move escrowed funds.
- Only the assigned worker can submit; only the owner can approve/cancel.
- The off-chain indexer cannot move funds or change state — if it is down, the
  web app falls back to on-chain-only data.
