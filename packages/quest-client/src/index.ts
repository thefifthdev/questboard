import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CBKESO2WG5QWS2GJN7CBUCUQA7JGWGI3YG3BUAPUKAPLMWWSHPNAEBFY",
  }
} as const

/**
 * Errors returned by the QuestBoard escrow contract.
 * 
 * Each variant maps to a stable `u32` code so that off-chain clients (the web
 * app and indexer) can branch on failures deterministically.
 */
export const Errors = {
  /**
   * No quest exists for the supplied id.
   */
  1: {message:"QuestNotFound"},
  /**
   * The caller is not allowed to perform this action on the quest.
   */
  2: {message:"Unauthorized"},
  /**
   * The quest is not in a state that allows this transition.
   */
  3: {message:"InvalidStatus"},
  /**
   * The reward amount must be strictly greater than zero.
   */
  4: {message:"InvalidReward"},
  /**
   * The supplied deadline is in the past.
   */
  5: {message:"InvalidDeadline"},
  /**
   * The metadata pointer exceeds the maximum allowed length.
   */
  6: {message:"MetadataTooLong"},
  /**
   * The submission pointer exceeds the maximum allowed length.
   */
  7: {message:"SubmissionTooLong"},
  /**
   * The quest has no assigned worker for this operation.
   */
  8: {message:"NoWorker"},
  /**
   * The quest deadline has not yet passed, so it cannot be reclaimed.
   */
  9: {message:"DeadlineNotReached"},
  /**
   * The quest has no deadline, so it can never expire/be reclaimed.
   */
  10: {message:"NoDeadline"}
}


/**
 * A single bounty escrow record.
 * 
 * `metadata` and `submission` hold short off-chain pointers (an HTTPS URL or
 * content hash) rather than full text, keeping on-chain storage cheap. The
 * human-readable title/description/acceptance-criteria live in the indexer DB.
 */
export interface Quest {
  /**
 * Ledger timestamp (unix seconds) at creation.
 */
created_at: u64;
  /**
 * Unix-seconds deadline for submission; `0` means no deadline.
 */
deadline: u64;
  /**
 * Monotonic identifier assigned at creation.
 */
id: u64;
  /**
 * Off-chain pointer to the quest brief (URL or hash).
 */
metadata: string;
  /**
 * Account that posted the quest and funded the escrow.
 */
owner: string;
  /**
 * Reward amount held in escrow, in the token's smallest unit.
 */
reward: i128;
  /**
 * Current lifecycle state.
 */
status: QuestStatus;
  /**
 * Off-chain pointer to the worker's deliverable (empty until submitted).
 */
submission: string;
  /**
 * SEP-41 token the reward is denominated in (e.g. USDC, XLM wrapper).
 */
token: string;
  /**
 * Account that claimed the quest, if any.
 */
worker: Option<string>;
}

/**
 * Storage keys for the contract.
 */
export type DataKey = {tag: "QuestCount", values: void} | {tag: "Quest", values: readonly [u64]};

/**
 * Lifecycle state of a quest.
 * 
 * ```text
 * Open ──claim──> Claimed ──submit──> Submitted ──approve──> Approved
 * │                │                    │
 * │cancel          │reclaim_expired     │ (owner reviews, then approves)
 * ▼                ▼
 * Cancelled       Cancelled (refund to owner)
 * ```
 */
export type QuestStatus = {tag: "Open", values: void} | {tag: "Claimed", values: void} | {tag: "Submitted", values: void} | {tag: "Approved", values: void} | {tag: "Cancelled", values: void};

export interface Client {
  /**
   * Construct and simulate a claim transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Claim an open quest. Requires `worker` authorization.
   */
  claim: ({quest_id, worker}: {quest_id: u64, worker: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a cancel transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Cancel an open (unclaimed) quest, refunding the escrow to the owner.
   * Requires the quest owner's authorization.
   */
  cancel: ({quest_id}: {quest_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a submit transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Submit a deliverable for a claimed quest. Requires the assigned worker's
   * authorization. `submission` is a short off-chain pointer (URL/hash).
   */
  submit: ({quest_id, submission}: {quest_id: u64, submission: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a approve transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Approve a submitted quest, releasing the escrowed reward to the worker.
   * Requires the quest owner's authorization.
   */
  approve: ({quest_id}: {quest_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_quest transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Fetch a single quest by id.
   */
  get_quest: ({quest_id}: {quest_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Quest>>>

  /**
   * Construct and simulate a post_quest transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Post a new quest, locking `reward` of `token` from `owner` into escrow.
   * 
   * * `deadline` — unix-seconds submission deadline, or `0` for no deadline.
   * * `metadata` — short off-chain pointer (URL/hash) to the quest brief.
   * 
   * Returns the new quest id. Requires `owner` authorization (and, via the
   * token transfer, authorization to move the reward).
   */
  post_quest: ({owner, token, reward, deadline, metadata}: {owner: string, token: string, reward: i128, deadline: u64, metadata: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<u64>>>

  /**
   * Construct and simulate a list_quests transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Page through quests starting at id `start`, returning up to `limit`
   * existing records (capped at 100 per call to bound gas/output).
   */
  list_quests: ({start, limit}: {start: u64, limit: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Array<Quest>>>

  /**
   * Construct and simulate a quest_count transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Total number of quests ever posted (also the id of the next quest).
   */
  quest_count: (options?: MethodOptions) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a reclaim_expired transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Reclaim a claimed quest whose deadline has passed without a submission,
   * refunding the escrow to the owner. Protects owners from workers who claim
   * but never deliver. Requires the quest owner's authorization.
   */
  reclaim_expired: ({quest_id}: {quest_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAAAAADVDbGFpbSBhbiBvcGVuIHF1ZXN0LiBSZXF1aXJlcyBgd29ya2VyYCBhdXRob3JpemF0aW9uLgAAAAAAAAVjbGFpbQAAAAAAAAIAAAAAAAAACHF1ZXN0X2lkAAAABgAAAAAAAAAGd29ya2VyAAAAAAATAAAAAQAAA+kAAAPtAAAAAAAAAAM=",
        "AAAAAAAAAG5DYW5jZWwgYW4gb3BlbiAodW5jbGFpbWVkKSBxdWVzdCwgcmVmdW5kaW5nIHRoZSBlc2Nyb3cgdG8gdGhlIG93bmVyLgpSZXF1aXJlcyB0aGUgcXVlc3Qgb3duZXIncyBhdXRob3JpemF0aW9uLgAAAAAABmNhbmNlbAAAAAAAAQAAAAAAAAAIcXVlc3RfaWQAAAAGAAAAAQAAA+kAAAPtAAAAAAAAAAM=",
        "AAAAAAAAAI1TdWJtaXQgYSBkZWxpdmVyYWJsZSBmb3IgYSBjbGFpbWVkIHF1ZXN0LiBSZXF1aXJlcyB0aGUgYXNzaWduZWQgd29ya2VyJ3MKYXV0aG9yaXphdGlvbi4gYHN1Ym1pc3Npb25gIGlzIGEgc2hvcnQgb2ZmLWNoYWluIHBvaW50ZXIgKFVSTC9oYXNoKS4AAAAAAAAGc3VibWl0AAAAAAACAAAAAAAAAAhxdWVzdF9pZAAAAAYAAAAAAAAACnN1Ym1pc3Npb24AAAAAABAAAAABAAAD6QAAA+0AAAAAAAAAAw==",
        "AAAAAAAAAHFBcHByb3ZlIGEgc3VibWl0dGVkIHF1ZXN0LCByZWxlYXNpbmcgdGhlIGVzY3Jvd2VkIHJld2FyZCB0byB0aGUgd29ya2VyLgpSZXF1aXJlcyB0aGUgcXVlc3Qgb3duZXIncyBhdXRob3JpemF0aW9uLgAAAAAAAAdhcHByb3ZlAAAAAAEAAAAAAAAACHF1ZXN0X2lkAAAABgAAAAEAAAPpAAAD7QAAAAAAAAAD",
        "AAAAAAAAABtGZXRjaCBhIHNpbmdsZSBxdWVzdCBieSBpZC4AAAAACWdldF9xdWVzdAAAAAAAAAEAAAAAAAAACHF1ZXN0X2lkAAAABgAAAAEAAAPpAAAH0AAAAAVRdWVzdAAAAAAAAAM=",
        "AAAAAAAAAVZQb3N0IGEgbmV3IHF1ZXN0LCBsb2NraW5nIGByZXdhcmRgIG9mIGB0b2tlbmAgZnJvbSBgb3duZXJgIGludG8gZXNjcm93LgoKKiBgZGVhZGxpbmVgIOKAlCB1bml4LXNlY29uZHMgc3VibWlzc2lvbiBkZWFkbGluZSwgb3IgYDBgIGZvciBubyBkZWFkbGluZS4KKiBgbWV0YWRhdGFgIOKAlCBzaG9ydCBvZmYtY2hhaW4gcG9pbnRlciAoVVJML2hhc2gpIHRvIHRoZSBxdWVzdCBicmllZi4KClJldHVybnMgdGhlIG5ldyBxdWVzdCBpZC4gUmVxdWlyZXMgYG93bmVyYCBhdXRob3JpemF0aW9uIChhbmQsIHZpYSB0aGUKdG9rZW4gdHJhbnNmZXIsIGF1dGhvcml6YXRpb24gdG8gbW92ZSB0aGUgcmV3YXJkKS4AAAAAAApwb3N0X3F1ZXN0AAAAAAAFAAAAAAAAAAVvd25lcgAAAAAAABMAAAAAAAAABXRva2VuAAAAAAAAEwAAAAAAAAAGcmV3YXJkAAAAAAALAAAAAAAAAAhkZWFkbGluZQAAAAYAAAAAAAAACG1ldGFkYXRhAAAAEAAAAAEAAAPpAAAABgAAAAM=",
        "AAAAAAAAAIJQYWdlIHRocm91Z2ggcXVlc3RzIHN0YXJ0aW5nIGF0IGlkIGBzdGFydGAsIHJldHVybmluZyB1cCB0byBgbGltaXRgCmV4aXN0aW5nIHJlY29yZHMgKGNhcHBlZCBhdCAxMDAgcGVyIGNhbGwgdG8gYm91bmQgZ2FzL291dHB1dCkuAAAAAAALbGlzdF9xdWVzdHMAAAAAAgAAAAAAAAAFc3RhcnQAAAAAAAAGAAAAAAAAAAVsaW1pdAAAAAAAAAQAAAABAAAD6gAAB9AAAAAFUXVlc3QAAAA=",
        "AAAAAAAAAENUb3RhbCBudW1iZXIgb2YgcXVlc3RzIGV2ZXIgcG9zdGVkIChhbHNvIHRoZSBpZCBvZiB0aGUgbmV4dCBxdWVzdCkuAAAAAAtxdWVzdF9jb3VudAAAAAAAAAAAAQAAAAY=",
        "AAAAAAAAAM5SZWNsYWltIGEgY2xhaW1lZCBxdWVzdCB3aG9zZSBkZWFkbGluZSBoYXMgcGFzc2VkIHdpdGhvdXQgYSBzdWJtaXNzaW9uLApyZWZ1bmRpbmcgdGhlIGVzY3JvdyB0byB0aGUgb3duZXIuIFByb3RlY3RzIG93bmVycyBmcm9tIHdvcmtlcnMgd2hvIGNsYWltCmJ1dCBuZXZlciBkZWxpdmVyLiBSZXF1aXJlcyB0aGUgcXVlc3Qgb3duZXIncyBhdXRob3JpemF0aW9uLgAAAAAAD3JlY2xhaW1fZXhwaXJlZAAAAAABAAAAAAAAAAhxdWVzdF9pZAAAAAYAAAABAAAD6QAAA+0AAAAAAAAAAw==",
        "AAAABAAAALpFcnJvcnMgcmV0dXJuZWQgYnkgdGhlIFF1ZXN0Qm9hcmQgZXNjcm93IGNvbnRyYWN0LgoKRWFjaCB2YXJpYW50IG1hcHMgdG8gYSBzdGFibGUgYHUzMmAgY29kZSBzbyB0aGF0IG9mZi1jaGFpbiBjbGllbnRzICh0aGUgd2ViCmFwcCBhbmQgaW5kZXhlcikgY2FuIGJyYW5jaCBvbiBmYWlsdXJlcyBkZXRlcm1pbmlzdGljYWxseS4AAAAAAAAAAAAFRXJyb3IAAAAAAAAKAAAAJE5vIHF1ZXN0IGV4aXN0cyBmb3IgdGhlIHN1cHBsaWVkIGlkLgAAAA1RdWVzdE5vdEZvdW5kAAAAAAAAAQAAAD5UaGUgY2FsbGVyIGlzIG5vdCBhbGxvd2VkIHRvIHBlcmZvcm0gdGhpcyBhY3Rpb24gb24gdGhlIHF1ZXN0LgAAAAAADFVuYXV0aG9yaXplZAAAAAIAAAA4VGhlIHF1ZXN0IGlzIG5vdCBpbiBhIHN0YXRlIHRoYXQgYWxsb3dzIHRoaXMgdHJhbnNpdGlvbi4AAAANSW52YWxpZFN0YXR1cwAAAAAAAAMAAAA1VGhlIHJld2FyZCBhbW91bnQgbXVzdCBiZSBzdHJpY3RseSBncmVhdGVyIHRoYW4gemVyby4AAAAAAAANSW52YWxpZFJld2FyZAAAAAAAAAQAAAAlVGhlIHN1cHBsaWVkIGRlYWRsaW5lIGlzIGluIHRoZSBwYXN0LgAAAAAAAA9JbnZhbGlkRGVhZGxpbmUAAAAABQAAADhUaGUgbWV0YWRhdGEgcG9pbnRlciBleGNlZWRzIHRoZSBtYXhpbXVtIGFsbG93ZWQgbGVuZ3RoLgAAAA9NZXRhZGF0YVRvb0xvbmcAAAAABgAAADpUaGUgc3VibWlzc2lvbiBwb2ludGVyIGV4Y2VlZHMgdGhlIG1heGltdW0gYWxsb3dlZCBsZW5ndGguAAAAAAARU3VibWlzc2lvblRvb0xvbmcAAAAAAAAHAAAANFRoZSBxdWVzdCBoYXMgbm8gYXNzaWduZWQgd29ya2VyIGZvciB0aGlzIG9wZXJhdGlvbi4AAAAITm9Xb3JrZXIAAAAIAAAAQVRoZSBxdWVzdCBkZWFkbGluZSBoYXMgbm90IHlldCBwYXNzZWQsIHNvIGl0IGNhbm5vdCBiZSByZWNsYWltZWQuAAAAAAAAEkRlYWRsaW5lTm90UmVhY2hlZAAAAAAACQAAAD9UaGUgcXVlc3QgaGFzIG5vIGRlYWRsaW5lLCBzbyBpdCBjYW4gbmV2ZXIgZXhwaXJlL2JlIHJlY2xhaW1lZC4AAAAACk5vRGVhZGxpbmUAAAAAAAo=",
        "AAAAAQAAAQBBIHNpbmdsZSBib3VudHkgZXNjcm93IHJlY29yZC4KCmBtZXRhZGF0YWAgYW5kIGBzdWJtaXNzaW9uYCBob2xkIHNob3J0IG9mZi1jaGFpbiBwb2ludGVycyAoYW4gSFRUUFMgVVJMIG9yCmNvbnRlbnQgaGFzaCkgcmF0aGVyIHRoYW4gZnVsbCB0ZXh0LCBrZWVwaW5nIG9uLWNoYWluIHN0b3JhZ2UgY2hlYXAuIFRoZQpodW1hbi1yZWFkYWJsZSB0aXRsZS9kZXNjcmlwdGlvbi9hY2NlcHRhbmNlLWNyaXRlcmlhIGxpdmUgaW4gdGhlIGluZGV4ZXIgREIuAAAAAAAAAAVRdWVzdAAAAAAAAAoAAAAsTGVkZ2VyIHRpbWVzdGFtcCAodW5peCBzZWNvbmRzKSBhdCBjcmVhdGlvbi4AAAAKY3JlYXRlZF9hdAAAAAAABgAAADxVbml4LXNlY29uZHMgZGVhZGxpbmUgZm9yIHN1Ym1pc3Npb247IGAwYCBtZWFucyBubyBkZWFkbGluZS4AAAAIZGVhZGxpbmUAAAAGAAAAKk1vbm90b25pYyBpZGVudGlmaWVyIGFzc2lnbmVkIGF0IGNyZWF0aW9uLgAAAAAAAmlkAAAAAAAGAAAAM09mZi1jaGFpbiBwb2ludGVyIHRvIHRoZSBxdWVzdCBicmllZiAoVVJMIG9yIGhhc2gpLgAAAAAIbWV0YWRhdGEAAAAQAAAANEFjY291bnQgdGhhdCBwb3N0ZWQgdGhlIHF1ZXN0IGFuZCBmdW5kZWQgdGhlIGVzY3Jvdy4AAAAFb3duZXIAAAAAAAATAAAAO1Jld2FyZCBhbW91bnQgaGVsZCBpbiBlc2Nyb3csIGluIHRoZSB0b2tlbidzIHNtYWxsZXN0IHVuaXQuAAAAAAZyZXdhcmQAAAAAAAsAAAAYQ3VycmVudCBsaWZlY3ljbGUgc3RhdGUuAAAABnN0YXR1cwAAAAAH0AAAAAtRdWVzdFN0YXR1cwAAAABGT2ZmLWNoYWluIHBvaW50ZXIgdG8gdGhlIHdvcmtlcidzIGRlbGl2ZXJhYmxlIChlbXB0eSB1bnRpbCBzdWJtaXR0ZWQpLgAAAAAACnN1Ym1pc3Npb24AAAAAABAAAABDU0VQLTQxIHRva2VuIHRoZSByZXdhcmQgaXMgZGVub21pbmF0ZWQgaW4gKGUuZy4gVVNEQywgWExNIHdyYXBwZXIpLgAAAAAFdG9rZW4AAAAAAAATAAAAJ0FjY291bnQgdGhhdCBjbGFpbWVkIHRoZSBxdWVzdCwgaWYgYW55LgAAAAAGd29ya2VyAAAAAAPoAAAAEw==",
        "AAAAAgAAAB5TdG9yYWdlIGtleXMgZm9yIHRoZSBjb250cmFjdC4AAAAAAAAAAAAHRGF0YUtleQAAAAACAAAAAAAAADtNb25vdG9uaWMgY291bnRlciBmb3IgdGhlIG5leHQgcXVlc3QgaWQgKGluc3RhbmNlIHN0b3JhZ2UpLgAAAAAKUXVlc3RDb3VudAAAAAAAAQAAADRBIHF1ZXN0IHJlY29yZCBrZXllZCBieSBpdHMgaWQgKHBlcnNpc3RlbnQgc3RvcmFnZSkuAAAABVF1ZXN0AAAAAAAAAQAAAAY=",
        "AAAAAgAAAUJMaWZlY3ljbGUgc3RhdGUgb2YgYSBxdWVzdC4KCmBgYHRleHQKT3BlbiDilIDilIBjbGFpbeKUgOKUgD4gQ2xhaW1lZCDilIDilIBzdWJtaXTilIDilIA+IFN1Ym1pdHRlZCDilIDilIBhcHByb3Zl4pSA4pSAPiBBcHByb3ZlZArilIIgICAgICAgICAgICAgICAg4pSCICAgICAgICAgICAgICAgICAgICDilIIK4pSCY2FuY2VsICAgICAgICAgIOKUgnJlY2xhaW1fZXhwaXJlZCAgICAg4pSCIChvd25lciByZXZpZXdzLCB0aGVuIGFwcHJvdmVzKQrilrwgICAgICAgICAgICAgICAg4pa8CkNhbmNlbGxlZCAgICAgICBDYW5jZWxsZWQgKHJlZnVuZCB0byBvd25lcikKYGBgAAAAAAAAAAAAC1F1ZXN0U3RhdHVzAAAAAAUAAAAAAAAAQlBvc3RlZCB3aXRoIHJld2FyZCBsb2NrZWQgaW4gZXNjcm93OyBvcGVuIGZvciBhbnkgd29ya2VyIHRvIGNsYWltLgAAAAAABE9wZW4AAAAAAAAANEEgd29ya2VyIGhhcyBjbGFpbWVkIHRoZSBxdWVzdCBhbmQgaXMgd29ya2luZyBvbiBpdC4AAAAHQ2xhaW1lZAAAAAAAAAAARFRoZSB3b3JrZXIgaGFzIHN1Ym1pdHRlZCBhIGRlbGl2ZXJhYmxlIGFuZCBpcyBhd2FpdGluZyBvd25lciByZXZpZXcuAAAACVN1Ym1pdHRlZAAAAAAAAAAAAABIVGhlIG93bmVyIGFwcHJvdmVkIHRoZSB3b3JrOyB0aGUgcmV3YXJkIGhhcyBiZWVuIHJlbGVhc2VkIHRvIHRoZSB3b3JrZXIuAAAACEFwcHJvdmVkAAAAAAAAAE5UaGUgcXVlc3Qgd2FzIGNhbmNlbGxlZCAob3IgcmVjbGFpbWVkIGFmdGVyIGV4cGlyeSk7IHJld2FyZCByZWZ1bmRlZCB0byBvd25lci4AAAAAAAlDYW5jZWxsZWQAAAA=" ]),
      options
    )
  }
  public readonly fromJSON = {
    claim: this.txFromJSON<Result<void>>,
        cancel: this.txFromJSON<Result<void>>,
        submit: this.txFromJSON<Result<void>>,
        approve: this.txFromJSON<Result<void>>,
        get_quest: this.txFromJSON<Result<Quest>>,
        post_quest: this.txFromJSON<Result<u64>>,
        list_quests: this.txFromJSON<Array<Quest>>,
        quest_count: this.txFromJSON<u64>,
        reclaim_expired: this.txFromJSON<Result<void>>
  }
}