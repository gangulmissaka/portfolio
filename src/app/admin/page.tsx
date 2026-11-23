import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { desc, eq, gte, sql } from 'drizzle-orm';
import { requireAdminPage } from '@/lib/admin';
import { db, dbReady, schema } from '@/lib/db';
import { env } from '@/lib/env';
import { getModeration } from '@/lib/settings';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminSkeleton } from '@/components/admin/AdminSkeleton';
import { Avatar } from '@/components/auth/AccountMenu';
import { RelativeTime } from '@/components/ui/RelativeTime';

export const metadata: Metadata = { title: 'Admin', robots: { index: false, follow: false } };

/** YYYY-MM-DD, n days ago (UTC). */
function isoDaysAgo(n: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

export default function AdminOverviewPage() {
  return (
    <div className="container-x pb-32 pt-[calc(var(--header-h)+3rem)]">
      <Suspense fallback={<AdminSkeleton />}>
        <Overview />
      </Suspense>
    </div>
  );
}

async function Overview() {
  const user = await requireAdminPage();
  await dbReady;
  const since = isoDaysAgo(29);
  const [[t], views, newest, latestNotes, moderation] = await Promise.all([
    db
      .select({
        views: sql<number>`(select coalesce(sum("count"),0)::int from "page_view" where "day" >= ${since})`,
        users: sql<number>`(select count(*)::int from "user")`,
        newUsers: sql<number>`(select count(*)::int from "user" where "createdAt" >= now() - interval '7 days')`,
        notes: sql<number>`(select count(*)::int from "guestbook")`,
        pending: sql<number>`(select count(*)::int from "guestbook" where "status" = 'pending')`,
        unread: sql<number>`(select count(*)::int from "message" where "status" = 'new')`,
        blocked: sql<number>`(select count(*)::int from "user_ban")`,
        reactions: sql<number>`(select count(*)::int from "reaction")`,
      })
      .from(sql`(select 1) as one`),
    db
      .select({ path: schema.pageView.path, n: sql<number>`sum(${schema.pageView.count})::int` })
      .from(schema.pageView)
      .where(gte(schema.pageView.day, since))
      .groupBy(schema.pageView.path)
      .orderBy(desc(sql`2`))
      .limit(8),
    db.select({ id: schema.user.id, name: schema.user.name, email: schema.user.email, image: schema.user.image, createdAt: schema.user.createdAt }).from(schema.user).orderBy(desc(schema.user.createdAt)).limit(5),
    db
      .select({ id: schema.guestbook.id, body: schema.guestbook.body, status: schema.guestbook.status, createdAt: schema.guestbook.createdAt, name: schema.user.name })
      .from(schema.guestbook)
      .innerJoin(schema.user, eq(schema.user.id, schema.guestbook.userId))
      .orderBy(desc(schema.guestbook.createdAt))
      .limit(5),
    getModeration(),
  ]);
  const maxViews = Math.max(1, ...views.map((v) => Number(v.n)));

  const stats: [string, number, string, string][] = [
    ['Members', Number(t.users), '/admin/users', `+${Number(t.newUsers)} this week`],
    ['Guestbook notes', Number(t.notes), '/admin/guestbook', Number(t.pending) ? `${Number(t.pending)} waiting for approval` : 'Nothing waiting'],
    ['Unread messages', Number(t.unread), '/admin/messages', 'From the contact form'],
    ['Page views · 30 days', Number(t.views), '/admin', `${Number(t.reactions)} reactions · ${Number(t.blocked)} blocked users`],
  ];

  return (
    <AdminShell user={user}>
      <section className="grid gap-px overflow-hidden rounded-[1.2rem] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([k, v, href, sub]) => (
          <Link key={k} href={href} className="group bg-ink p-6 transition-colors hover:bg-ink-2">
            <p className="eyebrow">{k}</p>
            <p className="mt-4 text-4xl font-medium tabular-nums tracking-tight">{v}</p>
            <p className="mt-2 text-xs text-mute">{sub}</p>
          </Link>
        ))}
      </section>

      <div className="mt-14 grid gap-14 xl:grid-cols-2">
        <section>
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="h-md">Newest members</h2>
            <Link href="/admin/users" className="link-u text-sm text-bone-2">All users →</Link>
          </div>
          {newest.length === 0 && <p className="text-mute">No one has signed up yet.</p>}
          {newest.length > 0 && (
            <ul className="divide-y divide-line rounded-2xl border border-line">
              {newest.map((u) => (
                <li key={u.id} className="flex items-center gap-4 p-4">
                  <Avatar user={u} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate">{u.name}</p>
                    <p className="truncate text-xs text-mute">{u.email}</p>
                  </div>
                  <span className="shrink-0 font-mono text-xs text-mute"><RelativeTime iso={u.createdAt.toISOString()} /></span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="h-md">Latest guestbook notes</h2>
            <Link href="/admin/guestbook" className="link-u text-sm text-bone-2">Manage →</Link>
          </div>
          <p className="mb-4 text-sm text-mute">
            Approval before publishing is <span className={moderation ? 'text-ember' : 'text-bone'}>{moderation ? 'on' : 'off'}</span>.
          </p>
          {latestNotes.length === 0 && <p className="text-mute">No notes yet.</p>}
          <ul className="space-y-2">
            {latestNotes.map((n) => (
              <li key={n.id} className="rounded-2xl border border-line p-4">
                <p className="line-clamp-2 text-bone">{n.body}</p>
                <p className="mt-2 text-xs text-mute">
                  {n.name} · <RelativeTime iso={n.createdAt.toISOString()} /> · <span className={n.status === 'pending' ? 'text-ember' : ''}>{n.status}</span>
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="h-md mb-5">Top pages · 30 days</h2>
          {views.length === 0 && <p className="text-mute">No views recorded yet.</p>}
          <ul className="space-y-2">
            {views.map((v) => (
              <li key={v.path} className="relative overflow-hidden rounded-lg border border-line px-4 py-2.5 text-sm">
                <span className="absolute inset-y-0 left-0 bg-ember/15" style={{ width: `${(Number(v.n) / maxViews) * 100}%` }} aria-hidden />
                <span className="relative flex justify-between"><span>{v.path}</span><span className="tabular-nums text-mute">{Number(v.n)}</span></span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="h-md mb-5">Site services</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {([
              ['Google sign-in', env.google],
              ['GitHub sign-in', env.github],
              ['Email notifications (Resend)', env.resend],
              ['Bot protection (Turnstile)', env.turnstile],
            ] as const).map(([k, on]) => (
              <li key={k} className="flex items-center justify-between rounded-xl border border-line px-4 py-3 text-sm">
                {k}
                <span className={`text-xs ${on ? 'text-[#5ee37a]' : 'text-mute'}`}>{on ? '● On' : '○ Not set up'}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AdminShell>
  );
}
