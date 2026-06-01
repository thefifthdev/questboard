# Deployment guide

## Prerequisites

```bash
cargo install --locked stellar-cli
rustup target add wasm32v1-none
stellar keys generate questboard-deployer --network testnet --fund
```

## 1. Build the contract

```bash
stellar contract build
# → target/wasm32v1-none/release/quest_escrow.wasm
```

The WASM must target `wasm32v1-none`. The plain `cargo build --target
wasm32-unknown-unknown` output enables reference-types the network rejects — use
`stellar contract build` (or the `make contract-build` target).

## 2. Deploy

```bash
stellar contract deploy \
  --wasm target/wasm32v1-none/release/quest_escrow.wasm \
  --source questboard-deployer --network testnet --alias quest_escrow
# → prints the contract id (C...)
```

The current testnet deployment is
`CBKESO2WG5QWS2GJN7CBUCUQA7JGWGI3YG3BUAPUKAPLMWWSHPNAEBFY`.

## 3. Regenerate the typed client

```bash
make bindings CONTRACT_ID=<new-id> NETWORK=testnet
pnpm build:client
```

## 4. Wire the apps

Set the contract id in the web app:

```
# web/.env.local
NEXT_PUBLIC_CONTRACT_ID=<new-id>
NEXT_PUBLIC_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_TOKEN=<reward-token-sac>
```

## 5. Verify

```bash
stellar contract invoke --id <new-id> --source questboard-deployer \
  --network testnet -- quest_count            # expect 0 on a fresh deploy
```

## Mainnet

Repeat with `--network mainnet` and a funded mainnet identity. Audit the
contract and pin the reward token list before mainnet use.
