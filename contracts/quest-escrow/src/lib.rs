#![no_std]
//! # QuestBoard Escrow
//!
//! A trustless bounty board for the Stellar ecosystem. A quest owner posts a
//! task with a reward locked in escrow; a worker claims it, submits a
//! deliverable, and the owner releases the reward on approval — all on-chain,
//! with no platform holding funds.
//!
//! Rewards are any SEP-41 token (USDC, an XLM wrapper, etc.). Off-chain text
//! (titles, descriptions, acceptance criteria, deliverable bodies) is referenced
//! by short pointers in `metadata`/`submission` and served by the indexer.

mod error;
mod storage;
mod types;

#[cfg(test)]
mod test;

pub use error::Error;
pub use types::{DataKey, Quest, QuestStatus};

use soroban_sdk::{contract, contractimpl, symbol_short, token, Address, Env, String, Vec};

/// Maximum length, in bytes, of an off-chain metadata/submission pointer.
const MAX_POINTER_LEN: u32 = 512;

#[contract]
pub struct QuestEscrow;

#[contractimpl]
impl QuestEscrow {
    /// Post a new quest, locking `reward` of `token` from `owner` into escrow.
    ///
    /// * `deadline` — unix-seconds submission deadline, or `0` for no deadline.
    /// * `metadata` — short off-chain pointer (URL/hash) to the quest brief.
    ///
    /// Returns the new quest id. Requires `owner` authorization (and, via the
    /// token transfer, authorization to move the reward).
    pub fn post_quest(
        env: Env,
        owner: Address,
        token: Address,
        reward: i128,
        deadline: u64,
        metadata: String,
    ) -> Result<u64, Error> {
        owner.require_auth();

        if reward <= 0 {
            return Err(Error::InvalidReward);
        }
        if metadata.len() > MAX_POINTER_LEN {
            return Err(Error::MetadataTooLong);
        }
        let now = env.ledger().timestamp();
        if deadline != 0 && deadline <= now {
            return Err(Error::InvalidDeadline);
        }

        // Move the reward into the contract's escrow balance.
        token::Client::new(&env, &token).transfer(&owner, &env.current_contract_address(), &reward);

        let id = storage::quest_count(&env);
        let quest = Quest {
            id,
            owner: owner.clone(),
            worker: None,
            token,
            reward,
            status: QuestStatus::Open,
            metadata,
            submission: String::from_str(&env, ""),
            created_at: now,
            deadline,
        };
        storage::set_quest(&env, &quest);
        storage::set_quest_count(&env, id + 1);
        storage::extend_instance(&env);

        env.events()
            .publish((symbol_short!("posted"), id), (owner, reward));
        Ok(id)
    }

    /// Claim an open quest. Requires `worker` authorization.
    pub fn claim(env: Env, quest_id: u64, worker: Address) -> Result<(), Error> {
        worker.require_auth();

        let mut quest = storage::get_quest(&env, quest_id).ok_or(Error::QuestNotFound)?;
        if quest.status != QuestStatus::Open {
            return Err(Error::InvalidStatus);
        }

        quest.worker = Some(worker.clone());
        quest.status = QuestStatus::Claimed;
        storage::set_quest(&env, &quest);
        storage::extend_instance(&env);

        env.events()
            .publish((symbol_short!("claimed"), quest_id), worker);
        Ok(())
    }

    /// Submit a deliverable for a claimed quest. Requires the assigned worker's
    /// authorization. `submission` is a short off-chain pointer (URL/hash).
    pub fn submit(env: Env, quest_id: u64, submission: String) -> Result<(), Error> {
        if submission.len() > MAX_POINTER_LEN {
            return Err(Error::SubmissionTooLong);
        }

        let mut quest = storage::get_quest(&env, quest_id).ok_or(Error::QuestNotFound)?;
        if quest.status != QuestStatus::Claimed {
            return Err(Error::InvalidStatus);
        }
        let worker = quest.worker.clone().ok_or(Error::NoWorker)?;
        worker.require_auth();

        quest.submission = submission;
        quest.status = QuestStatus::Submitted;
        storage::set_quest(&env, &quest);
        storage::extend_instance(&env);

        env.events()
            .publish((symbol_short!("submitted"), quest_id), worker);
        Ok(())
    }

    /// Approve a submitted quest, releasing the escrowed reward to the worker.
    /// Requires the quest owner's authorization.
    pub fn approve(env: Env, quest_id: u64) -> Result<(), Error> {
        let mut quest = storage::get_quest(&env, quest_id).ok_or(Error::QuestNotFound)?;
        quest.owner.require_auth();

        if quest.status != QuestStatus::Submitted {
            return Err(Error::InvalidStatus);
        }
        let worker = quest.worker.clone().ok_or(Error::NoWorker)?;

        token::Client::new(&env, &quest.token).transfer(
            &env.current_contract_address(),
            &worker,
            &quest.reward,
        );

        quest.status = QuestStatus::Approved;
        storage::set_quest(&env, &quest);
        storage::extend_instance(&env);

        env.events().publish(
            (symbol_short!("approved"), quest_id),
            (worker, quest.reward),
        );
        Ok(())
    }

    /// Cancel an open (unclaimed) quest, refunding the escrow to the owner.
    /// Requires the quest owner's authorization.
    pub fn cancel(env: Env, quest_id: u64) -> Result<(), Error> {
        let mut quest = storage::get_quest(&env, quest_id).ok_or(Error::QuestNotFound)?;
        quest.owner.require_auth();

        if quest.status != QuestStatus::Open {
            return Err(Error::InvalidStatus);
        }

        token::Client::new(&env, &quest.token).transfer(
            &env.current_contract_address(),
            &quest.owner,
            &quest.reward,
        );

        quest.status = QuestStatus::Cancelled;
        storage::set_quest(&env, &quest);
        storage::extend_instance(&env);

        env.events()
            .publish((symbol_short!("cancelled"), quest_id), quest.owner.clone());
        Ok(())
    }

    /// Reclaim a claimed quest whose deadline has passed without a submission,
    /// refunding the escrow to the owner. Protects owners from workers who claim
    /// but never deliver. Requires the quest owner's authorization.
    pub fn reclaim_expired(env: Env, quest_id: u64) -> Result<(), Error> {
        let mut quest = storage::get_quest(&env, quest_id).ok_or(Error::QuestNotFound)?;
        quest.owner.require_auth();

        if quest.status != QuestStatus::Claimed {
            return Err(Error::InvalidStatus);
        }
        if quest.deadline == 0 {
            return Err(Error::NoDeadline);
        }
        if env.ledger().timestamp() <= quest.deadline {
            return Err(Error::DeadlineNotReached);
        }

        token::Client::new(&env, &quest.token).transfer(
            &env.current_contract_address(),
            &quest.owner,
            &quest.reward,
        );

        quest.status = QuestStatus::Cancelled;
        storage::set_quest(&env, &quest);
        storage::extend_instance(&env);

        env.events()
            .publish((symbol_short!("reclaimed"), quest_id), quest.owner.clone());
        Ok(())
    }

    // ---- Read-only views -------------------------------------------------

    /// Fetch a single quest by id.
    pub fn get_quest(env: Env, quest_id: u64) -> Result<Quest, Error> {
        storage::get_quest(&env, quest_id).ok_or(Error::QuestNotFound)
    }

    /// Total number of quests ever posted (also the id of the next quest).
    pub fn quest_count(env: Env) -> u64 {
        storage::quest_count(&env)
    }

    /// Page through quests starting at id `start`, returning up to `limit`
    /// existing records (capped at 100 per call to bound gas/output).
    pub fn list_quests(env: Env, start: u64, limit: u32) -> Vec<Quest> {
        let total = storage::quest_count(&env);
        let capped = if limit > 100 { 100 } else { limit };
        let mut out = Vec::new(&env);
        let mut id = start;
        while id < total && out.len() < capped {
            if let Some(q) = storage::get_quest(&env, id) {
                out.push_back(q);
            }
            id += 1;
        }
        out
    }
}
