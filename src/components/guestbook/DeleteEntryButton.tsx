'use client';

import { useTransition } from 'react';
import { deleteOwnEntry } from '@/lib/actions/guestbook';

export function DeleteEntryButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => confirm('Delete this note?') && start(() => deleteOwnEntry(id))}
      className="text-mute underline-offset-2 hover:text-bone hover:underline"
    >
      {pending ? '…' : 'Delete'}
    </button>
  );
}
