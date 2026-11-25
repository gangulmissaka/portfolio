import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense, ViewTransition } from 'react';
import studio from '@/assets/me/studio.jpg';
import { MEMBER_FEATURES } from '@/content/site';
import { getCurrentUser } from '@/lib/auth';
import { providers } from '@/lib/env';
import { FadeUp, ImageReveal, SplitReveal } from '@/components/motion/Reveal';
import { SignInPanel } from '@/components/auth/SignInPanel';
import { pageTransition } from '@/lib/transitions';

export const metadata: Metadata = { title: 'Sign in', description: 'Sign in with Google to join the guestbook, react to projects and use member features.', alternates: { canonical: '/signin' } };

export default function SignInPage({ searchParams }: PageProps<'/signin'>) {
  return (
    <ViewTransition {...pageTransition}>
      <section className="container-x grid min-h-[100svh] gap-12 pb-20 pt-[calc(var(--header-h)+4rem)] lg:grid-cols-12 lg:items-center">
        <Suspense fallback={null}>
          <RedirectIfSignedIn searchParams={searchParams} />
        </Suspense>
        <div className="lg:col-span-6">
          <FadeUp onIntro className="eyebrow mb-6">Members</FadeUp>
          <SplitReveal onIntro as="h1" className="display text-[clamp(3.4rem,9vw,8.5rem)]">
            Come on <span className="serif-i text-ember">in</span>
          </SplitReveal>
          <FadeUp onIntro delay={0.25} as="p" className="lead mt-8 max-w-[42ch]">
            One click with your Google account. It’s free, and it unlocks everything below.
          </FadeUp>
          <ul className="mt-10 grid gap-3 sm:grid-cols-2">
            {MEMBER_FEATURES.map((f, i) => (
              <FadeUp as="li" key={f.title} onIntro delay={0.35 + i * 0.08} className="rounded-2xl border border-line bg-ink-2/60 p-5">
                <p className="flex items-center justify-between gap-3 font-medium">
                  {f.title}
                  <span className={`rounded-full px-2.5 py-0.5 text-[0.65rem] uppercase tracking-[0.12em] ${f.status === 'live' ? 'bg-ember/15 text-ember' : 'border border-line-2 text-mute'}`}>
                    {f.status === 'live' ? 'Live' : 'Soon'}
                  </span>
                </p>
                <p className="mt-2 text-sm leading-relaxed text-bone-2">{f.body}</p>
              </FadeUp>
            ))}
          </ul>
        </div>

        <div className="relative lg:col-span-5 lg:col-start-8">
          <ImageReveal onIntro delay={0.2} className="absolute inset-0 -z-10 hidden overflow-hidden rounded-[2rem] opacity-40 lg:block">
            <Image src={studio} alt="" fill sizes="40vw" placeholder="blur" className="object-cover" />
          </ImageReveal>
          <FadeUp onIntro delay={0.4} className="rounded-[2rem] border border-line-2 bg-ink-2/85 p-8 backdrop-blur-xl md:p-10 lg:m-10">
            <p className="h-md">Sign in</p>
            <p className="mt-2 text-sm text-mute">Use your Google account. No new password to remember.</p>
            <div className="mt-8">
              <Suspense fallback={<div className="h-14 rounded-full bg-ink-3" />}>
                <SignInPanel configured={[...providers()]} />
              </Suspense>
            </div>
            <p className="mt-8 text-xs leading-relaxed text-mute">
              Only your name, email and profile photo are used, and your email is never shown publicly.{' '}
              <Link href="/privacy" className="underline underline-offset-2 hover:text-bone">Privacy</Link>
            </p>
          </FadeUp>
        </div>
      </section>
    </ViewTransition>
  );
}

/** Already signed in: go where the link pointed (same-site paths only, e.g. a Krama invite), else the account page. */
async function RedirectIfSignedIn({ searchParams }: { searchParams: PageProps<'/signin'>['searchParams'] }) {
  const user = await getCurrentUser();
  if (!user) return null;
  const next = (await searchParams).next;
  redirect(typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : '/account');
}
