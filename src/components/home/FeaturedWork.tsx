'use client';

import Link from 'next/link';
import { useRef, ViewTransition } from 'react';
import type { Project } from '@/content/site';
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import { ProjectCover } from '@/components/work/ProjectCover';

/** Featured projects as a deck: each card sticks, and the one underneath sinks back as the next slides over it. */
export function FeaturedWork({ projects }: { projects: Project[] }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const cards = gsap.utils.toArray<HTMLElement>('[data-card]');
      cards.forEach((card, i) => {
        if (i === cards.length - 1) return;
        gsap.to(card.firstElementChild, {
          scale: 0.9,
          filter: 'brightness(0.45)',
          ease: 'none',
          scrollTrigger: { trigger: cards[i + 1], start: 'top bottom', end: 'top top+=96', scrub: true },
        });
      });
      gsap.utils.toArray<HTMLElement>('[data-card-cover]').forEach((el) => {
        gsap.fromTo(el, { scale: 1.12 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 30%', scrub: true } });
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className="relative">
      {projects.map((p, i) => (
        <div key={p.slug} data-card className="sticky top-[5.5rem] pb-6" style={{ zIndex: i + 1 }}>
          <article className="origin-top overflow-hidden rounded-[1.6rem] border border-line bg-ink-2 will-change-transform">
            <Link href={`/work/${p.slug}`} prefetch={true} className="group grid md:min-h-[min(78vh,46rem)] md:grid-cols-12" data-cursor="View" transitionTypes={['nav-forward']}>
              <div className="flex flex-col justify-between gap-10 p-6 md:col-span-5 md:p-10">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-mute">{String(i + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}</span>
                  <span className="chip">{p.category}</span>
                </div>
                <div>
                  <h3 className="h-lg">{p.title}</h3>
                  <p className="mt-3 font-serif text-[clamp(1.3rem,1.9vw,1.8rem)] italic leading-tight text-bone-2">{p.kicker}</p>
                  <p className="mt-6 max-w-[42ch] text-[0.98rem] leading-relaxed text-mute">{p.summary}</p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <ul className="flex flex-wrap gap-2" aria-label="Built with">
                    {p.stack.slice(0, 3).map((s) => <li key={s} className="chip">{s}</li>)}
                  </ul>
                  <span className="flex items-center gap-2 text-sm">
                    <span className="link-u">Case study</span>
                    <span className="grid size-9 place-items-center rounded-full border border-line-2 transition-all duration-500 group-hover:rotate-[-45deg] group-hover:border-ember group-hover:bg-ember group-hover:text-ink" aria-hidden>→</span>
                  </span>
                </div>
              </div>
              <div
                className="relative aspect-[16/11] overflow-hidden md:col-span-7 md:aspect-auto"
                onPointerMove={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  const inner = e.currentTarget.querySelector('[data-drift]');
                  gsap.to(inner, { x: ((e.clientX - r.left) / r.width - 0.5) * 24, y: ((e.clientY - r.top) / r.height - 0.5) * 18, duration: 0.9, ease: 'power3.out' });
                }}
                onPointerLeave={(e) => gsap.to(e.currentTarget.querySelector('[data-drift]'), { x: 0, y: 0, duration: 1.2, ease: 'expo' })}
              >
                <ViewTransition name={`cover-${p.slug}`} share="morph" default="none">
                  <div className="absolute inset-0 overflow-hidden">
                    <div data-card-cover className="h-full w-full">
                      <div data-drift className="-m-4 h-[calc(100%+2rem)] w-[calc(100%+2rem)] transition-[scale] duration-[1.2s] ease-[var(--ease-out-expo)] group-hover:scale-[1.04]">
                        <ProjectCover slug={p.slug} priority={i === 0} sizes="(min-width: 768px) 58vw, 100vw" />
                      </div>
                    </div>
                  </div>
                </ViewTransition>
              </div>
            </Link>
          </article>
        </div>
      ))}
    </div>
  );
}
