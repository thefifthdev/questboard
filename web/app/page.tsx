'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { listQuests } from '@/lib/contract';
import { listMeta } from '@/lib/api';
import { QuestCard } from '@/components/QuestCard';

export default function Home() {
  const quests = useQuery({ queryKey: ['quests'], queryFn: listQuests });
  const metas = useQuery({ queryKey: ['metas'], queryFn: listMeta });

  const metaById = new Map(
    (metas.data ?? []).filter((m) => m.questId !== null).map((m) => [m.questId as number, m]),
  );

  const list = [...(quests.data ?? [])].reverse();

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-white/10 bg-panel/60 p-8">
        <h1 className="text-3xl font-bold tracking-tight">
          On-chain bounties for the Stellar ecosystem
        </h1>
        <p className="mt-3 max-w-2xl text-white/60">
          Post a task with a reward locked in Soroban escrow. Contributors claim it, submit work,
          and get paid on approval — trustlessly, with no platform holding funds.
        </p>
        <Link
          href="/post"
          className="mt-6 inline-block rounded-lg bg-accent px-5 py-2.5 font-semibold text-white hover:opacity-90"
        >
          Post a quest →
        </Link>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-white/80">Open quests</h2>

        {quests.isLoading && <p className="text-white/50">Loading quests from testnet…</p>}
        {quests.isError && (
          <p className="text-rose-300">Could not reach the contract. Is the RPC up?</p>
        )}
        {quests.data && list.length === 0 && (
          <p className="text-white/50">No quests yet. Be the first to post one.</p>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((q) => (
            <QuestCard key={q.id.toString()} quest={q} meta={metaById.get(Number(q.id))} />
          ))}
        </div>
      </section>
    </div>
  );
}
