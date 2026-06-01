# Contract API — `quest-escrow`

Soroban SDK 22. Testnet deployment:
`CBKESO2WG5QWS2GJN7CBUCUQA7JGWGI3YG3BUAPUKAPLMWWSHPNAEBFY`.

## Types

### `Quest`

| Field        | Type             | Notes                                        |
| ------------ | ---------------- | -------------------------------------------- |
| `id`         | `u64`            | Monotonic id assigned at creation.           |
| `owner`      | `Address`        | Posted and funded the quest.                 |
| `worker`     | `Option<Address>`| Set on claim.                                |
| `token`      | `Address`        | SEP-41 reward token.                         |
| `reward`     | `i128`           | Amount in escrow (smallest unit).            |
| `status`     | `QuestStatus`    | Open / Claimed / Submitted / Approved / Cancelled. |
| `metadata`   | `String`         | Off-chain pointer (≤ 512 bytes).             |
| `submission` | `String`         | Deliverable pointer (≤ 512 bytes).           |
| `created_at` | `u64`            | Ledger timestamp.                            |
| `deadline`   | `u64`            | Unix seconds; `0` = none.                    |

## Mutating functions

| Function          | Auth        | Pre-state | Effect                                          |
| ----------------- | ----------- | --------- | ----------------------------------------------- |
| `post_quest(owner, token, reward, deadline, metadata) -> u64` | `owner` | — | Locks `reward` in escrow; returns the new id. |
| `claim(quest_id, worker)`     | `worker` | Open      | Assigns worker; → Claimed.                  |
| `submit(quest_id, submission)`| worker   | Claimed   | Records deliverable; → Submitted.           |
| `approve(quest_id)`           | `owner`  | Submitted | Releases reward to worker; → Approved.      |
| `cancel(quest_id)`            | `owner`  | Open      | Refunds owner; → Cancelled.                 |
| `reclaim_expired(quest_id)`   | `owner`  | Claimed & past deadline | Refunds owner; → Cancelled.   |

## Read-only views

| Function                          | Returns       |
| --------------------------------- | ------------- |
| `get_quest(quest_id) -> Quest`    | A single quest. |
| `quest_count() -> u64`            | Total posted (next id). |
| `list_quests(start, limit) -> Vec<Quest>` | Page (limit capped at 100). |

## Errors

| Code | Name                | Meaning                                   |
| ---- | ------------------- | ----------------------------------------- |
| 1    | QuestNotFound       | No quest with that id.                     |
| 2    | Unauthorized        | Caller not allowed.                        |
| 3    | InvalidStatus       | Wrong state for this transition.           |
| 4    | InvalidReward       | Reward must be > 0.                        |
| 5    | InvalidDeadline     | Deadline is in the past.                   |
| 6    | MetadataTooLong     | Metadata > 512 bytes.                      |
| 7    | SubmissionTooLong   | Submission > 512 bytes.                    |
| 8    | NoWorker            | Operation needs an assigned worker.        |
| 9    | DeadlineNotReached  | Cannot reclaim before the deadline.        |
| 10   | NoDeadline          | Quest has no deadline to expire.           |

## Events

| Topic         | Data                  |
| ------------- | --------------------- |
| `posted`, id  | `(owner, reward)`     |
| `claimed`, id | `worker`              |
| `submitted`, id | `worker`            |
| `approved`, id | `(worker, reward)`   |
| `cancelled`, id | `owner`             |
| `reclaimed`, id | `owner`             |

## Example (CLI)

```bash
stellar contract invoke --id $CONTRACT_ID --source me --network testnet \
  -- post_quest --owner $ME --token $XLM_SAC --reward 100000000 --deadline 0 \
  --metadata "ipfs://brief"
```
