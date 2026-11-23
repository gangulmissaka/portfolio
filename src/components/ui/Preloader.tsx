'use client';

import { useRef, useState } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import { markIntroDone } from '@/lib/intro';
import { getLenis } from '@/components/motion/SmoothScroll';

/**
 * First visit of a session: a short counter and name, then the curtain lifts.
 * Later visits (and reduced motion) skip straight to the page.
 */
export function Preloader() {
  const ref = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);

  useGSAP(
    () => {
      const el = ref.current!;
      const seen = sessionStorage.getItem('gm:intro') === '1';
      if (seen || prefersReducedMotion()) {
        setGone(true);
        markIntroDone();
        return;
      }
      sessionStorage.setItem('gm:intro', '1');
      document.documentElement.classList.add('is-loading');
      requestAnimationFrame(() => getLenis()?.stop());
      const counter = { v: 0 };
      const num = el.querySelector<HTMLElement>('[data-num]')!;
      const tl = gsap.timeline({
        onComplete: () => {
          document.documentElement.classList.remove('is-loading');
          getLenis()?.start();
          setGone(true);
        },
      });
      tl.from('[data-pl-char]', { yPercent: 110, stagger: 0.035, duration: 1, ease: 'expo' })
        .to(counter, {
          v: 100,
          duration: 1.5,
          ease: 'power2.inOut',
          onUpdate: () => (num.textContent = String(Math.round(counter.v)).padStart(3, '0')),
        }, 0.1)
        .to('[data-bar]', { scaleX: 1, duration: 1.5, ease: 'power2.inOut' }, 0.1)
        .to('[data-pl-char]', { yPercent: -110, stagger: 0.02, duration: 0.7, ease: 'quart' }, '>-0.05')
        .to('[data-pl-meta]', { autoAlpha: 0, duration: 0.3 }, '<')
        .to(el, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.1, ease: 'quart' }, '>-0.25')
        .add(() => markIntroDone(), '<0.35');
    },
    { scope: ref },
  );

  if (gone) return null;
  const word = 'Gangul Missaka';
  return (
    <div
      ref={ref}
      data-preloader
      aria-hidden
      className="fixed inset-0 z-[95] flex flex-col justify-between bg-ink-2 container-x py-6"
      style={{ clipPath: 'inset(0% 0% 0% 0%)' }}
    >
      <div data-pl-meta className="flex justify-between eyebrow">
        <span>Portfolio ©2026</span>
        <span>Colombo, LK</span>
      </div>
      <div className="overflow-clip">
        <p className="display text-[clamp(3rem,12vw,11rem)] whitespace-nowrap">
          {word.split('').map((c, i) => (
            <span key={i} data-pl-char className="inline-block">
              {c === ' ' ? ' ' : c}
            </span>
          ))}
        </p>
      </div>
      <div data-pl-meta className="flex items-end justify-between gap-6">
        <div className="h-px flex-1 bg-line">
          <div data-bar className="h-px origin-left scale-x-0 bg-ember" />
        </div>
        <span data-num className="font-mono text-sm tabular-nums text-bone-2">000</span>
      </div>
    </div>
  );
}
