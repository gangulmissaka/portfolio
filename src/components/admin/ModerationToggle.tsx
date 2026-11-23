'use client';

import { useOptimistic, useTransition } from 'react';
import { setGuestbookModeration } from '@/lib/actions/admin';

/** Live switch: when on, new notes wait in "Waiting" until you publish them. */
export function ModerationToggle({ on }: { on: boolean }) {
  const [pending, start] = useTransition();
  const [value, setValue] = useOptimistic(on);
  return (
    <div className="flex flex-wrap items-center justify-between gap-6 rounded-[1.2rem] border border-line bg-ink-2/60 p-6">
      <div className="max-w-xl">
        <p className="font-medium">Approve notes before they go public</p>
        <p className="mt-1 text-sm text-mute">
          {value ? 'On: new notes wait in “Waiting” until you publish them.' : 'Off: new notes appear on the guestbook straight away. You can still hide or delete them.'}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label="Approve notes before they go public"
        disabled={pending}
        onClick={() => start(async () => { setValue(!value); await setGuestbookModeration(!value); })}
        className={`relative h-8 w-14 shrink-0 rounded-full transition-colors duration-300 ${value ? 'bg-ember' : 'bg-ink-3'}`}
      >
        <span className={`absolute left-0 top-1 size-6 rounded-full bg-bone shadow transition-transform duration-300 ${value ? 'translate-x-7' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}
