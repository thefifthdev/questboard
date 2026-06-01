use soroban_sdk::Env;

use crate::types::{DataKey, Quest};

// Soroban ledgers close roughly every 5 seconds, so ~17280 ledgers per day.
const DAY_IN_LEDGERS: u32 = 17_280;

// Instance storage (counter + contract config) is bumped to ~14 days, refreshed
// whenever the contract is invoked, so an actively used contract never expires.
const INSTANCE_BUMP_AMOUNT: u32 = 14 * DAY_IN_LEDGERS;
const INSTANCE_LIFETIME_THRESHOLD: u32 = INSTANCE_BUMP_AMOUNT - DAY_IN_LEDGERS;

// Persistent quest entries are bumped to ~30 days and refreshed on every read or
// write that touches the quest, protecting against archival of live quests.
const QUEST_BUMP_AMOUNT: u32 = 30 * DAY_IN_LEDGERS;
const QUEST_LIFETIME_THRESHOLD: u32 = QUEST_BUMP_AMOUNT - DAY_IN_LEDGERS;

/// Extend the TTL of the instance entry so it survives continued use.
pub fn extend_instance(env: &Env) {
    env.storage()
        .instance()
        .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
}

/// Read the next-quest-id counter (defaults to 0).
pub fn quest_count(env: &Env) -> u64 {
    env.storage()
        .instance()
        .get(&DataKey::QuestCount)
        .unwrap_or(0)
}

/// Persist the next-quest-id counter.
pub fn set_quest_count(env: &Env, value: u64) {
    env.storage().instance().set(&DataKey::QuestCount, &value);
}

/// Fetch a quest by id, bumping its TTL on access. Returns `None` if absent.
pub fn get_quest(env: &Env, id: u64) -> Option<Quest> {
    let key = DataKey::Quest(id);
    let quest = env.storage().persistent().get::<_, Quest>(&key);
    if quest.is_some() {
        env.storage()
            .persistent()
            .extend_ttl(&key, QUEST_LIFETIME_THRESHOLD, QUEST_BUMP_AMOUNT);
    }
    quest
}

/// Store a quest and bump its TTL.
pub fn set_quest(env: &Env, quest: &Quest) {
    let key = DataKey::Quest(quest.id);
    env.storage().persistent().set(&key, quest);
    env.storage()
        .persistent()
        .extend_ttl(&key, QUEST_LIFETIME_THRESHOLD, QUEST_BUMP_AMOUNT);
}
