'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, ViewTransition } from 'react';
import { CATEGORIES, type Project } from '@/content/site';
import { gsap, isTouch } from '@/lib/gsap';
import { ProjectCover } from './ProjectCover';

type Filter = 'All' | Project['category'];

/**
 * Index of projects as big typographic rows. On desktop a cover floats after the cursor while you hover a row;
 * on touch devices each row shows its cover inline.
 */
export function WorkList({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = useState<Filter>('All');
  // only offer categories that have at least one project
  const filters: Filter[] = ['All', ...CATEGORIES.filter((c) => projects.some((p) => p.category === c))];
  const [hover, setHover] = useState<string | null>(null);
  const preview = useRef<HTMLDivElement>(null);
  const shown = projects.filter((p) => filter === 'All' || p.category === filter);

  useEffect(() => {
    const el = preview.current;
    if (!el || isTouch()) return;
    gsap.set(el, { xPercent: -50, yPercent: -50, scale: 0 });
    const xTo = gsap.quickTo(el, 'x', { duration: 0.7, ease: 'power3' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.7, ease: 'power3' });
    const rTo = gsap.quickTo(el, 'rotation', { duration: 0.9, ease: 'power3' });
    let lastX = 0;
    const move = (e: PointerEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
      rTo(gsap.utils.clamp(-8, 8, (e.clientX - lastX) * 0.6));
      lastX = e.clientX;
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, []);

  useEffect(() => {
    if (!preview.current) return;
    gsap.to(preview.current, { scale: hover ? 1 : 0, autoAlpha: hover ? 1 : 0, duration: 0.55, ease: 'expo' });
  }, [hover]);

  return (
    <div>
      <div role="tablist" aria-label="Filter projects" className="mb-8 flex flex-wrap gap-2">
        {filters.map((f) => {
          const count = f === 'All' ? projects.length : projects.filter((p) => p.category === f).length;
          return (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={`chip h-9 px-4 transition-colors ${filter === f ? 'border-bone bg-bone text-ink' : 'hover:border-bone hover:text-bone'}`}
            >
              {f} <sup className="ml-1 text-[0.6rem] opacity-60">{count}</sup>
            </button>
          );
        })}
      </div>

      <ul className="border-t border-line" onPointerLeave={() => setHover(null)}>
        {shown.map((p, i) => (
          <li key={p.slug} className="border-b border-line">
            <Link
              href={`/work/${p.slug}`} prefetch={true}
              transitionTypes={['nav-forward']}
              onPointerEnter={() => setHover(p.slug)}
              onFocus={() => setHover(p.slug)}
              onBlur={() => setHover(null)}
              className={`group grid grid-cols-12 items-baseline gap-x-4 gap-y-4 py-7 transition-opacity duration-500 md:py-9 ${hover && hover !== p.slug ? 'md:opacity-35' : ''}`}
              data-cursor="Open"
            >
              <span className="col-span-2 font-mono text-xs text-mute md:col-span-1">{String(i + 1).padStart(2, '0')}</span>
              <span className="col-span-10 md:col-span-6">
                <span className="block text-[clamp(2rem,5.4vw,5rem)] font-medium leading-none tracking-[-0.045em] transition-transform duration-700 ease-[var(--ease-out-expo)] md:group-hover:translate-x-4">
                  {p.title}
                </span>
                <span className="mt-2 block font-serif text-lg italic text-mute">{p.kicker}</span>
              </span>
              <span className="col-span-6 col-start-3 text-sm text-bone-2 md:col-span-3 md:col-start-auto">{p.category} · {p.platform}</span>
              <span className="col-span-4 text-right font-mono text-xs text-mute md:col-span-2">{p.year} <span aria-hidden className="ml-3 inline-block transition-transform duration-500 group-hover:translate-x-1">→</span></span>
              <span className="col-span-12 aspect-[16/10] overflow-hidden rounded-2xl md:hidden">
                <ViewTransition name={`cover-${p.slug}`} share="morph" default="none">
                  <span className="block h-full w-full"><ProjectCover slug={p.slug} sizes="100vw" /></span>
                </ViewTransition>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {/* floating preview (desktop) */}
      <div
        ref={preview}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[60] hidden aspect-[16/11] w-[30vw] max-w-[30rem] overflow-hidden rounded-2xl shadow-2xl shadow-black/60 md:block"
        style={{ opacity: 0, visibility: 'hidden' }}
      >
        {projects.map((p) => (
          <div key={p.slug} className="absolute inset-0 transition-[clip-path] duration-700 ease-[var(--ease-out-expo)]" style={{ clipPath: hover === p.slug ? 'inset(0 0 0 0)' : 'inset(100% 0 0 0)' }}>
            <ProjectCover slug={p.slug} sizes="30vw" />
          </div>
        ))}
      </div>
    </div>
  );
}
