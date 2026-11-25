import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getLabsUser, requireLabsPage } from '@/lib/labs';
import { dueCards, listBoards } from '@/lib/krama/data';
import { KramaHome } from '@/components/krama/KramaHome';

/** Krama lives inside Labs: the same gate applies, so everyone without access gets the normal 404. */
export async function generateMetadata(): Promise<Metadata> {
  const user = await getLabsUser();
  return { robots: { index: false, follow: false }, ...(user && { title: 'Krama' }) };
}

export default function KramaPage() {
  return (
    <Suspense fallback={<div className="container-x pt-[calc(var(--header-h)+2.5rem)]"><div className="h-72 animate-pulse rounded-[1.4rem] bg-ink-2" aria-busy /></div>}>
      <Home />
    </Suspense>
  );
}

async function Home() {
  const user = await requireLabsPage();
  const [boards, due] = await Promise.all([listBoards(user.id), dueCards(user.id)]);
  return <KramaHome boards={boards} due={due} firstName={user.name.split(' ')[0]} />;
}
