import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { getLabsUser, requireLabsPage } from '@/lib/labs';
import { dueCards } from '@/lib/krama/data';
import { MonthCalendar } from '@/components/krama/calendar';
import { AppLock } from '@/components/krama/AppLock';
import { Icon } from '@/components/krama/ui';

export async function generateMetadata(): Promise<Metadata> {
  const user = await getLabsUser();
  return { robots: { index: false, follow: false }, ...(user && { title: 'Calendar · Krama' }) };
}

/** Every board's due cards on one Sri Lankan calendar. Clicking a card opens it on its board. */
export default function KramaCalendarPage() {
  return (
    <Suspense fallback={<div className="container-x h-dvh pb-4 pt-[calc(var(--header-h)+4rem)]"><div className="h-full animate-pulse rounded-[1.4rem] bg-ink-2" aria-busy /></div>}>
      <Calendar />
    </Suspense>
  );
}

async function Calendar() {
  const user = await requireLabsPage();
  const due = await dueCards(user);
  return (
    <div data-krama-app className="flex h-dvh flex-col pt-[var(--header-h)]" style={{ background: 'radial-gradient(120% 90% at 0% 0%, #2a1a10 0%, #14100c 50%, #0c0a08 100%)' }}>
      <AppLock />
      <div className="flex flex-wrap items-center gap-3 px-[var(--gutter)] py-3">
        <Link href="/labs/krama" className="grid size-9 place-items-center rounded-full border border-line-2 bg-ink/40 text-bone-2 hover:border-bone hover:text-bone" aria-label="All boards">
          <Icon name="back" />
        </Link>
        <h1 className="text-lg font-medium tracking-tight">Calendar · all boards</h1>
        <span className="text-sm text-mute">{due.length} cards with due dates</span>
      </div>
      <div className="flex min-h-0 flex-1 px-[var(--gutter)] pb-4">
        <MonthCalendar
          items={due.map((d) => ({
            id: d.id,
            title: d.title,
            dueDate: d.dueDate,
            dueTime: d.dueTime,
            done: d.dueDone,
            priority: d.priority,
            color: d.cover,
            sub: d.boardTitle,
            href: `/labs/krama/b/${d.boardId}?card=${d.id}`,
          }))}
        />
      </div>
    </div>
  );
}
