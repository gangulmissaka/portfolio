'use client';

import { useLayoutEffect } from 'react';
import { getLenis } from '@/components/motion/SmoothScroll';
import { ScrollTrigger } from '@/lib/gsap';

let holders = 0;

/**
 * Full-screen Krama pages: puts `krama-app` on <html> while mounted (locks page scroll, hides the footer, pins the
 * header; rules in globals.css). It must be a mounted effect, not a CSS `:has([data-krama-app])` check: with Cache
 * Components, Next keeps the page you left in the DOM (hidden in an Activity), so a `:has` rule kept the whole site
 * unscrollable after leaving a board. A hidden Activity runs effect cleanups, so this lock lifts on navigation.
 */
export function AppLock() {
  useLayoutEffect(() => {
    const html = document.documentElement;
    holders += 1;
    html.classList.add('krama-app');
    return () => {
      holders -= 1;
      if (holders > 0) return;
      html.classList.remove('krama-app');
      getLenis()?.resize();
      requestAnimationFrame(() => ScrollTrigger.refresh());
    };
  }, []);
  return null;
}
