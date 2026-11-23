'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { deleteGuestbookEntries, setGuestbookStatus } from '@/lib/actions/admin';
import { Avatar } from '@/components/auth/AccountMenu';
import { RelativeTime } from '@/components/ui/RelativeTime';

type Entry = { id: string; body: string; status: string; createdAt: string; userId: string; name: string; email: string; image: string | null; blocked: boolean };

const STATUS_STYLE: Record<string, string> = {
  approved: 'bg-[#5ee37a]/10 text-[#8cefa0]',
  pending: 'bg-ember/15 text-ember',
  hidden: 'bg-ink-3 text-mute',
};
const STATUS_LABEL: Record<string, string> = { approved: 'Published', pending: 'Waiting', hidden: 'Hidden' };
const btn = 'rounded-full border border-line-2 px-3 py-1.5 text-xs text-bone-2 transition-colors hover:border-bone hover:text-bone disabled:opacity-40';

/** Guestbook moderation list with per-note actions and bulk actions on a selection. */
export function GuestbookManager({ entries }: { entries: Entry[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();
  const ids = [...selected].filter((id) => entries.some((e) => e.id === id));
  const allOn = entries.length > 0 && ids.length === entries.length;

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const act = (fn: () => Promise<void>) => start(async () => { await fn(); setSelected(new Set()); });

  if (entries.length === 0) return <p className="mt-16 text-center text-mute">No notes match.</p>;

  return (
    <div className="mt-6" aria-busy={pending}>
      {/* bulk bar */}
      <div className={`sticky top-3 z-10 mb-4 flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3 backdrop-blur-xl transition-colors ${ids.length ? 'border-ember/50 bg-ink-2/90' : 'border-line bg-ink/70'}`}>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={allOn} onChange={() => setSelected(allOn ? new Set() : new Set(entries.map((e) => e.id)))} className="size-4 accent-[var(--color-ember)]" />
          {ids.length ? `${ids.length} selected` : 'Select all'}
        </label>
        {ids.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button className={btn} disabled={pending} onClick={() => act(() => setGuestbookStatus(ids, 'approved'))}>Publish</button>
            <button className={btn} disabled={pending} onClick={() => act(() => setGuestbookStatus(ids, 'hidden'))}>Hide</button>
            <button
              className={`${btn} hover:!border-red-400 hover:!text-red-300`}
              disabled={pending}
              onClick={() => confirm(`Delete ${ids.length} note${ids.length > 1 ? 's' : ''} for good?`) && act(() => deleteGuestbookEntries(ids))}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <ul className="space-y-3">
        {entries.map((e) => (
          <li key={e.id} className={`flex gap-4 rounded-2xl border p-5 transition-colors ${selected.has(e.id) ? 'border-ember/60 bg-ember/[0.04]' : 'border-line'} ${e.status === 'hidden' ? 'opacity-60' : ''}`}>
            <input type="checkbox" checked={selected.has(e.id)} onChange={() => toggle(e.id)} aria-label="Select note" className="mt-1 size-4 shrink-0 accent-[var(--color-ember)]" />
            <div className="min-w-0 flex-1">
              <p className="whitespace-pre-wrap break-words text-bone">{e.body}</p>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-mute">
                <span className="flex items-center gap-2">
                  <Avatar user={e} size={22} />
                  <Link href={`/admin/users?q=${encodeURIComponent(e.email)}`} className="link-u text-bone-2">{e.name}</Link>
                  <span>{e.email}</span>
                </span>
                <RelativeTime iso={e.createdAt} />
                <span className={`rounded-full px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.1em] ${STATUS_STYLE[e.status] ?? ''}`}>{STATUS_LABEL[e.status] ?? e.status}</span>
                {e.blocked && <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.1em] text-red-300">Author blocked</span>}
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-start">
              {e.status !== 'approved' && <button className={btn} disabled={pending} onClick={() => act(() => setGuestbookStatus([e.id], 'approved'))}>Publish</button>}
              {e.status !== 'hidden' && <button className={btn} disabled={pending} onClick={() => act(() => setGuestbookStatus([e.id], 'hidden'))}>Hide</button>}
              <button className={`${btn} hover:!border-red-400 hover:!text-red-300`} disabled={pending} onClick={() => confirm('Delete this note for good?') && act(() => deleteGuestbookEntries([e.id]))}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
