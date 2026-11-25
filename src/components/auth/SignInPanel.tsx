'use client';

import { useSearchParams } from 'next/navigation';
import { SignInButtons } from './SignIn';

/** Sign-in buttons that return the visitor to `?next=` (only same-site paths) after Google. */
export function SignInPanel({ configured }: { configured: ('google' | 'github')[] }) {
  const next = useSearchParams().get('next');
  const safe = next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : '/account';
  return <SignInButtons configured={configured} callbackURL={safe} size="lg" />;
}
