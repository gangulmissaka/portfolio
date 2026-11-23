'use client';

import { usePathname } from 'next/navigation';
import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { getLenis } from './SmoothScroll';

const R = 22;
const C = 2 * Math.PI * R;

/** Thin ember reading-progress line at the top, plus a back-to-top button whose ring fills as you read. */
export function ScrollProgress() {
  const pathname = usePathname();
  const bar = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const ring = useRef<SVGCircleElement>(null);

  useGSAP(
    () => {
      const setBar = gsap.quickSetter(bar.current, 'scaleX');
      let shown = false;
      const st = ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: (self) => {
          setBar(self.progress);
          ring.current?.setAttribute('stroke-dashoffset', String(C * (1 - self.progress)));
          const want = self.scroll() > window.innerHeight * 0.9;
          if (want !== shown) {
            shown = want;
            gsap.to(btn.current, { autoAlpha: want ? 1 : 0, y: want ? 0 : 16, scale: want ? 1 : 0.8, duration: 0.6, ease: 'expo' });
          }
        },
      });
      return () => st.kill();
    },
    { dependencies: [pathname], revertOnUpdate: true },
  );

  return (
    <>
      <div className="no-print pointer-events-none fixed inset-x-0 top-0 z-[85] h-[2px]">
        <div ref={bar} className="h-full origin-left scale-x-0 bg-gradient-to-r from-ember to-ember-2" />
      </div>
      <button
        ref={btn}
        type="button"
        aria-label="Back to top"
        onClick={() => {
          const l = getLenis();
          if (l) l.scrollTo(0, { duration: 1.6 });
          else window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className="no-print group fixed bottom-5 right-5 z-[80] grid size-14 place-items-center rounded-full border border-line bg-ink-2/80 backdrop-blur-xl"
        style={{ opacity: 0, visibility: 'hidden' }}
      >
        <svg viewBox="0 0 48 48" className="absolute inset-0 size-full -rotate-90" aria-hidden>
          <circle cx="24" cy="24" r={R} fill="none" stroke="var(--color-line-2)" strokeWidth="1.5" />
          <circle ref={ring} cx="24" cy="24" r={R} fill="none" stroke="var(--color-ember)" strokeWidth="1.5" strokeDasharray={C} strokeDashoffset={C} strokeLinecap="round" />
        </svg>
        <span className="relative transition-transform duration-500 group-hover:-translate-y-1" aria-hidden>↑</span>
      </button>
    </>
  );
}
