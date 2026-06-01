import { API_URL } from './config';

export interface QuestMeta {
  id: string;
  questId: number | null;
  title: string;
  description: string;
  acceptanceCriteria: string;
  tags: string;
  reward: string;
  tokenSymbol: string;
  deadline: number;
  deliverableUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuestMeta {
  title: string;
  description: string;
  acceptanceCriteria?: string;
  tags?: string;
  reward: string;
  tokenSymbol?: string;
  deadline?: number;
}

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export async function createMeta(input: CreateQuestMeta): Promise<QuestMeta> {
  return json(
    await fetch(`${API_URL}/api/quests`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    }),
  );
}

export async function linkMeta(
  id: string,
  patch: { questId?: number; deliverableUrl?: string },
): Promise<QuestMeta> {
  return json(
    await fetch(`${API_URL}/api/quests/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(patch),
    }),
  );
}

export async function listMeta(): Promise<QuestMeta[]> {
  try {
    return await json<QuestMeta[]>(await fetch(`${API_URL}/api/quests`));
  } catch {
    // The indexer is optional for browsing; fall back to on-chain-only data.
    return [];
  }
}

export async function getMetaByPointer(pointer: string): Promise<QuestMeta | null> {
  if (!pointer) return null;
  try {
    return await json<QuestMeta>(await fetch(`${API_URL}/api/quests/${pointer}`));
  } catch {
    return null;
  }
}
