'use client';

import { useTransition } from 'react';
import { deleteMyAccount } from '@/lib/actions/account';

export function DeleteAccountButton() {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => confirm('Delete your account and everything you posted? This cannot be undone.') && start(() => deleteMyAccount())}
      className="btn btn-ghost mt-4 h-11 !border-red-400/50 !text-red-300"
    >
      {pending ? 'Deleting…' : 'Delete my account'}
    </button>
  );
}
