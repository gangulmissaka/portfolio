'use client';

import { useState } from 'react';
import { signIn } from '@/lib/auth-client';

type Provider = 'google' | 'github';

const GoogleIcon = () => (
  <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
    <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.7-.4-3.9z" />
    <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A11.9 11.9 0 0 1 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.7-.4-3.9z" />
  </svg>
);

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
    <path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.4-4-1.4-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.3 1.9 1.3 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.7 1.7.3 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5z" />
  </svg>
);

/**
 * "Continue with Google" is always shown. GitHub appears only when its keys are configured.
 * `configured` lists the providers that have keys on the server.
 */
export function SignInButtons({ configured, callbackURL, size = 'md' }: { configured: Provider[]; callbackURL?: string; size?: 'md' | 'lg' }) {
  const [busy, setBusy] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const shown: Provider[] = ['google', ...(configured.includes('github') ? (['github'] as const) : [])];
  const big = size === 'lg';

  async function go(p: Provider) {
    if (!configured.includes(p)) {
      setError('Google sign-in is almost ready. It switches on as soon as the site’s Google keys are added.');
      return;
    }
    setBusy(p);
    setError(null);
    const res = await signIn.social({ provider: p, callbackURL: callbackURL ?? window.location.pathname });
    if (res?.error) {
      setError(res.error.message ?? 'Sign-in failed. Please try again.');
      setBusy(null);
    }
  }

  return (
    <div className="flex w-full flex-col gap-3">
      {shown.map((p) => (
        <button
          key={p}
          type="button"
          disabled={busy !== null}
          onClick={() => go(p)}
          className={`group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-full font-medium transition-all duration-500 disabled:opacity-60 ${
            big ? 'h-14 text-base' : 'h-12 text-sm'
          } ${p === 'google' ? 'bg-bone text-ink hover:shadow-[0_10px_40px_-10px_rgb(240_138_60/0.7)]' : 'border border-line-2 text-bone hover:border-bone'}`}
        >
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent transition-transform duration-1000 group-hover:translate-x-full" aria-hidden />
          {p === 'google' ? <GoogleIcon /> : <GithubIcon />}
          <span className="relative">{busy === p ? 'Opening Google…' : p === 'google' ? 'Continue with Google' : 'Continue with GitHub'}</span>
        </button>
      ))}
      {error && <p role="alert" className="text-sm leading-relaxed text-bone-2">{error}</p>}
    </div>
  );
}
