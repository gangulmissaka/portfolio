import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense, ViewTransition } from 'react';
import { count, desc, eq } from 'drizzle-orm';
import { MEMBER_FEATURES, PROJECTS } from '@/content/site';
import { getCurrentUser } from '@/lib/auth';
import { db, dbReady, schema } from '@/lib/db';
import { Avatar } from '@/components/auth/AccountMenu';
import { DeleteAccountButton } from '@/components/auth/DeleteAccountButton';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { FadeUp } from '@/components/motion/Reveal';
import { RelativeTime } from '@/components/ui/RelativeTime';
import { pageTransition } from '@/lib/transitions';

export const metadata: Metadata = { title: 'My account', robots: { index: false, follow: false } };

export default function AccountPage() {
  return (
    <ViewTransition {...pageTransition}>
      <div className="container-x pb-32 pt-[calc(var(--header-h)+4rem)]">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-[1.6rem] bg-ink-2" />}>
          <Account />
        </Suspense>
      </div>
    </ViewTransition>
  );
}

async function Account() {
  const user = await getCurrentUser();
  if (!user) redirect('/signin?next=/account');

  await dbReady;
  const [[me], [notes], reactions, recent] = await Promise.all([
    db.select({ createdAt: schema.user.createdAt }).from(schema.user).where(eq(schema.user.id, user.id)),
    db.select({ n: count() }).from(schema.guestbook).where(eq(schema.guestbook.userId, user.id)),
    db.select({ slug: schema.reaction.slug, kind: schema.reaction.kind }).from(schema.reaction).where(eq(schema.reaction.userId, user.id)),
    db.select({ body: schema.guestbook.body, createdAt: schema.guestbook.createdAt }).from(schema.guestbook).where(eq(schema.guestbook.userId, user.id)).orderBy(desc(schema.guestbook.createdAt)).limit(3),
  ]);
  const reactedProjects = [...new Set(reactions.map((r) => r.slug))].map((s) => PROJECTS.find((p) => p.slug === s)).filter(Boolean);

  return (
    <div>
      {/* profile */}
      <FadeUp onIntro className="flex flex-col gap-8 border-b border-line pb-12 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-6">
          <span className="rounded-full ring-2 ring-ember/60 ring-offset-4 ring-offset-ink">
            <Avatar user={user} size={88} />
          </span>
          <div>
            <p className="eyebrow">Member{me?.createdAt && <> · joined <RelativeTime iso={me.createdAt.toISOString()} /></>}</p>
            <h1 className="h-xl mt-2">Hi, {user.name.split(' ')[0]}</h1>
            <p className="mt-1 text-mute">{user.email}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {user.isAdmin && <Link href="/admin" className="btn btn-solid">Admin dashboard</Link>}
          <SignOutButton />
        </div>
      </FadeUp>

      {user.banned && (
        <p className="mt-8 rounded-2xl border border-red-400/30 bg-red-500/[0.06] p-5 text-sm text-red-200">Your account is currently limited: you can browse, but posting notes and reactions is turned off.</p>
      )}

      {/* stats */}
      <section className="mt-12 grid gap-px overflow-hidden rounded-[1.4rem] border border-line bg-line sm:grid-cols-3" aria-label="Your activity">
        {[
          ['Guestbook notes', notes?.n ?? 0, '/guestbook'],
          ['Reactions given', reactions.length, '/work'],
          ['Projects you reacted to', reactedProjects.length, '/work'],
        ].map(([k, v, href]) => (
          <Link key={k as string} href={href as string} className="group bg-ink p-7 transition-colors hover:bg-ink-2">
            <p className="eyebrow">{k}</p>
            <p className="mt-4 flex items-end justify-between text-5xl font-medium tabular-nums tracking-tight">
              {Number(v)}
              <span className="text-base text-mute transition-transform duration-500 group-hover:translate-x-1" aria-hidden>→</span>
            </p>
          </Link>
        ))}
      </section>

      {/* member features */}
      <section className="mt-20" aria-labelledby="features-title">
        <h2 id="features-title" className="h-lg">Member features</h2>
        <p className="lead mt-3 max-w-[50ch]">Everything your account unlocks. New features will show up here first.</p>
        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {MEMBER_FEATURES.map((f, i) => {
            const inner = (
              <>
                <span className={`w-fit rounded-full px-2.5 py-0.5 text-[0.65rem] uppercase tracking-[0.12em] ${f.status === 'live' ? 'bg-ember/15 text-ember' : 'border border-line-2 text-mute'}`}>
                  {f.status === 'live' ? 'Live' : 'Coming soon'}
                </span>
                <p className="mt-8 text-2xl font-medium tracking-tight">{f.title}</p>
                <p className="mt-2 leading-relaxed text-bone-2">{f.body}</p>
              </>
            );
            return (
              <FadeUp as="li" key={f.title} delay={i * 0.08}>
                {f.href && f.status === 'live' ? (
                  <Link href={f.href} className="flex h-full flex-col rounded-[1.4rem] border border-line bg-ink-2/60 p-7 transition-all duration-500 hover:-translate-y-1 hover:border-ember/50">{inner}</Link>
                ) : (
                  <div className="flex h-full flex-col rounded-[1.4rem] border border-dashed border-line-2 p-7">{inner}</div>
                )}
              </FadeUp>
            );
          })}
        </ul>
      </section>

      {/* recent notes */}
      {recent.length > 0 && (
        <section className="mt-20">
          <h2 className="h-md">Your latest notes</h2>
          <ul className="mt-6 space-y-3">
            {recent.map((r, i) => (
              <li key={i} className="flex items-baseline justify-between gap-6 rounded-2xl border border-line p-5">
                <span className="text-bone">{r.body}</span>
                <span className="shrink-0 font-mono text-xs text-mute"><RelativeTime iso={r.createdAt.toISOString()} /></span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* danger zone */}
      <section className="mt-20 rounded-[1.4rem] border border-line p-7">
        <h2 className="text-lg font-medium">Delete account</h2>
        <p className="mt-1 text-sm text-mute">Removes your profile, guestbook notes and reactions. This can’t be undone.</p>
        <DeleteAccountButton />
      </section>
    </div>
  );
}
