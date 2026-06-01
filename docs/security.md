# Security

## Reporting a vulnerability

Please **do not** open a public issue for security problems. Email
`security@questboard.dev` (or open a private GitHub security advisory) with steps
to reproduce. We aim to acknowledge within 72 hours.

## Contract security posture

- **No custodial admin.** There is no function that lets any account drain
  escrowed funds. Funds only ever move to the worker (on `approve`) or back to the
  owner (on `cancel` / `reclaim_expired`).
- **Authorization.** Every mutating call requires the relevant party's
  `require_auth()`: owner for `post`/`approve`/`cancel`/`reclaim`, the assigned
  worker for `submit`, and the claiming worker for `claim`.
- **State-machine guards.** Each transition checks the current status and returns
  `InvalidStatus` otherwise, preventing double-spends and out-of-order calls.
- **Input validation.** Rewards must be positive; deadlines cannot be in the past;
  metadata/submission pointers are length-bounded (512 bytes).
- **Integer safety.** The release profile enables `overflow-checks`.
- **Storage rent.** Persistent entries are TTL-bumped on access so live quests are
  not archived out from under the escrow.

## Known limitations (tracked as issues)

- No multi-approver / DAO release flow yet (planned).
- No dispute/arbitration path; approval is owner-only in the MVP.
- Reward token is not allow-listed on-chain — the UI defaults to native XLM.

## Testing

26 unit tests cover the happy path, every error branch, authorization, escrow
balance movements, and pagination. CI runs `cargo test`, `clippy -D warnings`,
and `cargo fmt --check` on every PR.
