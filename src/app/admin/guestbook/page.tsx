import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { and, desc, eq, ilike, or, sql, type SQL } from 'drizzle-orm';
import { requireAdminPage } from '@/lib/admin';
import { db, dbReady, schema } from '@/lib/db';
import { getModeration } from '@/lib/settings';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminSkeleton } from '@/components/admin/AdminSkeleton';
import { AdminSearch } from '@/components/admin/AdminSearch';
import { GuestbookManager } from '@/components/admin/GuestbookManager';
import { ModerationToggle } from '@/components/admin/ModerationToggle';

export const metadata: Metadata = { title: 'Guestbook · Admin', robots: { index: false, follow: false } };

const STATUSES = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Waiting' },
  { id: 'approved', label: 'Published' },
  { id: 'hidden', label: 'Hidden' },
] as const;

export default function AdminGuestbookPage({ searchParams }: PageProps<'/admin/guestbook'>) {
  return (
    <div className="container-x pb-32 pt-[calc(var(--header-h)+3rem)]">
      <Suspense fallback={<AdminSkeleton />}>
        <Guestbook searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Guestbook({ searchParams }: { searchParams: PageProps<'/admin/guestbook'>['searchParams'] }) {
  const me = await requireAdminPage();
  const sp = await searchParams;
  const status = STATUSES.find((s) => s.id === sp.status)?.id ?? 'all';
  const q = typeof sp.q === 'string' ? sp.q.trim().slice(0, 80) : '';
  const userId = typeof sp.user === 'string' ? sp.user : '';
  await dbReady;

  const conds: (SQL | undefined)[] = [];
  if (status !== 'all') conds.push(eq(schema.guestbook.status, status));
  if (userId) conds.push(eq(schema.guestbook.userId, userId));
  if (q) conds.push(or(ilike(schema.guestbook.body, `%${q}%`), ilike(schema.user.name, `%${q}%`), ilike(schema.user.email, `%${q}%`)));

  const [rows, counts, moderation] = await Promise.all([
    db
      .select({
        id: schema.guestbook.id,
        body: schema.guestbook.body,
        status: schema.guestbook.status,
        createdAt: schema.guestbook.createdAt,
        userId: schema.user.id,
        name: schema.user.name,
        email: schema.user.email,
        image: schema.user.image,
        blocked: sql<boolean>`exists(select 1 from "user_ban" where "user_ban"."userId" = ${schema.user.id})`,
      })
      .from(schema.guestbook)
      .innerJoin(schema.user, eq(schema.user.id, schema.guestbook.userId))
      .where(and(...conds))
      .orderBy(desc(schema.guestbook.createdAt))
      .limit(300),
    db.select({ status: schema.guestbook.status, n: sql<number>`count(*)::int` }).from(schema.guestbook).groupBy(schema.guestbook.status),
    getModeration(),
  ]);
  const count = (id: string) => (id === 'all' ? counts.reduce((a, c) => a + Number(c.n), 0) : Number(counts.find((c) => c.status === id)?.n ?? 0));
  const filteredUser = userId ? rows[0]?.name : null;

  return (
    <AdminShell user={me}>
      <ModerationToggle on={moderation} />

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <Link
              key={s.id}
              href={{ pathname: '/admin/guestbook', query: { ...(q && { q }), ...(userId && { user: userId }), ...(s.id !== 'all' && { status: s.id }) } }}
              className={`chip h-9 px-4 transition-colors ${status === s.id ? 'border-bone bg-bone text-ink' : 'hover:border-bone'}`}
            >
              {s.label} <sup className="ml-1 text-[0.6rem] opacity-60">{count(s.id)}</sup>
            </Link>
          ))}
        </div>
        <AdminSearch placeholder="Search notes, names or emails" />
      </div>

      {userId && (
        <p className="mt-6 text-sm text-mute">
          Showing notes by <span className="text-bone">{filteredUser ?? 'this user'}</span>.{' '}
          <Link href="/admin/guestbook" className="link-u text-bone-2">Show everyone</Link>
        </p>
      )}

      <GuestbookManager
        entries={rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString(), blocked: Boolean(r.blocked) }))}
      />
    </AdminShell>
  );
}
