import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense, ViewTransition } from 'react';
import { PROJECTS, getProject } from '@/content/site';
import { ProjectCover } from '@/components/work/ProjectCover';
import { FadeUp, SplitReveal } from '@/components/motion/Reveal';
import { VideoEmbed } from '@/components/work/VideoEmbed';
import { GALLERY } from '@/components/work/gallery';
import { Reactions } from '@/components/work/Reactions';
import { pageTransition } from '@/lib/transitions';

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<'/work/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) return {};
  return { title: p.title, description: p.summary, alternates: { canonical: `/work/${p.slug}` }, openGraph: { title: `${p.title}: ${p.kicker}`, description: p.summary } };
}

export default function CaseStudyPage({ params }: PageProps<'/work/[slug]'>) {
  return (
    <Suspense fallback={<CaseStudySkeleton />}>
      <CaseStudy params={params} />
    </Suspense>
  );
}

function CaseStudySkeleton() {
  return (
    <div className="container-x pt-[calc(var(--header-h)+6rem)]" aria-busy>
      <div className="h-[clamp(3.6rem,12vw,12rem)] w-2/3 animate-pulse rounded-2xl bg-ink-2" />
      <div className="mt-16 aspect-[16/8] animate-pulse rounded-[1.6rem] bg-ink-2" />
    </div>
  );
}

async function CaseStudy({ params }: { params: PageProps<'/work/[slug]'>['params'] }) {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) notFound();
  const idx = PROJECTS.indexOf(p);
  const next = PROJECTS[(idx + 1) % PROJECTS.length];

  return (
    <ViewTransition {...pageTransition}>
      <article>
        <header className="container-x pt-[calc(var(--header-h)+4rem)] md:pt-[calc(var(--header-h)+6rem)]">
          <FadeUp onIntro className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <Link href="/work" transitionTypes={['nav-back']} className="link-u eyebrow">← All work</Link>
            <span className="eyebrow">{String(idx + 1).padStart(2, '0')} / {String(PROJECTS.length).padStart(2, '0')} · {p.category}</span>
          </FadeUp>
          <SplitReveal onIntro as="h1" className="display text-[clamp(3.6rem,12vw,12rem)]">{p.title}</SplitReveal>
          <SplitReveal onIntro delay={0.2} as="p" className="mt-4 max-w-[30ch] font-serif text-[clamp(1.5rem,3vw,2.6rem)] italic leading-tight text-bone-2">{p.kicker}</SplitReveal>
        </header>

        <div className="container-x mt-12 md:mt-16">
          <ViewTransition name={`cover-${p.slug}`} share="morph" default="none">
            <div className="aspect-[4/3] overflow-hidden rounded-[1.6rem] md:aspect-[16/8]">
              <ProjectCover slug={p.slug} priority sizes="100vw" />
            </div>
          </ViewTransition>
        </div>

        {/* meta */}
        <section className="container-x mt-12 grid gap-px overflow-hidden rounded-[1.2rem] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4" aria-label="Project facts">
          {[['Role', p.role], ['Platform', p.platform], ['Year', p.year], ['Status', p.status]].map(([k, v]) => (
            <div key={k} className="bg-ink p-6">
              <p className="eyebrow">{k}</p>
              <p className="mt-3 text-bone">{v}</p>
            </div>
          ))}
        </section>

        {/* overview */}
        <section className="container-x grid gap-10 py-24 md:grid-cols-12 md:py-32">
          <p className="eyebrow md:col-span-3">Overview</p>
          <div className="space-y-6 md:col-span-8">
            {p.overview.map((para, i) => (
              <FadeUp key={i} as="p" className={i === 0 ? 'text-[clamp(1.4rem,2.4vw,2.2rem)] font-medium leading-snug tracking-[-0.02em]' : 'lead'}>
                {para}
              </FadeUp>
            ))}
            {p.links.length > 0 && (
              <FadeUp className="flex flex-wrap gap-3 pt-4">
                {p.links.map((l, i) => (
                  <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className={`btn ${i === 0 ? 'btn-solid' : 'btn-ghost'}`}>
                    {l.label} <span aria-hidden>↗</span>
                  </a>
                ))}
              </FadeUp>
            )}
          </div>
        </section>

        {p.video && (
          <section className="container-x pb-24" aria-label="Video">
            <VideoEmbed id={p.video} title={`${p.title} trailer`} />
          </section>
        )}

        {p.challenge && (
          <section className="bg-bone text-ink">
            <div className="container-x grid gap-10 py-24 md:grid-cols-12 md:py-32">
              <p className="eyebrow !text-ink/55 md:col-span-3">The challenge</p>
              <SplitReveal as="p" className="text-[clamp(1.6rem,3.4vw,3.2rem)] font-medium leading-[1.12] tracking-[-0.035em] md:col-span-9">
                {p.challenge}
              </SplitReveal>
            </div>
          </section>
        )}

        {/* highlights */}
        <section className="container-x py-24 md:py-32" aria-labelledby="hl-title">
          <div className="mb-12 grid gap-6 md:grid-cols-12">
            <p className="eyebrow md:col-span-3">What I built</p>
            <h2 id="hl-title" className="h-lg md:col-span-9">Key decisions & features</h2>
          </div>
          <ol className="grid gap-px overflow-hidden rounded-[1.4rem] border border-line bg-line md:grid-cols-2">
            {p.highlights.map((h, i) => (
              <FadeUp as="li" key={h.title} delay={(i % 2) * 0.08} className="bg-ink p-7 md:p-10">
                <span className="font-mono text-xs text-ember">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="mt-6 text-2xl font-medium tracking-tight">{h.title}</h3>
                <p className="mt-3 max-w-[48ch] leading-relaxed text-bone-2">{h.body}</p>
              </FadeUp>
            ))}
          </ol>
        </section>

        {GALLERY[p.slug] && (
          <section className="container-x pb-24" aria-label="Screenshots">
            <div className={`grid gap-6 ${GALLERY[p.slug].length > 1 ? 'md:grid-cols-2' : 'mx-auto max-w-2xl'}`}>
              {GALLERY[p.slug].map((shot, i) => (
                <FadeUp as="figure" key={shot.caption} delay={(i % 2) * 0.08} className={GALLERY[p.slug].length > 2 && i === 0 ? 'md:col-span-2' : ''}>
                  <div className="overflow-hidden rounded-2xl border border-line">
                    <Image src={shot.src} alt={shot.alt} placeholder="blur" sizes={GALLERY[p.slug].length > 2 && i === 0 ? '100vw' : '(min-width: 768px) 50vw, 100vw'} className="w-full" />
                  </div>
                  <figcaption className="mt-3 text-sm text-mute">{shot.caption}</figcaption>
                </FadeUp>
              ))}
            </div>
          </section>
        )}

        {/* stack + reactions */}
        <section className="container-x grid gap-10 border-t border-line py-16 md:grid-cols-12">
          <p className="eyebrow md:col-span-3">Built with</p>
          <ul className="flex flex-wrap gap-2 md:col-span-6">
            {p.stack.map((s) => <li key={s} className="chip h-9 px-4">{s}</li>)}
          </ul>
          <div className="md:col-span-3 md:justify-self-end">
            <Suspense fallback={<div className="h-11" />}>
              <Reactions slug={p.slug} />
            </Suspense>
          </div>
        </section>

        {/* next project */}
        <Link href={`/work/${next.slug}`} prefetch={true} transitionTypes={['nav-forward']} className="group block border-t border-line" data-cursor="Next">
          <div className="container-x grid items-end gap-6 py-20 md:grid-cols-12 md:py-28">
            <p className="eyebrow md:col-span-3">Next project</p>
            <p className="display text-[clamp(3rem,9vw,9rem)] transition-colors duration-500 group-hover:text-ember md:col-span-7">{next.title}</p>
            <span className="grid size-16 place-items-center justify-self-start rounded-full border border-line-2 text-xl transition-all duration-500 group-hover:rotate-[-45deg] group-hover:bg-ember group-hover:text-ink md:col-span-2 md:justify-self-end" aria-hidden>→</span>
          </div>
        </Link>
      </article>
    </ViewTransition>
  );
}
