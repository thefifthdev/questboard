'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/components/providers';
import { postQuest } from '@/lib/contract';
import { createMeta, linkMeta } from '@/lib/api';
import { DEFAULT_TOKEN } from '@/lib/config';
import { toStroops } from '@/lib/format';

export default function PostQuestPage() {
  const router = useRouter();
  const { address, connect } = useWallet();
  const [form, setForm] = useState({
    title: '',
    description: '',
    acceptanceCriteria: '',
    tags: '',
    reward: '',
    deadline: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [k]: e.target.value });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!address) {
      await connect().catch(() => {});
      return; // wallet now connected; user can submit again
    }
    setBusy(true);
    try {
      const owner = address;

      const meta = await createMeta({
        title: form.title,
        description: form.description,
        acceptanceCriteria: form.acceptanceCriteria,
        tags: form.tags,
        reward: toStroops(form.reward).toString(),
        tokenSymbol: 'XLM',
        deadline: form.deadline ? Math.floor(new Date(form.deadline).getTime() / 1000) : 0,
      });

      const questId = await postQuest({
        owner,
        token: DEFAULT_TOKEN,
        reward: toStroops(form.reward),
        deadline: form.deadline ? BigInt(Math.floor(new Date(form.deadline).getTime() / 1000)) : 0n,
        metadata: meta.id,
      });

      await linkMeta(meta.id, { questId: Number(questId) });
      router.push(`/quest/${questId.toString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-bold">Post a quest</h1>
      <p className="mt-2 text-sm text-white/50">
        Your reward is locked in Soroban escrow when you post. It is released only when you approve
        a submission, or refunded if you cancel.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <Field label="Title">
          <input
            className={inputCls}
            value={form.title}
            onChange={set('title')}
            required
            maxLength={200}
          />
        </Field>
        <Field label="Description">
          <textarea
            className={inputCls}
            rows={4}
            value={form.description}
            onChange={set('description')}
            required
          />
        </Field>
        <Field label="Acceptance criteria">
          <textarea
            className={inputCls}
            rows={3}
            value={form.acceptanceCriteria}
            onChange={set('acceptanceCriteria')}
            placeholder="What does done look like?"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Reward (XLM)">
            <input
              className={inputCls}
              value={form.reward}
              onChange={set('reward')}
              required
              inputMode="decimal"
              placeholder="10"
            />
          </Field>
          <Field label="Deadline (optional)">
            <input
              className={inputCls}
              type="datetime-local"
              value={form.deadline}
              onChange={set('deadline')}
            />
          </Field>
        </div>
        <Field label="Tags (comma-separated)">
          <input
            className={inputCls}
            value={form.tags}
            onChange={set('tags')}
            placeholder="rust, frontend"
          />
        </Field>

        {error && <p className="text-sm text-rose-300">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-accent px-5 py-2.5 font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {busy ? 'Posting on-chain…' : address ? 'Lock reward & post' : 'Connect wallet & post'}
        </button>
      </form>
    </div>
  );
}

const inputCls =
  'w-full rounded-lg border border-white/15 bg-ink px-3 py-2 text-sm text-white/90 outline-none focus:border-accent';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-white/70">{label}</span>
      {children}
    </label>
  );
}
