# Contributing to QuestBoard

Thanks for helping build trustless bounties on Stellar! This guide gets you from
a clean checkout to passing checks.

## Table of contents

- [Prerequisites](#prerequisites)
- [First-time setup](#first-time-setup)
- [Running locally](#running-locally)
- [Project layout](#project-layout)
- [Running checks](#running-checks)
- [Commit conventions](#commit-conventions)
- [Stellar Wave / Drips](#stellar-wave--drips)

## Prerequisites

| Tool        | Version | Notes                                              |
| ----------- | ------- | -------------------------------------------------- |
| Node.js     | ≥ 20    | Use `nvm use` (see `.nvmrc`).                       |
| pnpm        | ≥ 9     | `npm i -g pnpm`                                     |
| Rust        | stable  | `rustup` toolchain.                                 |
| Stellar CLI | ≥ 22    | `cargo install --locked stellar-cli`               |
| wasm target | —       | `rustup target add wasm32v1-none`                  |

## First-time setup

```bash
git clone https://github.com/thefifthdev/questboard.git
cd questboard
make setup          # installs deps, pushes the local DB, builds the typed client
cp web/.env.example web/.env.local
cp server/.env.example server/.env
```

## Running locally

```bash
make dev            # API on :4000 and web on :3000
# or individually:
make dev-server
make dev-web
```

Connect Freighter (set to **Testnet**) in the web app to post and claim quests.

## Project layout

| Path                      | What it is                                              |
| ------------------------- | ------------------------------------------------------- |
| `contracts/quest-escrow/` | The Soroban escrow contract (Rust).                     |
| `packages/quest-client/`  | Typed TS bindings generated from the deployed contract. |
| `server/`                 | Express + Prisma off-chain metadata indexer.            |
| `web/`                    | Next.js app wired to testnet.                           |
| `docs/`                   | Architecture, deployment, contract API, security.       |

## Running checks

These mirror CI — run them before opening a PR:

```bash
# Contract
cargo fmt --check
cargo clippy --all-targets -- -D warnings
cargo test

# JS/TS
pnpm lint
pnpm format:check
pnpm test
pnpm build
```

## Commit conventions

We use [Conventional Commits](https://www.conventionalcommits.org/): `feat:`,
`fix:`, `docs:`, `refactor:`, `test:`, `ci:`, `chore:`. Keep the subject under
72 characters and in the imperative mood.

## Stellar Wave / Drips

QuestBoard participates in the **Stellar Wave Program** via
[Drips](https://www.drips.network/). Issues labeled **`Stellar Wave`** and
**`good first issue`** are open for contributors to pick up and earn rewards.
Comment on an issue to get it assigned before you start.
