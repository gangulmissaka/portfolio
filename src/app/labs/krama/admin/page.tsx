import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getLabsUser, requireLabsPage } from '@/lib/labs';
import { adminData } from '@/lib/krama/data';
import { KramaAdmin } from '@/components/krama/KramaAdmin';

/** Krama's control panel: only the Krama admin (the site admin). Everyone else gets the normal 404. */
export async function generateMetadata(): Promise<Metadata> {
  const user = await getLabsUser();
  return { robots: { index: false, follow: false }, ...(user?.isAdmin && { title: 'Admin · Krama' }) };
}

export default function KramaAdminPage({ searchParams }: PageProps<'/labs/krama/admin'>) {
  return (
    <Suspense fallback={<div className="container-x pt-[calc(var(--header-h)+2.5rem)]"><div className="h-72 animate-pulse rounded-[1.4rem] bg-ink-2" aria-busy /></div>}>
      <Admin searchParams={searchParams} />
    </Suspense>
  );
}

async function Admin({ searchParams }: { searchParams: PageProps<'/labs/krama/admin'>['searchParams'] }) {
  const user = await requireLabsPage();
  if (!user.isAdmin) notFound();
  const sp = await searchParams;
  const from = typeof sp.from === 'string' && /^[0-9a-f-]{36}$/i.test(sp.from) ? sp.from : null;
  const tab = typeof sp.tab === 'string' ? sp.tab : null;
  const data = await adminData();
  return <KramaAdmin data={data} from={from} initialTab={tab} me={user.email} />;
}
