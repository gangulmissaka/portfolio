'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { getLenis } from '@/components/motion/SmoothScroll';
import { NAV, SITE } from '@/content/site';
import { LocalTime } from './LocalTime';
import { MobileNavLink, NavLink } from './NavLink';

export const openPalette = () => window.dispatchEvent(new CustomEvent('palette:open'));

const MOBILE_NAV = [{ href: '/', label: 'Home' }, ...NAV];

/**
 * `labs` holds the private Labs link as server islands (one per menu), rendered only for accounts with access.
 * It is a slot rather than a prop flag so the header never ships the link to people who can't use it.
 */
export function Header({ account, labs }: { account: ReactNode; labs?: { desktop: ReactNode; mobile: ReactNode } }) {
  const pathname = usePathname();
  const bar = useRef<HTMLElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  // close the menu when the route changes (state adjusted during render, no effect needed)
  const [path, setPath] = useState(pathname);
  if (path !== pathname) {
    setPath(pathname);
    setOpen(false);
  }

  // hide on scroll down, reveal on scroll up
  useGSAP(() => {
    const st = ScrollTrigger.create({
      start: 120,
      end: 'max',
      onUpdate: (self) => {
        if (document.documentElement.dataset.menu === 'open') return;
        gsap.to(bar.current, { yPercent: self.direction === 1 ? -110 : 0, duration: 0.6, ease: 'expo', overwrite: true });
      },
      onLeaveBack: () => gsap.to(bar.current, { yPercent: 0, duration: 0.6, ease: 'expo', overwrite: true }),
    });
    return () => st.kill();
  });

  // full-screen menu (mobile & tablet)
  useEffect(() => {
    const el = menu.current;
    if (!el) return;
    document.documentElement.dataset.menu = open ? 'open' : 'closed';
    if (open) {
      getLenis()?.stop();
      gsap.set(el, { display: 'flex' });
      gsap.fromTo(el, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'quart' });
      gsap.fromTo(el.querySelectorAll('[data-mi]'), { yPercent: 110 }, { yPercent: 0, stagger: 0.06, duration: 1, delay: 0.25 });
    } else {
      getLenis()?.start();
      gsap.to(el, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.7, ease: 'quart', onComplete: () => { gsap.set(el, { display: 'none' }); } });
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <header
        ref={bar}
        className="no-print fixed inset-x-0 top-0 z-[80] container-x"
        style={{ viewTransitionName: 'site-header' }}
      >
        <div className="flex h-[var(--header-h)] items-center justify-between gap-6">
          <Link href="/" transitionTypes={['nav-back']} className="group flex items-center gap-3 mix-blend-difference" aria-label={`${SITE.name}, home`}>
            <span className="grid size-9 place-items-center rounded-full bg-bone text-[0.8rem] font-semibold tracking-tight text-ink transition-transform duration-500 group-hover:rotate-[360deg]">
              {SITE.initials}
            </span>
            <span className="hidden whitespace-nowrap text-sm font-medium sm:block">
              {SITE.name}
              <span className="hidden text-mute lg:inline"> · {SITE.role}</span>
            </span>
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-1 rounded-full border border-line bg-ink/55 p-1 backdrop-blur-xl md:flex">
            {NAV.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} />
            ))}
            {labs?.desktop}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={openPalette}
              className="hidden h-10 items-center gap-2 rounded-full border border-line bg-ink/55 px-3.5 text-xs text-bone-2 backdrop-blur-xl transition-colors hover:text-bone lg:flex"
              aria-label="Open command menu"
            >
              <kbd className="font-mono">⌘K</kbd>
              <span>Quick menu</span>
            </button>
            {account}
            <button
              onClick={() => setOpen((v) => !v)}
              className="grid size-10 place-items-center rounded-full border border-line bg-ink/55 backdrop-blur-xl md:hidden"
              aria-expanded={open}
              aria-controls="site-menu"
              aria-label={open ? 'Close menu' : 'Open menu'}
            >
              <span className="relative block h-3 w-4">
                <span className={`absolute left-0 top-0 h-px w-4 bg-bone transition-transform duration-500 ${open ? 'translate-y-[5.5px] rotate-45' : ''}`} />
                <span className={`absolute bottom-0 left-0 h-px w-4 bg-bone transition-transform duration-500 ${open ? '-translate-y-[5.5px] -rotate-45' : ''}`} />
              </span>
            </button>
          </div>
        </div>
      </header>

      <div
        id="site-menu"
        ref={menu}
        className="no-print fixed inset-0 z-[70] hidden flex-col justify-between bg-ink-2 container-x pb-8 pt-28"
        style={{ clipPath: 'inset(0% 0% 100% 0%)' }}
      >
        <nav aria-label="Mobile" className="flex flex-col">
          {MOBILE_NAV.map((item, i) => (
            <MobileNavLink key={item.href} href={item.href} label={item.label} index={i} />
          ))}
          {labs?.mobile}
        </nav>
        <div className="flex items-end justify-between text-sm text-bone-2">
          <div className="flex flex-col gap-1">
            {SITE.socials.map((s) => (
              <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="link-u w-fit">
                {s.label}
              </a>
            ))}
          </div>
          <LocalTime />
        </div>
      </div>
    </>
  );
}
