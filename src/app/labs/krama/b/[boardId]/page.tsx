import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getLabsUser, requireLabsPage } from '@/lib/labs';
import { loadBoard } from '@/lib/krama/data';
import { AppLock } from '@/components/krama/AppLock';
import { BoardApp } from '@/components/krama/BoardApp';

export async function generateMetadata(): Promise<Metadata> {
  const user = await getLabsUser();
  return { robots: { index: false, follow: false }, ...(user && { title: 'Board · Krama' }) };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Cache Components needs one param to prerender this route's static shell (the skeleton below); real board ids
 * are rendered at request time behind the Labs check. This placeholder never matches a board.
 */
export function generateStaticParams() {
  return [{ boardId: '00000000-0000-4000-8000-000000000000' }];
}

export default function BoardPage({ params }: PageProps<'/labs/krama/b/[boardId]'>) {
  return (
    <Suspense fallback={<div data-krama-app className="h-dvh bg-ink pt-[calc(var(--header-h)+4rem)]"><AppLock /><div className="container-x flex gap-3">{[0, 1, 2].map((i) => <div key={i} className="h-72 w-[17.5rem] animate-pulse rounded-2xl bg-ink-2" />)}</div></div>}>
      <Board params={params} />
    </Suspense>
  );
}

async function Board({ params }: { params: PageProps<'/labs/krama/b/[boardId]'>['params'] }) {
  const user = await requireLabsPage();
  const { boardId } = await params;
  if (!UUID.test(boardId)) notFound();
  const data = await loadBoard(user, boardId);
  if (!data) notFound();
  return <BoardApp initial={data} />;
}
