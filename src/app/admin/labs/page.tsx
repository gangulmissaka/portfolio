import type { Metadata } from 'next';
import { Suspense } from 'react';
import { desc } from 'drizzle-orm';
import { requireAdminPage } from '@/lib/admin';
import { db, dbReady, schema } from '@/lib/db';
import { env } from '@/lib/env';
import { labsKey } from '@/lib/labs';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminSkeleton } from '@/components/admin/AdminSkeleton';
import { LabsAccessManager } from '@/components/admin/LabsAccessManager';

export const metadata: Metadata = { title: 'Labs · Admin', robots: { index: false, follow: false } };

export default function AdminLabsPage() {
  return (
    <div className="container-x pb-32 pt-[calc(var(--header-h)+3rem)]">
      <Suspense fallback={<AdminSkeleton />}>
        <Labs />
      </Suspense>
    </div>
  );
}

async function Labs() {
  const me = await requireAdminPage();
  await dbReady;
  const [rows, users] = await Promise.all([
    db.select().from(schema.labsAccess).orderBy(desc(schema.labsAccess.createdAt)),
    db.select({ name: schema.user.name, email: schema.user.email, image: schema.user.image }).from(schema.user),
  ]);
  // match approved addresses to accounts the same way the access check does (Gmail dots/+tags ignored)
  const byKey = new Map(users.map((u) => [labsKey(u.email), u]));

  return (
    <AdminShell user={me}>
      <div className="max-w-2xl">
        <h2 className="text-2xl font-medium tracking-tight">Who can open Labs</h2>
        <p className="mt-2 text-sm leading-relaxed text-mute">
          Labs is hidden from everyone else: no link in the menu, and <span className="font-mono text-bone-2">/labs</span> shows the
          normal “page not found”. Add a Google address below and that person sees Labs the next time they load a page while signed in.
          Removing them takes effect on their next page load. Blocked users never get in.
        </p>
      </div>

      <LabsAccessManager
        admins={env.adminEmails}
        entries={rows.map((r) => {
          const u = byKey.get(r.key);
          return {
            key: r.key,
            email: r.email,
            note: r.note,
            createdAt: r.createdAt.toISOString(),
            member: u ? { name: u.name, image: u.image } : null,
          };
        })}
      />
    </AdminShell>
  );
}
