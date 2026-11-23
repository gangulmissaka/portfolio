'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from '@/lib/gsap';
import { getLenis } from '@/components/motion/SmoothScroll';
import { PROJECTS, SITE } from '@/content/site';

type Item = { id: string; label: string; hint: string; group: string; run: () => void };

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const panel = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  const items = useMemo<Item[]>(() => {
    const go = (href: string) => () => router.push(href);
    return [
      { id: 'home', label: 'Home', hint: '/', group: 'Navigate', run: go('/') },
      { id: 'work', label: 'All work', hint: '/work', group: 'Navigate', run: go('/work') },
      { id: 'about', label: 'About me', hint: '/about', group: 'Navigate', run: go('/about') },
      { id: 'guestbook', label: 'Sign the guestbook', hint: '/guestbook', group: 'Navigate', run: go('/guestbook') },
      { id: 'contact', label: 'Contact', hint: '/contact', group: 'Navigate', run: go('/contact') },
      { id: 'account', label: 'Sign in / My account', hint: '/account', group: 'Navigate', run: go('/account') },
      ...PROJECTS.map((p) => ({ id: p.slug, label: p.title, hint: p.category, group: 'Projects', run: go(`/work/${p.slug}`) })),
      { id: 'cv', label: 'View / print CV', hint: '/cv', group: 'Actions', run: go('/cv') },
      { id: 'valley', label: 'Explore the 3D portfolio', hint: '3D', group: 'Actions', run: () => { window.location.href = SITE.valleyUrl; } },
      { id: 'email', label: 'Copy email address', hint: SITE.email, group: 'Actions', run: () => navigator.clipboard?.writeText(SITE.email) },
      ...SITE.socials.map((s) => ({ id: s.label, label: `Open ${s.label}`, hint: '↗', group: 'Elsewhere', run: () => window.open(s.url, '_blank', 'noopener') })),
    ];
  }, [router]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? items.filter((i) => (i.label + ' ' + i.hint + ' ' + i.group).toLowerCase().includes(t)) : items;
  }, [items, q]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => {
          if (!v) { setQ(''); setSel(0); }
          return !v;
        });
      }
    };
    const onOpen = () => { setQ(''); setSel(0); setOpen(true); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('palette:open', onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('palette:open', onOpen);
    };
  }, []);

  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    if (open) {
      lastFocus.current = document.activeElement as HTMLElement;
      getLenis()?.stop();
      gsap.set(el, { display: 'grid' });
      gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.3 });
      gsap.fromTo(el.firstElementChild, { y: 24, scale: 0.97 }, { y: 0, scale: 1, duration: 0.6 });
      requestAnimationFrame(() => input.current?.focus());
    } else {
      getLenis()?.start();
      gsap.to(el, { opacity: 0, duration: 0.2, onComplete: () => { gsap.set(el, { display: 'none' }); } });
      lastFocus.current?.focus?.();
    }
  }, [open]);

  const run = (item?: Item) => {
    if (!item) return;
    setOpen(false);
    item.run();
  };

  let lastGroup = '';
  return (
    <div
      ref={panel}
      className="no-print fixed inset-0 z-[96] hidden place-items-start justify-center bg-ink/70 px-4 pt-[14vh] backdrop-blur-md"
      style={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Command menu"
    >
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-line-2 bg-ink-2 shadow-2xl shadow-black/60">
        <div className="flex items-center gap-3 border-b border-line px-5">
          <span className="text-mute" aria-hidden>⌕</span>
          <input
            ref={input}
            value={q}
            onChange={(e) => { setQ(e.target.value); setSel(0); }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, filtered.length - 1)); }
              if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
              if (e.key === 'Enter') run(filtered[sel]);
              if (e.key === 'Escape') setOpen(false);
            }}
            placeholder="Search pages, projects, actions…"
            className="h-14 w-full bg-transparent text-base text-bone placeholder:text-mute-2 focus:outline-none"
            aria-activedescendant={filtered[sel] ? `cmd-${filtered[sel].id}` : undefined}
            aria-controls="cmd-list"
          />
          <kbd className="rounded border border-line px-1.5 py-0.5 font-mono text-[0.65rem] text-mute">ESC</kbd>
        </div>
        <ul id="cmd-list" role="listbox" className="max-h-[50vh] overflow-y-auto p-2" data-lenis-prevent>
          {filtered.length === 0 && <li className="px-3 py-8 text-center text-sm text-mute">Nothing found.</li>}
          {filtered.map((item, i) => {
            const header = item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            return (
              <li key={item.id} role="presentation">
                {header && <p className="eyebrow px-3 pb-1 pt-3">{header}</p>}
                <button
                  id={`cmd-${item.id}`}
                  role="option"
                  aria-selected={i === sel}
                  onMouseEnter={() => setSel(i)}
                  onClick={() => run(item)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${i === sel ? 'bg-ink-3 text-bone' : 'text-bone-2'}`}
                >
                  <span>{item.label}</span>
                  <span className="truncate pl-4 font-mono text-xs text-mute">{item.hint}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
