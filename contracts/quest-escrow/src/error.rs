use soroban_sdk::contracterror;

/// Errors returned by the QuestBoard escrow contract.
///
/// Each variant maps to a stable `u32` code so that off-chain clients (the web
/// app and indexer) can branch on failures deterministically.
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    /// No quest exists for the supplied id.
    QuestNotFound = 1,
    /// The caller is not allowed to perform this action on the quest.
    Unauthorized = 2,
    /// The quest is not in a state that allows this transition.
    InvalidStatus = 3,
    /// The reward amount must be strictly greater than zero.
    InvalidReward = 4,
    /// The supplied deadline is in the past.
    InvalidDeadline = 5,
    /// The metadata pointer exceeds the maximum allowed length.
    MetadataTooLong = 6,
    /// The submission pointer exceeds the maximum allowed length.
    SubmissionTooLong = 7,
    /// The quest has no assigned worker for this operation.
    NoWorker = 8,
    /// The quest deadline has not yet passed, so it cannot be reclaimed.
    DeadlineNotReached = 9,
    /// The quest has no deadline, so it can never expire/be reclaimed.
    NoDeadline = 10,
}
