# QuestBoard 🎯

> On-chain bounty board for the Stellar ecosystem. Post tasks, earn rewards, build reputation — all trustlessly on Soroban.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Stellar](https://img.shields.io/badge/Built%20on-Stellar-black)](https://stellar.org)
[![Soroban](https://img.shields.io/badge/Powered%20by-Soroban-purple)](https://soroban.stellar.org)
[![Status](https://img.shields.io/badge/Status-MVP%20on%20Testnet-2dd4bf)]()

QuestBoard is a decentralized bounty platform built natively on Stellar. Projects
post tasks with a reward locked in Soroban escrow. Contributors claim, complete,
and get paid — on-chain, automatically, without a platform holding the funds.

**Live on testnet:** contract
[`CBKESO2WG5QWS2GJN7CBUCUQA7JGWGI3YG3BUAPUKAPLMWWSHPNAEBFY`](https://stellar.expert/explorer/testnet/contract/CBKESO2WG5QWS2GJN7CBUCUQA7JGWGI3YG3BUAPUKAPLMWWSHPNAEBFY)

---

## The problem

Open-source and Web3 projects need contributors; contributors need fair, reliable
pay. Gitcoin is Ethereum-native with high gas overhead for small bounties; Dework
is centralized and can freeze payouts; GitHub Issues have no payment layer. The
result: critical ecosystem work goes unfunded and contributors go unpaid.

## How it works

```
POST      Owner posts a quest with a reward locked in Soroban escrow
CLAIM     A contributor claims the quest and starts work
SUBMIT    The contributor submits a deliverable (PR link, IPFS, doc)
APPROVE   The owner approves → escrow releases the reward to the worker
          (or CANCEL while open / RECLAIM after the deadline → refund)
```

The contract is the source of truth for **money and state**. No platform holds
your budget; there is no admin that can drain escrow. The only path that pays a
worker is the owner's `approve`.

## Architecture

```
Web (Next.js) ──wallet-signed tx──► quest-escrow (Soroban)  ◄── reads
     │                                  reward escrow + lifecycle + events
     └──REST──► server (Express+Prisma): off-chain quest briefs by quest id
```

See [`docs/architecture.md`](docs/architecture.md) for the full design and trust model.

## Tech stack

| Layer    | Technology                                                        |
| -------- | ----------------------------------------------------------------- |
| Contract | Rust · Soroban SDK 22 · `wasm32v1-none`                            |
| Client   | Typed TS bindings (`@questboard/quest-client`)                    |
| Web      | Next.js (App Router) · Tailwind · TanStack Query · Wallets Kit    |
| Server   | Express · Prisma · SQLite (dev) / Postgres (prod) · Zod           |
| Tooling  | pnpm workspace · GitHub Actions · gitleaks · Conventional Commits |

## Getting started

```bash
# Prerequisites: Node 20+, pnpm 9+, Rust, Stellar CLI, wasm32v1-none target
git clone https://github.com/thefifthdev/questboard.git
cd questboard
make setup
cp web/.env.example web/.env.local
cp server/.env.example server/.env
make dev     # API :4000 + web :3000
```

Connect Freighter (Testnet) and post your first quest. Full steps:
[`docs/local-runbook.md`](docs/local-runbook.md).

## Project structure

| Path                      | Description                                       |
| ------------------------- | ------------------------------------------------- |
| `contracts/quest-escrow/` | Soroban escrow contract + 26 unit tests.          |
| `packages/quest-client/`  | Generated typed contract bindings.                |
| `server/`                 | Off-chain metadata indexer (Express+Prisma).      |
| `web/`                    | Next.js app wired to testnet.                     |
| `docs/`                   | Architecture, deployment, contract API, security. |

## Documentation

- [Architecture](docs/architecture.md)
- [Contract API](docs/contract-api.md)
- [Deployment guide](docs/deployment-guide.md)
- [Local runbook](docs/local-runbook.md)
- [Security](docs/security.md)

## Roadmap

- [x] Escrow contract (post / claim / submit / approve / cancel / reclaim)
- [x] Testnet deployment + typed client + web app
- [x] Off-chain metadata indexer
- [ ] DAO multi-approver (M-of-N) release — _good first issues open_
- [ ] On-chain reputation / completed-quest history
- [ ] Dispute & arbitration flow
- [ ] Mainnet launch

## Contributing & Stellar Wave

QuestBoard participates in the **Stellar Wave Program** via
[Drips](https://www.drips.network/). Pick up an issue labeled **`Stellar Wave`**
or **`good first issue`** to earn contributor rewards. Start with
[CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE).
