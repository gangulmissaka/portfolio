import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { desc, eq, ne } from 'drizzle-orm';
import { requireAdminPage } from '@/lib/admin';
import { db, dbReady, schema } from '@/lib/db';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminSkeleton } from '@/components/admin/AdminSkeleton';
import { MessageActions } from '@/components/admin/MessageActions';
import { RelativeTime } from '@/components/ui/RelativeTime';

export const metadata: Metadata = { title: 'Messages · Admin', robots: { index: false, follow: false } };

const VIEWS = [
  { id: 'inbox', label: 'Inbox' },
  { id: 'archived', label: 'Archived' },
] as const;

const TOPIC: Record<string, string> = { internship: 'Internship', job: 'Graduate role', project: 'Project', general: 'General' };

export default function AdminMessagesPage({ searchParams }: PageProps<'/admin/messages'>) {
  return (
    <div className="container-x pb-32 pt-[calc(var(--header-h)+3rem)]">
      <Suspense fallback={<AdminSkeleton />}>
        <Messages searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Messages({ searchParams }: { searchParams: PageProps<'/admin/messages'>['searchParams'] }) {
  const me = await requireAdminPage();
  const sp = await searchParams;
  const view = sp.view === 'archived' ? 'archived' : 'inbox';
  await dbReady;
  const rows = await db
    .select()
    .from(schema.message)
    .where(view === 'archived' ? eq(schema.message.status, 'archived') : ne(schema.message.status, 'archived'))
    .orderBy(desc(schema.message.createdAt))
    .limit(200);

  return (
    <AdminShell user={me}>
      <div className="flex gap-2">
        {VIEWS.map((v) => (
          <Link key={v.id} href={v.id === 'inbox' ? '/admin/messages' : '/admin/messages?view=archived'} className={`chip h-9 px-4 transition-colors ${view === v.id ? 'border-bone bg-bone text-ink' : 'hover:border-bone'}`}>
            {v.label}
          </Link>
        ))}
      </div>
      {rows.length === 0 ? (
        <p className="mt-16 text-center text-mute">{view === 'inbox' ? 'Inbox zero. Nice.' : 'Nothing archived.'}</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((m) => (
            <li key={m.id} className={`rounded-2xl border p-6 ${m.status === 'new' ? 'border-ember/50 bg-ember/[0.05]' : 'border-line'}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <p className="font-medium">
                  {m.status === 'new' && <span className="mr-2 inline-block size-2 rounded-full bg-ember align-middle" aria-label="Unread" />}
                  {m.name} <a href={`mailto:${m.email}`} className="link-u ml-1 text-sm font-normal text-mute">{m.email}</a>
                </p>
                <p className="flex items-center gap-3 text-xs text-mute">
                  <span className="chip h-6 px-2.5 text-[0.7rem]">{TOPIC[m.topic] ?? m.topic}</span>
                  <RelativeTime iso={m.createdAt.toISOString()} />
                </p>
              </div>
              <p className="mt-4 whitespace-pre-wrap leading-relaxed text-bone-2">{m.body}</p>
              <MessageActions id={m.id} status={m.status} email={m.email} name={m.name} />
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}
