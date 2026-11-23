import type { Metadata } from 'next';
import { unstable_rethrow } from 'next/navigation';
import { Suspense, ViewTransition } from 'react';
import { and, desc, eq, notExists } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import { db, dbReady, schema } from '@/lib/db';
import { providers } from '@/lib/env';
import { PageHeader } from '@/components/ui/PageHeader';
import { SignInButtons } from '@/components/auth/SignIn';
import { GuestbookForm } from '@/components/guestbook/GuestbookForm';
import { Avatar } from '@/components/auth/AccountMenu';
import { RelativeTime } from '@/components/ui/RelativeTime';
import { DeleteEntryButton } from '@/components/guestbook/DeleteEntryButton';
import { pageTransition } from '@/lib/transitions';

export const metadata: Metadata = {
  title: 'Guestbook',
  description: 'Sign in with Google or GitHub and leave a note for Gangul.',
  alternates: { canonical: '/guestbook' },
};

export default function GuestbookPage() {
  return (
    <ViewTransition {...pageTransition}>
      <div>
        <PageHeader
          eyebrow="Guestbook"
          title={<>Leave a <span className="serif-i text-ember">mark</span></>}
          intro="Recruiter, classmate, fellow developer or passing stranger, sign in and leave a note. It makes my day."
        />
        <section className="container-x pb-32">
          <div className="mx-auto max-w-3xl">
            <Suspense fallback={<div className="h-40 animate-pulse rounded-[1.4rem] bg-ink-2" />}>
              <Composer />
            </Suspense>
            <Suspense fallback={<EntriesSkeleton />}>
              <Entries />
            </Suspense>
          </div>
        </section>
      </div>
    </ViewTransition>
  );
}

async function Composer() {
  const user = await getCurrentUser();
  if (user?.banned) return <div className="rounded-[1.4rem] border border-line bg-ink-2 p-7 text-bone-2">Your account can’t post notes right now. If you think this is a mistake, <a href="/contact" className="link-u text-bone">get in touch</a>.</div>;
  if (user) return <GuestbookForm user={user} />;
  return (
    <div className="rounded-[1.4rem] border border-line bg-ink-2 p-7">
      <p className="h-md">Sign in to leave a note</p>
      <p className="mt-2 text-mute">Only your name and photo are shown. Your email is never displayed.</p>
      <div className="mt-6 max-w-sm">
        <SignInButtons configured={[...providers()]} callbackURL="/guestbook" />
      </div>
    </div>
  );
}

async function Entries() {
  const user = await getCurrentUser();
  let rows: { id: string; body: string; createdAt: Date; userId: string; name: string; image: string | null }[] = [];
  try {
    await dbReady;
    rows = await db
      .select({ id: schema.guestbook.id, body: schema.guestbook.body, createdAt: schema.guestbook.createdAt, userId: schema.guestbook.userId, name: schema.user.name, image: schema.user.image })
      .from(schema.guestbook)
      .innerJoin(schema.user, eq(schema.user.id, schema.guestbook.userId))
      .where(and(eq(schema.guestbook.status, 'approved'), notExists(db.select().from(schema.userBan).where(eq(schema.userBan.userId, schema.guestbook.userId)))))
      .orderBy(desc(schema.guestbook.createdAt))
      .limit(100);
  } catch (e) {
    unstable_rethrow(e);
    console.error('[guestbook]', e);
  }
  if (rows.length === 0) return <p className="mt-16 text-center text-mute">No notes yet. Be the first!</p>;
  return (
    <ul className="mt-14 columns-1 gap-4 sm:columns-2">
      {rows.map((r) => (
        <li key={r.id} className="mb-4 break-inside-avoid rounded-[1.2rem] border border-line bg-ink-2/60 p-5">
          <p className="whitespace-pre-wrap break-words leading-relaxed text-bone">{r.body}</p>
          <div className="mt-5 flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2.5">
              <Avatar user={{ name: r.name, image: r.image }} size={26} />
              <span className="truncate text-sm">{r.name}</span>
            </span>
            <span className="flex shrink-0 items-center gap-3 font-mono text-[0.68rem] text-mute">
              <RelativeTime iso={r.createdAt.toISOString()} />
              {user && (user.id === r.userId || user.isAdmin) && <DeleteEntryButton id={r.id} />}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function EntriesSkeleton() {
  return (
    <div className="mt-14 grid gap-4 sm:grid-cols-2" aria-hidden>
      {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-[1.2rem] bg-ink-2" />)}
    </div>
  );
}
