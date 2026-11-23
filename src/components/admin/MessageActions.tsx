'use client';

import { useTransition } from 'react';
import { deleteMessage, setMessageStatus } from '@/lib/actions/admin';

const btn = 'rounded-full border border-line-2 px-3 py-1.5 text-xs text-bone-2 transition-colors hover:border-bone hover:text-bone disabled:opacity-40';

export function MessageActions({ id, status, email, name }: { id: string; status: string; email: string; name: string }) {
  const [pending, start] = useTransition();
  return (
    <div className="mt-5 flex flex-wrap gap-2" aria-busy={pending}>
      <a className={btn} href={`mailto:${email}?subject=${encodeURIComponent(`Re: your message, ${name.split(' ')[0]}`)}`} onClick={() => status === 'new' && start(() => setMessageStatus(id, 'read'))}>
        Reply by email
      </a>
      {status === 'new' && <button className={btn} disabled={pending} onClick={() => start(() => setMessageStatus(id, 'read'))}>Mark as read</button>}
      {status === 'read' && <button className={btn} disabled={pending} onClick={() => start(() => setMessageStatus(id, 'new'))}>Mark as unread</button>}
      {status !== 'archived' ? (
        <button className={btn} disabled={pending} onClick={() => start(() => setMessageStatus(id, 'archived'))}>Archive</button>
      ) : (
        <button className={btn} disabled={pending} onClick={() => start(() => setMessageStatus(id, 'read'))}>Move to inbox</button>
      )}
      <button className={`${btn} hover:!border-red-400 hover:!text-red-300`} disabled={pending} onClick={() => confirm('Delete this message for good?') && start(() => deleteMessage(id))}>
        Delete
      </button>
    </div>
  );
}
