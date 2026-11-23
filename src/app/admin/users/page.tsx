import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { desc, eq, ilike, isNotNull, or, sql, and, type SQL } from 'drizzle-orm';
import { requireAdminPage } from '@/lib/admin';
import { db, dbReady, schema } from '@/lib/db';
import { env } from '@/lib/env';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminSkeleton } from '@/components/admin/AdminSkeleton';
import { AdminSearch } from '@/components/admin/AdminSearch';
import { UserActions } from '@/components/admin/UserActions';
import { Avatar } from '@/components/auth/AccountMenu';
import { RelativeTime } from '@/components/ui/RelativeTime';

export const metadata: Metadata = { title: 'Users · Admin', robots: { index: false, follow: false } };

const FILTERS = [
  { id: 'all', label: 'Everyone' },
  { id: 'blocked', label: 'Blocked' },
  { id: 'active', label: 'Posted something' },
] as const;

export default function AdminUsersPage({ searchParams }: PageProps<'/admin/users'>) {
  return (
    <div className="container-x pb-32 pt-[calc(var(--header-h)+3rem)]">
      <Suspense fallback={<AdminSkeleton />}>
        <Users searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Users({ searchParams }: { searchParams: PageProps<'/admin/users'>['searchParams'] }) {
  const me = await requireAdminPage();
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q.trim().slice(0, 80) : '';
  const filter = FILTERS.find((f) => f.id === sp.filter)?.id ?? 'all';
  await dbReady;

  const notes = sql<number>`(select count(*)::int from "guestbook" where "guestbook"."userId" = ${schema.user.id})`;
  const reactions = sql<number>`(select count(*)::int from "reaction" where "reaction"."userId" = ${schema.user.id})`;
  const conds: (SQL | undefined)[] = [];
  if (q) conds.push(or(ilike(schema.user.name, `%${q}%`), ilike(schema.user.email, `%${q}%`)));
  if (filter === 'blocked') conds.push(isNotNull(schema.userBan.userId));
  if (filter === 'active') conds.push(sql`(${notes} + ${reactions}) > 0`);

  const rows = await db
    .select({
      id: schema.user.id,
      name: schema.user.name,
      email: schema.user.email,
      image: schema.user.image,
      createdAt: schema.user.createdAt,
      notes,
      reactions,
      // timestamps are stored as UTC without a zone; format as ISO with Z so the browser reads them correctly
      lastActive: sql<string | null>`(select to_char(max("session"."updatedAt"), 'YYYY-MM-DD"T"HH24:MI:SS"Z"') from "session" where "session"."userId" = ${schema.user.id})`,
      providers: sql<string | null>`(select string_agg(distinct "account"."providerId", ',') from "account" where "account"."userId" = ${schema.user.id})`,
      bannedAt: schema.userBan.createdAt,
      banReason: schema.userBan.reason,
    })
    .from(schema.user)
    .leftJoin(schema.userBan, eq(schema.userBan.userId, schema.user.id))
    .where(and(...conds))
    .orderBy(desc(schema.user.createdAt))
    .limit(200);

  return (
    <AdminShell user={me}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Link
              key={f.id}
              href={{ pathname: '/admin/users', query: { ...(q && { q }), ...(f.id !== 'all' && { filter: f.id }) } }}
              className={`chip h-9 px-4 transition-colors ${filter === f.id ? 'border-bone bg-bone text-ink' : 'hover:border-bone'}`}
            >
              {f.label}
            </Link>
          ))}
        </div>
        <AdminSearch placeholder="Search by name or email" />
      </div>

      <p className="mt-6 text-sm text-mute">
        {rows.length} {rows.length === 1 ? 'person' : 'people'}
        {q && <> matching “{q}”</>}. Blocking someone signs them out, stops them posting and hides their notes and reactions from the site.
      </p>

      {rows.length === 0 ? (
        <p className="mt-16 text-center text-mute">No users here.</p>
      ) : (
        <ul className="mt-6 divide-y divide-line overflow-hidden rounded-[1.2rem] border border-line">
          {rows.map((u) => {
            const isAdmin = env.adminEmails.includes(u.email.toLowerCase());
            return (
              <li key={u.id} className={`grid gap-4 p-5 md:grid-cols-12 md:items-center ${u.bannedAt ? 'bg-red-500/[0.04]' : ''}`}>
                <div className="flex min-w-0 items-center gap-4 md:col-span-4">
                  <Avatar user={u} size={44} />
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 truncate font-medium">
                      {u.name}
                      {isAdmin && <span className="rounded-full bg-ember/15 px-2 py-0.5 text-[0.62rem] uppercase tracking-[0.12em] text-ember">Admin</span>}
                      {u.bannedAt && <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[0.62rem] uppercase tracking-[0.12em] text-red-300">Blocked</span>}
                    </p>
                    <p className="truncate text-sm text-mute">{u.email}</p>
                  </div>
                </div>
                <dl className="grid grid-cols-3 gap-3 text-sm md:col-span-5">
                  <div>
                    <dt className="text-xs text-mute">Joined</dt>
                    <dd><RelativeTime iso={u.createdAt.toISOString()} /></dd>
                  </div>
                  <div>
                    <dt className="text-xs text-mute">Last active</dt>
                    <dd>{u.lastActive ? <RelativeTime iso={u.lastActive} /> : 'Signed out'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-mute">Activity</dt>
                    <dd>
                      <Link href={`/admin/guestbook?user=${u.id}`} className="link-u">{Number(u.notes)} {Number(u.notes) === 1 ? 'note' : 'notes'}</Link> · {Number(u.reactions)} {Number(u.reactions) === 1 ? 'reaction' : 'reactions'}
                    </dd>
                  </div>
                  {u.banReason && <p className="col-span-3 text-xs text-red-300/80">Block reason: {u.banReason}</p>}
                  <p className="col-span-3 text-xs text-mute">Signs in with {u.providers?.split(',').map((p) => (p === 'credential' ? 'email (dev)' : p[0].toUpperCase() + p.slice(1))).join(', ') ?? 'n/a'}</p>
                </dl>
                <div className="md:col-span-3 md:justify-self-end">
                  {isAdmin ? <p className="text-xs text-mute">{u.id === me.id ? 'This is you' : 'Admin account'}</p> : <UserActions userId={u.id} name={u.name} banned={!!u.bannedAt} />}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AdminShell>
  );
}
