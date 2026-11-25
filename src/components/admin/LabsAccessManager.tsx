'use client';

import { useRef, useState, useTransition } from 'react';
import { grantLabsAccess, revokeLabsAccess } from '@/lib/actions/admin';
import { Avatar } from '@/components/auth/AccountMenu';
import { RelativeTime } from '@/components/ui/RelativeTime';

type Entry = { key: string; email: string; note: string | null; createdAt: string; member: { name: string; image: string | null } | null };

const field = 'h-11 rounded-full border border-line-2 bg-ink px-4 text-sm text-bone placeholder:text-mute focus:border-bone focus:outline-none';

export function LabsAccessManager({ admins, entries }: { admins: string[]; entries: Entry[] }) {
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const form = useRef<HTMLFormElement>(null);

  const add = (data: FormData) =>
    start(async () => {
      const email = String(data.get('email') ?? '');
      const r = await grantLabsAccess(email, String(data.get('note') ?? ''));
      setStatus({ ok: r.ok, text: r.ok ? `${email.trim()} can now open Labs.` : r.message ?? 'Something went wrong.' });
      if (r.ok) form.current?.reset();
    });

  const remove = (e: Entry) => {
    if (!confirm(`Remove Labs access for ${e.email}? The Labs link disappears for them and /labs stops opening.`)) return;
    setBusyKey(e.key);
    start(async () => {
      const r = await revokeLabsAccess(e.key);
      setStatus({ ok: r.ok, text: r.ok ? `Removed ${e.email}.` : r.message ?? 'Something went wrong.' });
      setBusyKey(null);
    });
  };

  return (
    <div className="mt-8">
      <form ref={form} action={add} className="flex flex-col gap-3 rounded-[1.2rem] border border-line bg-ink-2/60 p-5 md:flex-row md:items-center">
        <label className="sr-only" htmlFor="labs-email">Google email address</label>
        <input id="labs-email" name="email" type="email" required autoComplete="off" spellCheck={false} placeholder="name@gmail.com" className={`${field} md:flex-[3]`} />
        <label className="sr-only" htmlFor="labs-note">Note (optional)</label>
        <input id="labs-note" name="note" maxLength={120} autoComplete="off" placeholder="Note, e.g. “Sam, testing”" className={`${field} md:flex-[2]`} />
        <button type="submit" disabled={pending} className="btn btn-solid h-11 shrink-0 disabled:opacity-50">
          {pending && !busyKey ? 'Adding…' : 'Give access'}
        </button>
      </form>
      <p role="status" className={`mt-3 min-h-5 text-sm ${status?.ok ? 'text-bone-2' : 'text-red-300'}`}>{status?.text}</p>

      <ul className="mt-4 divide-y divide-line overflow-hidden rounded-[1.2rem] border border-line">
        {admins.map((a) => (
          <li key={a} className="flex flex-wrap items-center justify-between gap-4 bg-ember/[0.03] p-5">
            <div className="min-w-0">
              <p className="flex items-center gap-2 truncate font-medium">
                {a}
                <span className="rounded-full bg-ember/15 px-2 py-0.5 text-[0.62rem] uppercase tracking-[0.12em] text-ember">Admin</span>
              </p>
              <p className="text-sm text-mute">Always has access (set by ADMIN_EMAILS)</p>
            </div>
          </li>
        ))}

        {entries.length === 0 ? (
          <li className="p-8 text-center text-sm text-mute">Nobody else has access yet.</li>
        ) : (
          entries.map((e) => (
            <li key={e.key} className="grid gap-4 p-5 md:grid-cols-12 md:items-center">
              <div className="flex min-w-0 items-center gap-4 md:col-span-6">
                {e.member ? (
                  <Avatar user={e.member} size={40} />
                ) : (
                  <span className="grid size-10 shrink-0 place-items-center rounded-full border border-dashed border-line-2 text-xs text-mute" aria-hidden>@</span>
                )}
                <div className="min-w-0">
                  <p className="truncate font-medium">{e.email}</p>
                  <p className="truncate text-sm text-mute">
                    {e.member ? `Member: ${e.member.name}` : 'Hasn’t signed in yet'}
                    {e.note && <> · {e.note}</>}
                  </p>
                </div>
              </div>
              <p className="text-sm text-mute md:col-span-3">
                Added <RelativeTime iso={e.createdAt} />
              </p>
              <div className="md:col-span-3 md:justify-self-end">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => remove(e)}
                  className="rounded-full border border-line-2 px-3 py-1.5 text-xs text-bone-2 transition-colors hover:border-red-400 hover:text-red-300 disabled:opacity-40"
                >
                  {busyKey === e.key ? 'Removing…' : 'Remove access'}
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
