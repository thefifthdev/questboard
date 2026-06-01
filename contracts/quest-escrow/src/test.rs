extern crate std;

use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    token, Address, Env, String,
};

use crate::{Error, QuestEscrow, QuestEscrowClient, QuestStatus};

struct Setup<'a> {
    env: Env,
    owner: Address,
    worker: Address,
    token: token::Client<'a>,
    token_id: Address,
    client: QuestEscrowClient<'a>,
}

fn setup<'a>() -> Setup<'a> {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let owner = Address::generate(&env);
    let worker = Address::generate(&env);

    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let token_id = sac.address();
    let token = token::Client::new(&env, &token_id);
    let token_admin = token::StellarAssetClient::new(&env, &token_id);
    token_admin.mint(&owner, &10_000);

    let contract_id = env.register(QuestEscrow, ());
    let client = QuestEscrowClient::new(&env, &contract_id);

    Setup {
        env,
        owner,
        worker,
        token,
        token_id,
        client,
    }
}

fn meta(env: &Env) -> String {
    String::from_str(env, "ipfs://quest-brief")
}

// ---- post_quest ---------------------------------------------------------

#[test]
fn post_quest_locks_reward_in_escrow() {
    let s = setup();
    let id = s
        .client
        .post_quest(&s.owner, &s.token_id, &1_000, &0, &meta(&s.env));

    assert_eq!(id, 0);
    assert_eq!(s.token.balance(&s.owner), 9_000);
    assert_eq!(s.token.balance(&s.client.address), 1_000);

    let quest = s.client.get_quest(&id);
    assert_eq!(quest.status, QuestStatus::Open);
    assert_eq!(quest.reward, 1_000);
    assert_eq!(quest.owner, s.owner);
    assert_eq!(quest.worker, None);
}

#[test]
fn post_quest_increments_count_and_ids() {
    let s = setup();
    let id0 = s
        .client
        .post_quest(&s.owner, &s.token_id, &100, &0, &meta(&s.env));
    let id1 = s
        .client
        .post_quest(&s.owner, &s.token_id, &200, &0, &meta(&s.env));
    assert_eq!(id0, 0);
    assert_eq!(id1, 1);
    assert_eq!(s.client.quest_count(), 2);
}

#[test]
fn post_quest_rejects_zero_reward() {
    let s = setup();
    assert_eq!(
        s.client
            .try_post_quest(&s.owner, &s.token_id, &0, &0, &meta(&s.env)),
        Err(Ok(Error::InvalidReward))
    );
}

#[test]
fn post_quest_rejects_negative_reward() {
    let s = setup();
    assert_eq!(
        s.client
            .try_post_quest(&s.owner, &s.token_id, &-5, &0, &meta(&s.env)),
        Err(Ok(Error::InvalidReward))
    );
}

#[test]
fn post_quest_rejects_past_deadline() {
    let s = setup();
    s.env.ledger().with_mut(|l| l.timestamp = 1_000);
    assert_eq!(
        s.client
            .try_post_quest(&s.owner, &s.token_id, &100, &500, &meta(&s.env)),
        Err(Ok(Error::InvalidDeadline))
    );
}

#[test]
fn post_quest_accepts_future_deadline() {
    let s = setup();
    s.env.ledger().with_mut(|l| l.timestamp = 1_000);
    let id = s
        .client
        .post_quest(&s.owner, &s.token_id, &100, &2_000, &meta(&s.env));
    assert_eq!(s.client.get_quest(&id).deadline, 2_000);
}

#[test]
fn post_quest_rejects_overlong_metadata() {
    let s = setup();
    let long = "x".repeat(513);
    let long_meta = String::from_str(&s.env, &long);
    assert_eq!(
        s.client
            .try_post_quest(&s.owner, &s.token_id, &100, &0, &long_meta),
        Err(Ok(Error::MetadataTooLong))
    );
}

// ---- claim --------------------------------------------------------------

#[test]
fn claim_open_quest_assigns_worker() {
    let s = setup();
    let id = s
        .client
        .post_quest(&s.owner, &s.token_id, &100, &0, &meta(&s.env));
    s.client.claim(&id, &s.worker);

    let quest = s.client.get_quest(&id);
    assert_eq!(quest.status, QuestStatus::Claimed);
    assert_eq!(quest.worker, Some(s.worker.clone()));
}

#[test]
fn claim_nonexistent_quest_errors() {
    let s = setup();
    assert_eq!(
        s.client.try_claim(&42, &s.worker),
        Err(Ok(Error::QuestNotFound))
    );
}

#[test]
fn claim_already_claimed_errors() {
    let s = setup();
    let id = s
        .client
        .post_quest(&s.owner, &s.token_id, &100, &0, &meta(&s.env));
    s.client.claim(&id, &s.worker);
    let other = Address::generate(&s.env);
    assert_eq!(
        s.client.try_claim(&id, &other),
        Err(Ok(Error::InvalidStatus))
    );
}

// ---- submit -------------------------------------------------------------

#[test]
fn submit_records_deliverable() {
    let s = setup();
    let id = s
        .client
        .post_quest(&s.owner, &s.token_id, &100, &0, &meta(&s.env));
    s.client.claim(&id, &s.worker);
    let deliverable = String::from_str(&s.env, "https://github.com/pr/1");
    s.client.submit(&id, &deliverable);

    let quest = s.client.get_quest(&id);
    assert_eq!(quest.status, QuestStatus::Submitted);
    assert_eq!(quest.submission, deliverable);
}

#[test]
fn submit_requires_claimed_status() {
    let s = setup();
    let id = s
        .client
        .post_quest(&s.owner, &s.token_id, &100, &0, &meta(&s.env));
    // Not claimed yet.
    let deliverable = String::from_str(&s.env, "x");
    assert_eq!(
        s.client.try_submit(&id, &deliverable),
        Err(Ok(Error::InvalidStatus))
    );
}

#[test]
fn submit_rejects_overlong_pointer() {
    let s = setup();
    let id = s
        .client
        .post_quest(&s.owner, &s.token_id, &100, &0, &meta(&s.env));
    s.client.claim(&id, &s.worker);
    let long = String::from_str(&s.env, &"y".repeat(513));
    assert_eq!(
        s.client.try_submit(&id, &long),
        Err(Ok(Error::SubmissionTooLong))
    );
}

// ---- approve ------------------------------------------------------------

#[test]
fn approve_releases_reward_to_worker() {
    let s = setup();
    let id = s
        .client
        .post_quest(&s.owner, &s.token_id, &1_000, &0, &meta(&s.env));
    s.client.claim(&id, &s.worker);
    s.client
        .submit(&id, &String::from_str(&s.env, "deliverable"));
    s.client.approve(&id);

    assert_eq!(s.token.balance(&s.worker), 1_000);
    assert_eq!(s.token.balance(&s.client.address), 0);
    assert_eq!(s.client.get_quest(&id).status, QuestStatus::Approved);
}

#[test]
fn approve_requires_submitted_status() {
    let s = setup();
    let id = s
        .client
        .post_quest(&s.owner, &s.token_id, &100, &0, &meta(&s.env));
    s.client.claim(&id, &s.worker);
    // Submitted not reached.
    assert_eq!(s.client.try_approve(&id), Err(Ok(Error::InvalidStatus)));
}

// ---- full lifecycle -----------------------------------------------------

#[test]
fn full_lifecycle_post_claim_submit_approve() {
    let s = setup();
    assert_eq!(s.token.balance(&s.owner), 10_000);

    let id = s
        .client
        .post_quest(&s.owner, &s.token_id, &2_500, &0, &meta(&s.env));
    assert_eq!(s.token.balance(&s.owner), 7_500);

    s.client.claim(&id, &s.worker);
    s.client.submit(&id, &String::from_str(&s.env, "done"));
    s.client.approve(&id);

    assert_eq!(s.token.balance(&s.owner), 7_500);
    assert_eq!(s.token.balance(&s.worker), 2_500);
    assert_eq!(s.token.balance(&s.client.address), 0);
}

// ---- cancel -------------------------------------------------------------

#[test]
fn cancel_open_quest_refunds_owner() {
    let s = setup();
    let id = s
        .client
        .post_quest(&s.owner, &s.token_id, &1_000, &0, &meta(&s.env));
    assert_eq!(s.token.balance(&s.owner), 9_000);

    s.client.cancel(&id);
    assert_eq!(s.token.balance(&s.owner), 10_000);
    assert_eq!(s.client.get_quest(&id).status, QuestStatus::Cancelled);
}

#[test]
fn cancel_claimed_quest_errors() {
    let s = setup();
    let id = s
        .client
        .post_quest(&s.owner, &s.token_id, &100, &0, &meta(&s.env));
    s.client.claim(&id, &s.worker);
    assert_eq!(s.client.try_cancel(&id), Err(Ok(Error::InvalidStatus)));
}

// ---- reclaim_expired ----------------------------------------------------

#[test]
fn reclaim_expired_refunds_after_deadline() {
    let s = setup();
    s.env.ledger().with_mut(|l| l.timestamp = 1_000);
    let id = s
        .client
        .post_quest(&s.owner, &s.token_id, &1_000, &2_000, &meta(&s.env));
    s.client.claim(&id, &s.worker);
    assert_eq!(s.token.balance(&s.owner), 9_000);

    // Move past the deadline.
    s.env.ledger().with_mut(|l| l.timestamp = 3_000);
    s.client.reclaim_expired(&id);

    assert_eq!(s.token.balance(&s.owner), 10_000);
    assert_eq!(s.client.get_quest(&id).status, QuestStatus::Cancelled);
}

#[test]
fn reclaim_before_deadline_errors() {
    let s = setup();
    s.env.ledger().with_mut(|l| l.timestamp = 1_000);
    let id = s
        .client
        .post_quest(&s.owner, &s.token_id, &100, &5_000, &meta(&s.env));
    s.client.claim(&id, &s.worker);
    assert_eq!(
        s.client.try_reclaim_expired(&id),
        Err(Ok(Error::DeadlineNotReached))
    );
}

#[test]
fn reclaim_without_deadline_errors() {
    let s = setup();
    let id = s
        .client
        .post_quest(&s.owner, &s.token_id, &100, &0, &meta(&s.env));
    s.client.claim(&id, &s.worker);
    assert_eq!(
        s.client.try_reclaim_expired(&id),
        Err(Ok(Error::NoDeadline))
    );
}

#[test]
fn reclaim_unclaimed_quest_errors() {
    let s = setup();
    s.env.ledger().with_mut(|l| l.timestamp = 1_000);
    let id = s
        .client
        .post_quest(&s.owner, &s.token_id, &100, &2_000, &meta(&s.env));
    s.env.ledger().with_mut(|l| l.timestamp = 3_000);
    // Still Open, never claimed.
    assert_eq!(
        s.client.try_reclaim_expired(&id),
        Err(Ok(Error::InvalidStatus))
    );
}

// ---- views --------------------------------------------------------------

#[test]
fn get_quest_not_found_errors() {
    let s = setup();
    assert_eq!(s.client.try_get_quest(&7), Err(Ok(Error::QuestNotFound)));
}

#[test]
fn quest_count_starts_at_zero() {
    let s = setup();
    assert_eq!(s.client.quest_count(), 0);
}

#[test]
fn list_quests_paginates() {
    let s = setup();
    for _ in 0..5 {
        s.client
            .post_quest(&s.owner, &s.token_id, &100, &0, &meta(&s.env));
    }
    let page = s.client.list_quests(&0, &3);
    assert_eq!(page.len(), 3);
    assert_eq!(page.get(0).unwrap().id, 0);
    assert_eq!(page.get(2).unwrap().id, 2);

    let page2 = s.client.list_quests(&3, &10);
    assert_eq!(page2.len(), 2);
    assert_eq!(page2.get(0).unwrap().id, 3);
}

#[test]
fn list_quests_empty_when_none() {
    let s = setup();
    assert_eq!(s.client.list_quests(&0, &10).len(), 0);
}
