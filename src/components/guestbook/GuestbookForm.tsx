'use client';

import { useActionState, useRef, useState } from 'react';
import { signGuestbook, type FormState } from '@/lib/actions/guestbook';
import { Avatar } from '@/components/auth/AccountMenu';

export function GuestbookForm({ user }: { user: { name: string; image: string | null } }) {
  const form = useRef<HTMLFormElement>(null);
  const [len, setLen] = useState(0);
  const [state, action, pending] = useActionState<FormState, FormData>(async (prev, fd) => {
    const res = await signGuestbook(prev, fd);
    if (res?.ok) {
      form.current?.reset();
      setLen(0);
    }
    return res;
  }, null);

  return (
    <form ref={form} action={action} className="rounded-[1.4rem] border border-line bg-ink-2 p-5 md:p-7">
      <div className="flex items-start gap-4">
        <Avatar user={user} size={44} />
        <div className="flex-1">
          <label htmlFor="gb-body" className="sr-only">Your message</label>
          <textarea
            id="gb-body"
            name="body"
            required
            maxLength={280}
            rows={3}
            onChange={(e) => setLen(e.target.value.length)}
            placeholder={`Leave a note, ${user.name.split(' ')[0]}…`}
            className="w-full resize-none bg-transparent text-lg leading-relaxed text-bone placeholder:text-mute-2 focus:outline-none"
          />
          <div className="mt-3 flex items-center justify-between gap-4 border-t border-line pt-4">
            <span className={`font-mono text-xs tabular-nums ${len > 260 ? 'text-ember' : 'text-mute'}`}>{len}/280</span>
            <div className="flex items-center gap-4">
              {state && <p role="status" className={`text-sm ${state.ok ? 'text-bone-2' : 'text-red-400'}`}>{state.message}</p>}
              <button type="submit" disabled={pending || len < 2} className="btn btn-solid h-11">
                {pending ? 'Signing…' : 'Sign'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
