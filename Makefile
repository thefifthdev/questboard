.PHONY: install setup dev dev-web dev-server build test contract-build contract-test contract-fmt contract-clippy bindings deploy clean

# QuestBoard local development entrypoints.
# Prerequisites: Node.js 20+, pnpm, Rust + the Stellar CLI (`cargo install --locked stellar-cli`).

install:
	pnpm install

# First-time setup: install deps, init the local SQLite DB, build the contract bindings.
setup: install
	cd server && pnpm db:push
	pnpm build:client
	@echo ""
	@echo "Setup complete. Copy web/.env.example -> web/.env and server/.env.example -> server/.env,"
	@echo "then run 'make dev' to start the API (:4000) and web app (:3000)."

dev-server:
	pnpm dev:server

dev-web:
	pnpm dev:web

# Run API and web app together.
dev:
	@trap 'kill 0' INT TERM; \
	pnpm dev:server & \
	pnpm dev:web & \
	wait

build:
	pnpm build

test:
	pnpm test

# ---- Soroban contract ----

contract-build:
	stellar contract build

contract-test:
	cargo test

contract-fmt:
	cargo fmt --check

contract-clippy:
	cargo clippy --all-targets -- -D warnings

# Regenerate the typed TS client from the deployed contract (set CONTRACT_ID + NETWORK).
bindings:
	stellar contract bindings typescript \
		--network $(or $(NETWORK),testnet) \
		--contract-id $(CONTRACT_ID) \
		--output-dir packages/quest-client --overwrite

# Deploy the contract to a network (set SOURCE to a funded identity).
deploy: contract-build
	stellar contract deploy \
		--wasm target/wasm32v1-none/release/quest_escrow.wasm \
		--source $(or $(SOURCE),questboard-deployer) \
		--network $(or $(NETWORK),testnet)

clean:
	cargo clean --manifest-path contracts/Cargo.toml
	rm -rf node_modules web/node_modules server/node_modules packages/*/node_modules
