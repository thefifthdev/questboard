# QuestBoard 🎯

> On-chain bounty board for the Stellar ecosystem. Post tasks, earn USDC, build reputation — all trustlessly on Soroban.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Stellar](https://img.shields.io/badge/Built%20on-Stellar-black)](https://stellar.org)
[![Soroban](https://img.shields.io/badge/Powered%20by-Soroban-purple)](https://soroban.stellar.org)
[![USDC](https://img.shields.io/badge/Rewards-USDC%20%2F%20XLM-2775CA)]()
[![Status](https://img.shields.io/badge/Status-Active%20Development-green)]()

---

## Overview

QuestBoard is a decentralized bounty and task coordination platform built natively on Stellar. Projects post tasks with USDC or XLM rewards locked in Soroban escrow. Contributors claim, complete, and get paid — on-chain, automatically, without gatekeepers.

It's Gitcoin meets Dework, built for the Stellar ecosystem, and designed to fund the open-source work that makes the ecosystem grow.

---

## The Problem

Open-source and Web3 projects need contributors. Contributors need fair, reliable compensation. The existing solutions fail both sides:

- **Gitcoin** is Ethereum-native with high gas overhead — not practical for small bounties
- **Dework** is centralized — platform holds funds, can freeze payouts
- **GitHub Issues** have no payment layer at all
- **Direct hiring** requires trust, contracts, and invoicing overhead

The result: critical ecosystem work goes unfunded, talented contributors go unpaid, and projects burn out their core team doing everything themselves.

---

## How QuestBoard Works

### For Project Owners

Post a Quest with a USDC/XLM reward locked in Soroban escrow. Define acceptance criteria. When a contributor delivers work that meets the criteria, release the reward directly from the smart contract. No platform holding your budget, no surprise fees.

### For Contributors

Browse open Quests, claim one, submit your work, and get paid when the owner approves. Your on-chain history becomes your verifiable portfolio — every completed Quest, every reward received, permanently on Stellar.

### For DAOs

QuestBoard supports multi-approver Quests where payment requires M-of-N DAO signers to release. Perfect for community-governed projects that need decentralized oversight of contributor payouts.

---

## Quest Lifecycle

```
POST     Owner creates Quest with reward locked in escrow
         → Quest is publicly visible and claimable

CLAIMED  Contributor claims the Quest (one at a time, or open competition)
         → Work begins, deadline starts

SUBMITTED Contributor submits deliverable (PR link, IPFS file, description)
         → Owner enters review window

APPROVED  Owner approves submission
         → Soroban escrow releases USDC/XLM to contributor instantly ✅

DISPUTED  If owner disputes quality
         → Community arbitrator panel reviews within 72 hours

EXPIRED   If deadline passes with no submission
         → Reward auto-returns to owner
```

---

## Quest Types

### Standard Quest
One contributor claims, completes, and gets paid. Best for focused tasks with clear scope.

### Open Competition
Multiple contributors submit work. Owner picks the winner; runner-up rewards optional. Best for creative work like design, writing, or naming.

### Milestone Quest
Large projects split into sequential milestones, each with its own escrow release. Contributor builds progressively, owner pays progressively.

### Recurring Quest
The same task repeats on a schedule (weekly reports, monthly audits). Escrow auto-refills from an owner-funded pool. Best for ongoing work.

---

## Smart Contract Interface

```rust
// Post a new Quest with rewards locked in escrow
fn post_quest(
    env: Env,
    owner: Address,
    title: String,
    description_hash: BytesN<32>,  // IPFS hash of full description
    reward_asset: Address,
    reward_amount: i128,
    quest_type: QuestType,
    deadline: u64,
    max_claimants: u32,
) -> QuestId;

// Contributor claims a Quest
fn claim_quest(env: Env, contributor: Address, quest_id: u64);

// Contributor submits work
fn submit_quest(
    env: Env,
    contributor: Address,
    quest_id: u64,
    submission_hash: BytesN<32>,   // IPFS hash of deliverable
);

// Owner approves and releases reward
fn approve_submission(env: Env, owner: Address, quest_id: u64, submission_id: u64);

// Open dispute on a submission
fn dispute_submission(env: Env, owner: Address, quest_id: u64, submission_id: u64, reason: String);

// Cancel unclaimed Quest and recover escrow
fn cancel_quest(env: Env, owner: Address, quest_id: u64);

// DAO multi-sig approval
fn dao_approve(env: Env, signer: Address, quest_id: u64, submission_id: u64);
```

---

## Quest Explorer

The QuestBoard frontend provides a rich discovery experience:

**Filters**: Category, reward range, deadline, skill tags, quest type, DAO/project owner  
**Sort**: Highest reward, newest, ending soon, most claimed  
**Tags**: `rust`, `soroban`, `frontend`, `design`, `documentation`, `security`, `research`, `community`

Every Quest links directly to its Soroban escrow contract — contributors can verify funds are locked before investing a single minute of work.

---

## Contributor Profile

```
Contributor: GXXX...
Display Name: @alice.stellar
Quests Completed: 34
Total Earned: 3,420 USDC
Approval Rate: 97%
Skills: rust, soroban, smart-contracts, security

Recent Quests:
  ✅ Implement vToken exchange rate formula — Vaultex — 200 USDC
  ✅ Write SEP-41 integration guide — StellarForge — 150 USDC
  ✅ Audit escrow contract edge cases — TrustCart — 500 USDC
```

Profiles are built from on-chain activity — no self-reported credentials, no fake reviews. Every entry is a Stellar transaction.

---

## DAO Integration

QuestBoard supports any Stellar-based DAO or multisig. Configure your Quest to require N-of-M approvals from designated signers before escrow releases.

```typescript
import { QuestBoardSDK } from '@questboard/sdk';

const qb = new QuestBoardSDK({ network: 'mainnet' });

// Post a Quest requiring 2 of 3 DAO approvals
const quest = await qb.postQuest({
  title: 'Implement governance voting contract',
  reward: { asset: 'USDC', amount: '800' },
  deadline: Date.now() + 7 * 24 * 60 * 60 * 1000,  // 7 days
  approvalMode: 'multisig',
  signers: ['GXXX...', 'GYYY...', 'GZZZ...'],
  requiredApprovals: 2,
  tags: ['rust', 'soroban', 'governance'],
});

console.log(`Quest posted: ${quest.id}`);
```

---

## Ecosystem Impact

QuestBoard is built for the Stellar ecosystem and is directly useful to every project in it:

- **Protocol teams** use it to fund external audits, integrations, and documentation
- **dApp developers** post bounties for design, testing, and feature development
- **The Stellar Development Foundation** can coordinate ecosystem grant work on-chain
- **Individual contributors** build verifiable, paid track records in the ecosystem

In time, QuestBoard becomes the coordination layer for all Stellar ecosystem work — a living, on-chain record of what gets built, who built it, and what it was worth.

---

## Getting Started

```bash
git clone https://github.com/your-org/questboard
cd questboard

# Install dependencies
npm install

# Build Soroban contracts
cd contracts
cargo build --target wasm32-unknown-unknown --release
cargo test

# Deploy to testnet
./scripts/deploy-testnet.sh

# Start frontend
cd ../app
npm run dev
# → http://localhost:3000
```

### Environment Setup

```env
STELLAR_NETWORK=testnet
HORIZON_URL=https://horizon-testnet.stellar.org
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
USDC_CONTRACT=CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA
IPFS_GATEWAY=https://gateway.pinata.cloud
PINATA_API_KEY=your_key_here
```

---

## Roadmap

**v1.0 — Current**
- Standard and open competition Quests
- Soroban escrow for all rewards
- USDC and XLM rewards
- On-chain contributor profiles
- Basic dispute arbitration

**v1.1**
- Milestone Quests
- Recurring Quests
- DAO multi-sig approvals
- GitHub issue sync (auto-post bounties from labeled issues)
- Email/push notifications

**v2.0**
- QuestBoard governance token
- Arbitrator staking and reputation
- Project treasury management
- Cross-ecosystem Quest support
- Analytics and ecosystem health dashboard

---

## Contributing

QuestBoard is itself an ideal candidate for bounty-funded development. We eat our own cooking — open issues are tagged with reward estimates and will be funded as the protocol grows.

Current high-priority areas: Soroban contract development, React frontend, IPFS integration, GitHub Actions sync, and dispute resolution UX. See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

MIT © QuestBoard Contributors

---

*QuestBoard is the coordination layer for Stellar ecosystem work. Every Quest completed makes the ecosystem stronger.*
