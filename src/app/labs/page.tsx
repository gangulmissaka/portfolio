import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense, ViewTransition } from 'react';
import { getLabsUser, requireLabsPage } from '@/lib/labs';
import { FadeUp } from '@/components/motion/Reveal';
import { pageTransition } from '@/lib/transitions';

/**
 * Private section: only the admin and approved accounts (Admin → Labs) get past requireLabsPage(); everyone else,
 * signed in or not, gets the site's normal 404. Nothing about Labs is in the static shell or the metadata for them.
 */
export async function generateMetadata(): Promise<Metadata> {
  const user = await getLabsUser();
  return { robots: { index: false, follow: false }, ...(user && { title: 'Labs' }) };
}

export default function LabsPage() {
  return (
    <ViewTransition {...pageTransition}>
      <div className="container-x pb-32 pt-[calc(var(--header-h)+4rem)]">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-[1.6rem] bg-ink-2" aria-busy />}>
          <Labs />
        </Suspense>
      </div>
    </ViewTransition>
  );
}

async function Labs() {
  const user = await requireLabsPage();

  return (
    <div>
      <FadeUp onIntro className="border-b border-line pb-12">
        <p className="eyebrow flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-ember" aria-hidden /> Private · invite only
        </p>
        <h1 className="display mt-6 text-[clamp(3.4rem,10vw,10rem)]">Labs</h1>
        <p className="lead mt-6 max-w-[48ch]">
          Hi {user.name.split(' ')[0]}. This is where early experiments will live before they are ready for the rest of the site.
          You can see it because you have been given access.
        </p>
      </FadeUp>

      <FadeUp delay={0.15} className="mt-12 flex flex-col items-start gap-6 rounded-[1.4rem] border border-dashed border-line-2 p-8 md:p-12">
        <span className="rounded-full border border-line-2 px-2.5 py-0.5 text-[0.65rem] uppercase tracking-[0.12em] text-mute">Coming soon</span>
        <p className="max-w-[52ch] text-2xl font-medium tracking-tight">Nothing here yet. The first experiments are on their way.</p>
        <div className="flex flex-wrap gap-3">
          {user.isAdmin && <Link href="/admin/labs" className="btn btn-solid">Manage who has access</Link>}
          <Link href="/work" className="btn">Back to the work</Link>
        </div>
      </FadeUp>
    </div>
  );
}
