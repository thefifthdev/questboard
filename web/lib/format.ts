import type { Quest, QuestStatus } from '@questboard/quest-client';

const STROOPS = 10_000_000n;

/** Format a stroop amount as a human XLM string. */
export function formatAmount(stroops: bigint): string {
  const whole = stroops / STROOPS;
  const frac = stroops % STROOPS;
  if (frac === 0n) return whole.toString();
  return `${whole}.${frac.toString().padStart(7, '0').replace(/0+$/, '')}`;
}

/** Parse a human XLM string into stroops (7 decimal places). */
export function toStroops(amount: string): bigint {
  const [whole, frac = ''] = amount.trim().split('.');
  const fracPadded = (frac + '0000000').slice(0, 7);
  return BigInt(whole || '0') * STROOPS + BigInt(fracPadded || '0');
}

export function statusLabel(status: QuestStatus): string {
  return status.tag;
}

export function statusColor(status: QuestStatus): string {
  switch (status.tag) {
    case 'Open':
      return 'bg-emerald-500/15 text-emerald-300';
    case 'Claimed':
      return 'bg-amber-500/15 text-amber-300';
    case 'Submitted':
      return 'bg-sky-500/15 text-sky-300';
    case 'Approved':
      return 'bg-accent/20 text-accent';
    case 'Cancelled':
      return 'bg-rose-500/15 text-rose-300';
    default:
      return 'bg-white/10 text-white/70';
  }
}

export function shortAddr(addr: string | null | undefined): string {
  if (!addr) return '—';
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

export function formatDeadline(deadline: bigint): string {
  if (deadline === 0n) return 'No deadline';
  return new Date(Number(deadline) * 1000).toLocaleString();
}

export type { Quest };
