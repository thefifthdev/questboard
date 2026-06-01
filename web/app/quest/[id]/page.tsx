'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useWallet } from '@/components/providers';
import {
  getQuest,
  claimQuest,
  submitQuest,
  approveQuest,
  cancelQuest,
  reclaimQuest,
} from '@/lib/contract';
import { getMetaByPointer, linkMeta } from '@/lib/api';
import { formatAmount, formatDeadline, shortAddr, statusColor, statusLabel } from '@/lib/format';

export default function QuestDetail() {
  const params = useParams<{ id: string }>();
  const id = BigInt(params.id);
  const { address, connect } = useWallet();
  const qc = useQueryClient();

  const quest = useQuery({ queryKey: ['quest', params.id], queryFn: () => getQuest(id) });
  const meta = useQuery({
    queryKey: ['quest-meta', params.id, quest.data?.metadata],
    queryFn: () => getMetaByPointer(quest.data!.metadata),
    enabled: !!quest.data,
  });

  const [deliverable, setDeliverable] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (quest.isLoading) return <p className="text-white/50">Loading quest…</p>;
  if (quest.isError || !quest.data)
    return <p className="text-rose-300">Quest not found on-chain.</p>;

  const q = quest.data;
  const status = q.status.tag;
  const isOwner = address === q.owner;
  const isWorker = address === (q.worker ?? undefined);
  const pastDeadline = q.deadline !== 0n && BigInt(Math.floor(Date.now() / 1000)) > q.deadline;

  async function run(action: string, fn: () => Promise<void>, after?: () => Promise<void>) {
    setError(null);
    if (!address) {
      await connect().catch(() => {});
      return;
    }
    setBusy(action);
    try {
      await fn();
      if (after) await after();
      await qc.invalidateQueries({ queryKey: ['quest', params.id] });
      await qc.invalidateQueries({ queryKey: ['quests'] });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{meta.data?.title ?? `Quest #${params.id}`}</h1>
          <p className="mt-1 text-sm text-white/40">Quest #{params.id}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColor(q.status)}`}>
          {statusLabel(q.status)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-xl border border-white/10 bg-panel p-5 text-sm">
        <Info label="Reward" value={`${formatAmount(q.reward)} XLM`} />
        <Info label="Deadline" value={formatDeadline(q.deadline)} />
        <Info label="Owner" value={shortAddr(q.owner)} />
        <Info label="Worker" value={shortAddr(q.worker ?? undefined)} />
      </div>

      {meta.data?.description && <Section title="Description">{meta.data.description}</Section>}
      {meta.data?.acceptanceCriteria && (
        <Section title="Acceptance criteria">{meta.data.acceptanceCriteria}</Section>
      )}
      {q.submission && (
        <Section title="Submission">
          <a className="text-accent underline" href={q.submission} target="_blank" rel="noreferrer">
            {q.submission}
          </a>
        </Section>
      )}

      {error && <p className="text-sm text-rose-300">{error}</p>}

      {/* Actions gated by role + status */}
      <div className="space-y-3">
        {status === 'Open' && !isOwner && (
          <ActionButton
            label="Claim this quest"
            busy={busy === 'claim'}
            onClick={() => run('claim', () => claimQuest(address!, id))}
          />
        )}
        {status === 'Open' && isOwner && (
          <ActionButton
            label="Cancel & refund"
            variant="danger"
            busy={busy === 'cancel'}
            onClick={() => run('cancel', () => cancelQuest(address!, id))}
          />
        )}
        {status === 'Claimed' && isWorker && (
          <div className="space-y-2">
            <input
              className="w-full rounded-lg border border-white/15 bg-ink px-3 py-2 text-sm outline-none focus:border-accent"
              placeholder="Deliverable URL (PR, IPFS, doc…)"
              value={deliverable}
              onChange={(e) => setDeliverable(e.target.value)}
            />
            <ActionButton
              label="Submit work"
              busy={busy === 'submit'}
              disabled={!deliverable}
              onClick={() =>
                run(
                  'submit',
                  () => submitQuest(address!, id, deliverable),
                  () =>
                    meta.data
                      ? linkMeta(meta.data.id, { deliverableUrl: deliverable }).then(() => {})
                      : Promise.resolve(),
                )
              }
            />
          </div>
        )}
        {status === 'Claimed' && isOwner && pastDeadline && (
          <ActionButton
            label="Reclaim (deadline passed)"
            variant="danger"
            busy={busy === 'reclaim'}
            onClick={() => run('reclaim', () => reclaimQuest(address!, id))}
          />
        )}
        {status === 'Submitted' && isOwner && (
          <ActionButton
            label="Approve & release reward"
            busy={busy === 'approve'}
            onClick={() => run('approve', () => approveQuest(address!, id))}
          />
        )}
        {(status === 'Approved' || status === 'Cancelled') && (
          <p className="rounded-lg border border-white/10 bg-panel p-4 text-sm text-white/60">
            This quest is closed ({status.toLowerCase()}).
          </p>
        )}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-white/40">{label}</div>
      <div className="mt-0.5 font-medium text-white/90">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-panel p-5">
      <h2 className="mb-2 text-sm font-semibold text-white/70">{title}</h2>
      <div className="whitespace-pre-wrap text-sm text-white/80">{children}</div>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  busy,
  disabled,
  variant = 'primary',
}: {
  label: string;
  onClick: () => void;
  busy?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'danger';
}) {
  const base =
    variant === 'danger'
      ? 'border border-rose-500/40 text-rose-200 hover:bg-rose-500/10'
      : 'bg-accent text-white hover:opacity-90';
  return (
    <button
      onClick={onClick}
      disabled={busy || disabled}
      className={`w-full rounded-lg px-5 py-2.5 font-semibold disabled:opacity-50 ${base}`}
    >
      {busy ? 'Confirming in wallet…' : label}
    </button>
  );
}
