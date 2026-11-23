'use client';

import { useRef } from 'react';
import { PROCESS } from '@/content/site';
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import { Spotlight } from '@/components/motion/Spotlight';

/** Pinned section whose four steps travel sideways with the scroll (desktop); a simple stack on phones. */
export function ProcessScroller() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const mm = gsap.matchMedia();
      mm.add('(min-width: 900px)', () => {
        const el = track.current!;
        const distance = () => el.scrollWidth - window.innerWidth;
        const tween = gsap.to(el, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        });
        gsap.utils.toArray<HTMLElement>('[data-step-num]').forEach((n) => {
          gsap.fromTo(n, { yPercent: 40, opacity: 0.15 }, {
            yPercent: 0, opacity: 1, ease: 'none',
            scrollTrigger: { trigger: n, containerAnimation: tween, start: 'left 95%', end: 'left 45%', scrub: true },
          });
        });
        gsap.to('[data-progress]', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top top', end: () => `+=${distance()}`, scrub: true } });
        return () => ScrollTrigger.refresh();
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="process" className="relative overflow-clip border-y border-line bg-ink-2 py-20 md:flex md:h-[100svh] md:flex-col md:justify-center md:py-0" aria-labelledby="process-title">
      <div className="container-x mb-10 flex items-end justify-between gap-6 md:mb-14">
        <div>
          <p className="eyebrow mb-4">How I work</p>
          <h2 id="process-title" className="h-lg max-w-[16ch]">
            Four steps, <span className="serif-i text-ember">every</span> time.
          </h2>
        </div>
        <div className="hidden w-56 md:block">
          <div className="h-px bg-line"><div data-progress className="h-px origin-left scale-x-0 bg-ember" /></div>
        </div>
      </div>
      <Spotlight>
      <div ref={track} className="flex flex-col gap-4 container-x md:w-max md:flex-row md:gap-6 md:pr-[10vw]">
        {PROCESS.map((s) => (
          <article key={s.n} data-spot className="relative flex flex-col justify-between overflow-hidden rounded-[1.4rem] border border-line bg-ink p-7 md:h-[58vh] md:w-[min(34rem,42vw)] md:p-10">
            <span data-step-num className="pointer-events-none absolute -right-4 -top-10 select-none font-serif text-[11rem] italic leading-none text-ember/15 md:text-[16rem]" aria-hidden>
              {s.n}
            </span>
            <p className="font-mono text-xs text-mute">{s.n} · {s.line}</p>
            <div className="mt-16">
              <h3 className="h-lg">{s.title}</h3>
              <p className="mt-4 max-w-[36ch] leading-relaxed text-bone-2">{s.body}</p>
            </div>
          </article>
        ))}
      </div>
      </Spotlight>
    </section>
  );
}
