'use client';

import { useRef } from 'react';
import { PROCESS } from '@/content/site';
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import { Spotlight } from '@/components/motion/Spotlight';

/**
 * The four steps, all visible at once (4 columns on wide screens, 2 on tablets, 1 on phones) so nothing is ever
 * cut off at the edge. Cards rise in one after another, a line draws across, and the big numbers drift with scroll.
 */
export function ProcessScroller() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const cards = gsap.utils.toArray<HTMLElement>('[data-step]');
      gsap.set(cards, { y: 70, autoAlpha: 0 });
      ScrollTrigger.batch(cards, {
        start: 'top 88%',
        once: true,
        onEnter: (batch) => gsap.to(batch, { y: 0, autoAlpha: 1, duration: 1.1, stagger: 0.12, ease: 'expo' }),
      });
      gsap.fromTo('[data-progress]', { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top 70%', end: 'bottom 60%', scrub: true } });
      gsap.utils.toArray<HTMLElement>('[data-step-num]').forEach((n, i) => {
        gsap.fromTo(n, { yPercent: 30 + i * 8 }, { yPercent: -20, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="process" className="relative overflow-clip border-y border-line bg-ink-2 py-24 md:py-32" aria-labelledby="process-title">
      <div className="container-x mb-12 flex flex-wrap items-end justify-between gap-6 md:mb-16">
        <div>
          <p className="eyebrow mb-4">How I work</p>
          <h2 id="process-title" className="h-lg max-w-[16ch]">
            Four steps, <span className="serif-i text-ember">every</span> time.
          </h2>
        </div>
        <div className="hidden w-56 md:block" aria-hidden>
          <div className="h-px bg-line"><div data-progress className="h-px origin-left scale-x-0 bg-ember" /></div>
        </div>
      </div>
      <Spotlight className="container-x grid gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-4">
        {PROCESS.map((s) => (
          <article
            key={s.n}
            data-step
            data-spot
            className="relative flex min-h-[22rem] flex-col justify-between overflow-hidden rounded-[1.4rem] border border-line bg-ink p-7 md:min-h-[26rem] md:p-9"
          >
            <span data-step-num className="pointer-events-none absolute -right-3 -top-8 select-none font-serif text-[10rem] italic leading-none text-ember/15 md:text-[12rem]" aria-hidden>
              {s.n}
            </span>
            <p className="relative font-mono text-xs text-mute">{s.n} · {s.line}</p>
            <div className="relative mt-16">
              <h3 className="text-[clamp(2rem,2.8vw,3rem)] font-medium leading-none tracking-[-0.04em]">{s.title}</h3>
              <p className="mt-4 leading-relaxed text-bone-2">{s.body}</p>
            </div>
          </article>
        ))}
      </Spotlight>
    </section>
  );
}
