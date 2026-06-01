# Local runbook

From a clean checkout to a working local stack.

```bash
nvm use                 # Node 20 (see .nvmrc)
make setup              # install deps, push SQLite schema, build the typed client

cp server/.env.example server/.env
cp web/.env.example web/.env.local

make dev                # API → http://localhost:4000, web → http://localhost:3000
```

## Smoke test the API

```bash
curl http://localhost:4000/health
curl -X POST http://localhost:4000/api/quests \
  -H 'content-type: application/json' \
  -d '{"title":"Test","description":"Demo","reward":"100000000"}'
curl http://localhost:4000/api/quests
```

## Smoke test the contract (testnet)

```bash
stellar contract invoke --id CBKESO2WG5QWS2GJN7CBUCUQA7JGWGI3YG3BUAPUKAPLMWWSHPNAEBFY \
  --source questboard-deployer --network testnet -- quest_count
```

## Run the test suites

```bash
cargo test            # contract (26 tests)
pnpm test             # server API (vitest + supertest)
```

## Troubleshooting

- **Wallet won't connect** — make sure Freighter is set to **Testnet** and the
  account is funded (friendbot).
- **`reference-types not enabled` on deploy** — build with `stellar contract
  build`, not `cargo build --target wasm32-unknown-unknown`.
- **Empty quest list** — the indexer (`server/`) is optional; the app still reads
  quests directly from the contract.
