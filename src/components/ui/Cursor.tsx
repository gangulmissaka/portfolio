'use client';

import { useEffect, useRef } from 'react';
import { gsap, isTouch, prefersReducedMotion } from '@/lib/gsap';

/**
 * A small blend-mode dot that trails the pointer. Elements with `data-cursor="View"` grow it into a labelled disc.
 * Desktop pointers only.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (isTouch() || prefersReducedMotion()) return;
    const d = dot.current!;
    const r = ring.current!;
    const xD = gsap.quickTo(d, 'x', { duration: 0.15, ease: 'power3' });
    const yD = gsap.quickTo(d, 'y', { duration: 0.15, ease: 'power3' });
    const xR = gsap.quickTo(r, 'x', { duration: 0.6, ease: 'power3' });
    const yR = gsap.quickTo(r, 'y', { duration: 0.6, ease: 'power3' });
    let active: string | null = null;

    const move = (e: PointerEvent) => {
      xD(e.clientX); yD(e.clientY); xR(e.clientX); yR(e.clientY);
      const el = e.target instanceof Element ? e.target : null;
      const target = el?.closest<HTMLElement>('[data-cursor]');
      const next = target?.dataset.cursor ?? null;
      if (next !== active) {
        active = next;
        if (next) {
          label.current!.textContent = next;
          gsap.to(r, { scale: 1, duration: 0.5, ease: 'expo' });
          gsap.to(d, { scale: 0, duration: 0.3 });
        } else {
          gsap.to(r, { scale: 0, duration: 0.4, ease: 'expo' });
          gsap.to(d, { scale: 1, duration: 0.3 });
        }
      }
      const link = el?.closest('a,button,[role="button"],input,textarea');
      if (!next) gsap.to(d, { scale: link ? 3.2 : 1, duration: 0.35, ease: 'expo' });
    };
    const leave = () => gsap.to([d, r], { opacity: 0, duration: 0.3 });
    const enter = () => gsap.to(d, { opacity: 1, duration: 0.3 });
    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerleave', leave);
    document.addEventListener('pointerenter', enter);
    gsap.set(r, { opacity: 1 });
    return () => {
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerleave', leave);
      document.removeEventListener('pointerenter', enter);
    };
  }, []);

  return (
    <>
      <div ref={dot} className="cursor" aria-hidden>
        <div className="cursor__dot" />
      </div>
      <div ref={ring} className="cursor__ring" aria-hidden>
        <span ref={label} />
      </div>
    </>
  );
}
