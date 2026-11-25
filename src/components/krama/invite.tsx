'use client';

import { useState } from 'react';
import { Icon } from './ui';

/** The link to send: sign in with Google, then land straight on the project. */
export const inviteLink = (boardId: string) => `${window.location.origin}/signin?next=${encodeURIComponent(`/labs/krama/b/${boardId}`)}`;

export const inviteMessage = (boardId: string, boardTitle: string, email: string) =>
  `You've been added to the project "${boardTitle}" in Krama. Open this link and sign in with Google as ${email}:\n${inviteLink(boardId)}`;

/** Copies a ready-to-send invite (message + link) for one person. */
export function CopyInvite({ boardId, boardTitle, email, compact = false }: { boardId: string; boardTitle: string; email: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(inviteMessage(boardId, boardTitle, email));
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt('Copy this invite:', inviteMessage(boardId, boardTitle, email));
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      title="Copy a message with a sign-in link to send them"
      className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs transition-colors ${copied ? 'border-[#4fbf7a] text-[#7fd9a0]' : 'border-line-2 text-bone-2 hover:border-bone hover:text-bone'}`}
    >
      <Icon name={copied ? 'check' : 'comment'} className="size-3.5" />
      {copied ? 'Copied' : compact ? 'Invite' : 'Copy invite'}
    </button>
  );
}
