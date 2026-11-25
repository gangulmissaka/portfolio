import { sql } from 'drizzle-orm';
import type { ReactNode } from 'react';
import { db, dbKind } from '@/lib/db';
import type { SessionUser } from '@/lib/auth';
import { AdminTabs } from './AdminTabs';

/** Header + tabs for every admin page. Rendered only after requireAdminPage() has passed. */
export async function AdminShell({ user, children }: { user: SessionUser; children: ReactNode }) {
  const [c] = await db
    .select({
      unread: sql<number>`(select count(*)::int from "message" where "status" = 'new')`,
      pending: sql<number>`(select count(*)::int from "guestbook" where "status" = 'pending')`,
      users: sql<number>`(select count(*)::int from "user")`,
      labs: sql<number>`(select count(*)::int from "labs_access")`,
    })
    .from(sql`(select 1) as one`);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-ember" /> Admin · signed in as {user.email}
          </p>
          <h1 className="h-xl mt-3">Control room</h1>
        </div>
        <p className="text-xs text-mute">{dbKind === 'pglite' ? 'Local test database (resets on restart)' : 'Live database'}</p>
      </div>
      <AdminTabs counts={{ users: Number(c.users), guestbook: Number(c.pending), messages: Number(c.unread), labs: Number(c.labs) }} />
      <div className="mt-10">{children}</div>
    </div>
  );
}
