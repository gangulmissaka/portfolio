'use client';

import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from '@/lib/gsap';

/** A number that counts up from zero the first time it scrolls into view. Keeps leading zeros (e.g. "06"). */
export function CountUp({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useGSAP(() => {
    const el = ref.current;
    const target = parseInt(value, 10);
    if (!el || Number.isNaN(target) || prefersReducedMotion()) return;
    const pad = value.length;
    const o = { v: 0 };
    el.textContent = '0'.padStart(pad, '0');
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      once: true,
      onEnter: () =>
        gsap.to(o, {
          v: target,
          duration: 1.6,
          ease: 'power3.out',
          onUpdate: () => (el.textContent = String(Math.round(o.v)).padStart(pad, '0')),
        }),
    });
    return () => st.kill();
  });
  return (
    <span ref={ref} className={`tabular-nums ${className ?? ''}`}>
      {value}
    </span>
  );
}
