'use client';

import { useRef, type ReactNode } from 'react';
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from '@/lib/gsap';

/**
 * Endless ticker that reacts to scrolling: it speeds up with scroll velocity and flips direction
 * when you scroll back up, then eases back to its calm pace.
 */
export function Marquee({ items, duration = 38, className, separator = '✦' }: { items: ReactNode[]; duration?: number; className?: string; separator?: ReactNode }) {
  const track = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const el = track.current;
    if (!el || prefersReducedMotion()) return;
    const loop = gsap.to(el, { xPercent: -50, ease: 'none', duration, repeat: -1 });
    let dir = 1;
    const st = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        dir = self.direction;
        const boost = gsap.utils.clamp(1, 6, 1 + Math.abs(self.getVelocity()) / 400);
        gsap.to(loop, { timeScale: boost * dir, duration: 0.25, overwrite: true });
        gsap.to(loop, { timeScale: dir, duration: 1.4, delay: 0.25, ease: 'power2.out' });
      },
    });
    return () => {
      st.kill();
      loop.kill();
    };
  });

  const row = (hidden: boolean) =>
    items.map((it, i) => (
      <span key={`${hidden}-${i}`} className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
        <span className="px-[2.5vw]">{it}</span>
        <span className="text-ember" aria-hidden>{separator}</span>
      </span>
    ));

  return (
    <div className={`flex overflow-clip select-none [mask-image:linear-gradient(90deg,transparent,black_7%,black_93%,transparent)] ${className ?? ''}`}>
      <div ref={track} className="flex w-max shrink-0 will-change-transform">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
