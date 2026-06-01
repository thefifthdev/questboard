use soroban_sdk::{contracttype, Address, String};

/// Lifecycle state of a quest.
///
/// ```text
/// Open ──claim──> Claimed ──submit──> Submitted ──approve──> Approved
///   │                │                    │
///   │cancel          │reclaim_expired     │ (owner reviews, then approves)
///   ▼                ▼
/// Cancelled       Cancelled (refund to owner)
/// ```
#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum QuestStatus {
    /// Posted with reward locked in escrow; open for any worker to claim.
    Open,
    /// A worker has claimed the quest and is working on it.
    Claimed,
    /// The worker has submitted a deliverable and is awaiting owner review.
    Submitted,
    /// The owner approved the work; the reward has been released to the worker.
    Approved,
    /// The quest was cancelled (or reclaimed after expiry); reward refunded to owner.
    Cancelled,
}

/// A single bounty escrow record.
///
/// `metadata` and `submission` hold short off-chain pointers (an HTTPS URL or
/// content hash) rather than full text, keeping on-chain storage cheap. The
/// human-readable title/description/acceptance-criteria live in the indexer DB.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Quest {
    /// Monotonic identifier assigned at creation.
    pub id: u64,
    /// Account that posted the quest and funded the escrow.
    pub owner: Address,
    /// Account that claimed the quest, if any.
    pub worker: Option<Address>,
    /// SEP-41 token the reward is denominated in (e.g. USDC, XLM wrapper).
    pub token: Address,
    /// Reward amount held in escrow, in the token's smallest unit.
    pub reward: i128,
    /// Current lifecycle state.
    pub status: QuestStatus,
    /// Off-chain pointer to the quest brief (URL or hash).
    pub metadata: String,
    /// Off-chain pointer to the worker's deliverable (empty until submitted).
    pub submission: String,
    /// Ledger timestamp (unix seconds) at creation.
    pub created_at: u64,
    /// Unix-seconds deadline for submission; `0` means no deadline.
    pub deadline: u64,
}

/// Storage keys for the contract.
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    /// Monotonic counter for the next quest id (instance storage).
    QuestCount,
    /// A quest record keyed by its id (persistent storage).
    Quest(u64),
}
