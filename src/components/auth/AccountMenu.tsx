'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { signOut } from '@/lib/auth-client';
import type { SessionUser } from '@/lib/auth';
import { SignInButtons } from './SignIn';

export function Avatar({ user, size = 36 }: { user: Pick<SessionUser, 'name' | 'image'>; size?: number }) {
  const initials = user.name.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();
  return user.image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={user.image} alt="" width={size} height={size} referrerPolicy="no-referrer" className="rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <span className="grid place-items-center rounded-full bg-ink-3 text-xs font-semibold" style={{ width: size, height: size }}>
      {initials}
    </span>
  );
}

export function AccountMenu({ user, providers }: { user: SessionUser | null; providers: ('google' | 'github')[] }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('pointerdown', close);
    window.addEventListener('keydown', esc);
    return () => {
      window.removeEventListener('pointerdown', close);
      window.removeEventListener('keydown', esc);
    };
  }, [open]);

  if (!user) {
    return (
      <Link
        href="/signin"
        transitionTypes={['nav-forward']}
        className="group flex h-10 items-center gap-2 rounded-full bg-bone pl-1.5 pr-4 text-xs font-medium text-ink transition-shadow duration-500 hover:shadow-[0_8px_30px_-8px_rgb(240_138_60/0.8)]"
      >
        <span className="grid size-7 place-items-center rounded-full bg-white" aria-hidden>
          <svg viewBox="0 0 48 48" className="size-4"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.7-.4-3.9z" /><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" /><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A11.9 11.9 0 0 1 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" /><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.7-.4-3.9z" /></svg>
        </span>
        <span className="hidden whitespace-nowrap sm:inline">Sign in</span>
      </Link>
    );
  }

  return (
    <div ref={box} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 items-center gap-2 rounded-full border border-line bg-ink/55 pl-1 pr-3.5 text-xs text-bone-2 backdrop-blur-xl transition-colors hover:text-bone"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {user ? <Avatar user={user} size={30} /> : <span className="grid size-[30px] place-items-center rounded-full bg-ink-3" aria-hidden>↗</span>}
        <span className="hidden sm:inline">{user ? user.name.split(' ')[0] : 'Sign in'}</span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-12 w-72 rounded-2xl border border-line-2 bg-ink-2 p-4 shadow-2xl shadow-black/60">
          {user ? (
            <div className="flex flex-col gap-1 text-sm">
              <div className="mb-3 flex items-center gap-3 border-b border-line pb-3">
                <Avatar user={user} size={40} />
                <div className="min-w-0">
                  <p className="truncate font-medium">{user.name}</p>
                  <p className="truncate text-xs text-mute">{user.email}</p>
                </div>
              </div>
              <Link role="menuitem" href="/account" className="rounded-lg px-2 py-2 hover:bg-ink-3" onClick={() => setOpen(false)}>My account</Link>
              <Link role="menuitem" href="/guestbook" className="rounded-lg px-2 py-2 hover:bg-ink-3" onClick={() => setOpen(false)}>Guestbook</Link>
              {user.isAdmin && <Link role="menuitem" href="/admin" className="rounded-lg px-2 py-2 text-ember hover:bg-ink-3" onClick={() => setOpen(false)}>Admin dashboard</Link>}
              <button
                role="menuitem"
                className="rounded-lg px-2 py-2 text-left text-mute hover:bg-ink-3 hover:text-bone"
                onClick={async () => { await signOut(); setOpen(false); router.refresh(); }}
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-bone-2">Sign in to sign the guestbook, react to projects and unlock member features as they arrive.</p>
              <SignInButtons configured={providers} />
              <p className="text-[0.7rem] leading-relaxed text-mute">Only your name, email and photo are used. <Link href="/privacy" className="underline">Privacy</Link></p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
