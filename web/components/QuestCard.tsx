'use client';

import Link from 'next/link';
import type { Quest } from '@questboard/quest-client';
import type { QuestMeta } from '@/lib/api';
import { formatAmount, statusColor, statusLabel, shortAddr } from '@/lib/format';

export function QuestCard({ quest, meta }: { quest: Quest; meta?: QuestMeta | null }) {
  const tags = (meta?.tags ?? '').split(',').filter(Boolean);
  return (
    <Link
      href={`/quest/${quest.id.toString()}`}
      className="group flex flex-col gap-3 rounded-xl border border-white/10 bg-panel p-5 transition hover:border-accent/50"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-white/95 group-hover:text-accent">
          {meta?.title ?? `Quest #${quest.id.toString()}`}
        </h3>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(quest.status)}`}
        >
          {statusLabel(quest.status)}
        </span>
      </div>
      {meta?.description && (
        <p className="line-clamp-2 text-sm text-white/60">{meta.description}</p>
      )}
      <div className="mt-auto flex items-center justify-between text-sm">
        <span className="font-semibold text-accent2">{formatAmount(quest.reward)} XLM</span>
        <span className="text-white/40">by {shortAddr(quest.owner)}</span>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span key={t} className="rounded bg-white/5 px-2 py-0.5 text-xs text-white/50">
              {t}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
