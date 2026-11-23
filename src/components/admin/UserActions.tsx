'use client';

import { useState, useTransition } from 'react';
import { banUser, deleteUser, signOutEverywhere, unbanUser, type AdminResult } from '@/lib/actions/admin';

const btn = 'rounded-full border border-line-2 px-3 py-1.5 text-xs text-bone-2 transition-colors hover:border-bone hover:text-bone disabled:opacity-40';

export function UserActions({ userId, name, banned }: { userId: string; name: string; banned: boolean }) {
  const [pending, start] = useTransition();
  const [note, setNote] = useState<string | null>(null);
  const run = (fn: () => Promise<AdminResult>, done: string) =>
    start(async () => {
      const r = await fn();
      setNote(r.ok ? done : r.message ?? 'Something went wrong.');
    });

  return (
    <div className="flex flex-col items-start gap-2 md:items-end" aria-busy={pending}>
      <div className="flex flex-wrap gap-2 md:justify-end">
        {banned ? (
          <button className={btn} disabled={pending} onClick={() => run(() => unbanUser(userId), 'Unblocked.')}>Unblock</button>
        ) : (
          <button
            className={`${btn} hover:!border-red-400 hover:!text-red-300`}
            disabled={pending}
            onClick={() => {
              const reason = window.prompt(`Block ${name}? They’ll be signed out, can’t post, and their notes and reactions will be hidden.\n\nReason (optional, only you see it):`, '');
              if (reason === null) return;
              run(() => banUser(userId, reason), 'Blocked.');
            }}
          >
            Block
          </button>
        )}
        <button className={btn} disabled={pending} onClick={() => run(() => signOutEverywhere(userId), 'Signed out of all devices.')}>Sign out</button>
        <button
          className={`${btn} hover:!border-red-400 hover:!text-red-300`}
          disabled={pending}
          onClick={() => confirm(`Permanently delete ${name} and everything they posted? This can’t be undone.`) && run(() => deleteUser(userId), 'Deleted.')}
        >
          Delete
        </button>
      </div>
      {note && <p className="text-xs text-mute" role="status">{note}</p>}
    </div>
  );
}
