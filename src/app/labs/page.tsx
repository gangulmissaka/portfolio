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
          Hi {user.name.split(' ')[0]}. This is where early experiments live before they are ready for the rest of the site.
          You can see it because you have been given access.
        </p>
      </FadeUp>

      <FadeUp delay={0.15} as="ul" className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <li>
          <Link
            href="/labs/krama"
            className="group flex h-full min-h-64 flex-col justify-between overflow-hidden rounded-[1.4rem] border border-line p-7 transition-all duration-500 hover:-translate-y-1 hover:border-ember/50 hover:shadow-2xl hover:shadow-black/50"
            style={{ background: 'radial-gradient(120% 90% at 0% 0%, #4a2511 0%, #1c120b 48%, #0f0b08 100%)' }}
          >
            <span className="flex items-center justify-between">
              <span className="rounded-full bg-ember/15 px-2.5 py-0.5 text-[0.65rem] uppercase tracking-[0.12em] text-ember">Live</span>
              <span className="text-bone-2 transition-transform duration-500 group-hover:translate-x-1" aria-hidden>→</span>
            </span>
            <span>
              <span className="block text-3xl font-medium tracking-tight">Krama</span>
              <span className="mt-2 block leading-relaxed text-bone-2">
                A task planner with boards, lists and cards, drag and drop, and a calendar that knows Sri Lankan holidays and Poya days.
              </span>
            </span>
          </Link>
        </li>
        <li className="flex min-h-64 flex-col justify-center rounded-[1.4rem] border border-dashed border-line-2 p-7 text-mute">
          <span className="text-sm">More experiments are on their way.</span>
          {user.isAdmin && <Link href="/admin/labs" className="mt-4 w-fit text-sm text-bone-2 underline underline-offset-4 hover:text-bone">Manage who has access</Link>}
        </li>
      </FadeUp>
    </div>
  );
}
