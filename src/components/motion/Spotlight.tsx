'use client';

import { useRef, type ReactNode } from 'react';

/**
 * Cards inside get a soft ember glow that follows the pointer (CSS vars on the hovered `[data-spot]` child).
 * Pure CSS paint, no re-renders.
 */
export function Spotlight({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      className={className}
      onPointerMove={(e) => {
        const card = (e.target as Element).closest<HTMLElement>('[data-spot]');
        if (!card || !ref.current?.contains(card)) return;
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      }}
    >
      {children}
    </div>
  );
}
