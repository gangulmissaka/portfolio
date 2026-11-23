'use client';

import { useRef, useState } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { getLenis } from './SmoothScroll';

/**
 * A quiet table of contents on the right edge (large screens): one tick per section,
 * the current one grows and shows its name. Click a tick to glide there.
 */
export function SectionGuide({ sections }: { sections: { id: string; label: string }[] }) {
  const [active, setActive] = useState<string | null>(null);
  const root = useRef<HTMLElement>(null);

  useGSAP(() => {
    const triggers = sections.map((s) =>
      ScrollTrigger.create({
        trigger: `#${s.id}`,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (self) => self.isActive && setActive(s.id),
      }),
    );
    // only visible once the hero is behind us
    const show = ScrollTrigger.create({
      trigger: `#${sections[0].id}`,
      start: 'top 80%',
      onEnter: () => gsap.to(root.current, { autoAlpha: 1, x: 0, duration: 0.8, ease: 'expo' }),
      onLeaveBack: () => gsap.to(root.current, { autoAlpha: 0, x: 12, duration: 0.5, ease: 'expo' }),
    });
    return () => {
      triggers.forEach((t) => t.kill());
      show.kill();
    };
  });

  return (
    <nav
      ref={root}
      aria-label="Sections on this page"
      className="group/nav no-print fixed right-2 top-1/2 z-[60] hidden -translate-y-1/2 xl:block"
      style={{ opacity: 0, visibility: 'hidden', transform: 'translate(12px, -50%)' }}
    >
      <ol className="flex flex-col items-end gap-2.5 rounded-2xl border border-line bg-ink/75 px-2.5 py-3 opacity-60 shadow-xl shadow-black/30 backdrop-blur-xl transition-opacity duration-500 group-hover/nav:opacity-100">
        {sections.map((s, i) => {
          const on = active === s.id;
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  const l = getLenis();
                  const el = document.getElementById(s.id);
                  if (l && el) l.scrollTo(el, { offset: -40, duration: 1.4 });
                  else el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="group flex items-center gap-3 py-0.5"
                aria-current={on ? 'true' : undefined}
              >
                <span
                  className={`whitespace-nowrap font-mono text-[0.62rem] uppercase tracking-[0.14em] transition-colors duration-500 ${
                    on ? 'text-bone' : 'text-mute group-hover:text-bone'
                  }`}
                >
                  <span className="text-ember">0{i + 1}</span>
                  <span className={`inline-block overflow-hidden align-bottom transition-all duration-500 max-w-0 opacity-0 group-hover/nav:max-w-40 group-hover/nav:pl-1.5 group-hover/nav:opacity-100`}>{s.label}</span>
                </span>
                <span className={`block h-px transition-all duration-500 ${on ? 'w-6 bg-ember' : 'w-3 bg-mute-2 group-hover:w-5 group-hover:bg-bone'}`} />
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
