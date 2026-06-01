'use client';

import { Client, networks, type Quest } from '@questboard/quest-client';
import { RPC_URL } from './config';
import { signTransaction } from './wallet';

const base = {
  ...networks.testnet,
  rpcUrl: RPC_URL,
  allowHttp: RPC_URL.startsWith('http://'),
};

/** Read-only client for simulations (no signing). */
export function readClient(): Client {
  return new Client(base);
}

/** Signing client bound to a connected wallet address. */
export function writeClient(publicKey: string): Client {
  return new Client({ ...base, publicKey, signTransaction });
}

// ---- reads --------------------------------------------------------------

export async function listQuests(): Promise<Quest[]> {
  const tx = await readClient().list_quests({ start: 0n, limit: 100 });
  return tx.result;
}

export async function getQuest(id: bigint): Promise<Quest> {
  const tx = await readClient().get_quest({ quest_id: id });
  return unwrap(tx.result);
}

// ---- writes -------------------------------------------------------------

export interface PostQuestArgs {
  owner: string;
  token: string;
  reward: bigint;
  deadline: bigint;
  metadata: string;
}

export async function postQuest(args: PostQuestArgs): Promise<bigint> {
  const tx = await writeClient(args.owner).post_quest(args);
  const sent = await tx.signAndSend();
  return unwrap(sent.result);
}

export async function claimQuest(address: string, questId: bigint): Promise<void> {
  const tx = await writeClient(address).claim({ quest_id: questId, worker: address });
  unwrap((await tx.signAndSend()).result);
}

export async function submitQuest(
  address: string,
  questId: bigint,
  submission: string,
): Promise<void> {
  const tx = await writeClient(address).submit({ quest_id: questId, submission });
  unwrap((await tx.signAndSend()).result);
}

export async function approveQuest(address: string, questId: bigint): Promise<void> {
  const tx = await writeClient(address).approve({ quest_id: questId });
  unwrap((await tx.signAndSend()).result);
}

export async function cancelQuest(address: string, questId: bigint): Promise<void> {
  const tx = await writeClient(address).cancel({ quest_id: questId });
  unwrap((await tx.signAndSend()).result);
}

export async function reclaimQuest(address: string, questId: bigint): Promise<void> {
  const tx = await writeClient(address).reclaim_expired({ quest_id: questId });
  unwrap((await tx.signAndSend()).result);
}

// The contract returns Rust `Result<T, Error>`; the bindings surface it as a
// `Result` object with `.unwrap()`. Normalize to the success value or throw.
function unwrap<T>(result: T | { unwrap: () => T }): T {
  if (result && typeof result === 'object' && 'unwrap' in result) {
    return (result as { unwrap: () => T }).unwrap();
  }
  return result as T;
}
