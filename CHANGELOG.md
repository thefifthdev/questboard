# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- ⛓ `quest-escrow` Soroban contract: post / claim / submit / approve / cancel /
  reclaim-expired lifecycle with reward escrow, custom errors, events, and storage
  TTL management. 26 unit tests.
- 📦 `@questboard/quest-client` — typed TypeScript bindings generated from the
  deployed contract.
- 🌐 Next.js web app wired to Stellar testnet for the post → claim → submit →
  approve flow, with Freighter / Stellar Wallets Kit support.
- ⚙️ Express + Prisma metadata indexer storing off-chain quest briefs keyed by
  on-chain quest id.
- 📖 Architecture, deployment, local-runbook, contract-API, and security docs.
- 🔧 CI (lint / clippy / fmt / tests / build + WASM & bundle size budgets),
  secret scanning, dependency audit, and full contribution infrastructure.

### Deployed

- Testnet: `quest-escrow` at `CBKESO2WG5QWS2GJN7CBUCUQA7JGWGI3YG3BUAPUKAPLMWWSHPNAEBFY`.
