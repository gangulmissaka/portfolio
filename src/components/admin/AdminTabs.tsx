'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/admin', label: 'Overview', key: null },
  { href: '/admin/users', label: 'Users', key: 'users' },
  { href: '/admin/guestbook', label: 'Guestbook', key: 'guestbook' },
  { href: '/admin/messages', label: 'Messages', key: 'messages' },
  { href: '/admin/labs', label: 'Labs', key: 'labs' },
] as const;

export function AdminTabs({ counts }: { counts: { users: number; guestbook: number; messages: number; labs: number } }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin sections" className="mt-10 flex gap-1 overflow-x-auto border-b border-line [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {TABS.map((t) => {
        const active = t.href === '/admin' ? pathname === '/admin' : pathname.startsWith(t.href);
        const n = t.key ? counts[t.key] : 0;
        const total = t.key === 'users' || t.key === 'labs';
        const badge = total ? n : n > 0 ? n : null; // users/labs: total; others: only when something needs attention
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? 'page' : undefined}
            className={`relative flex items-center gap-2 whitespace-nowrap px-4 pb-4 pt-2 text-sm transition-colors ${active ? 'text-bone' : 'text-mute hover:text-bone'}`}
          >
            {t.label}
            {badge !== null && (
              <span className={`rounded-full px-2 py-0.5 text-[0.68rem] tabular-nums ${total ? 'bg-ink-3 text-bone-2' : 'bg-ember text-ink'}`}>{badge}</span>
            )}
            <span className={`absolute inset-x-3 -bottom-px h-px transition-transform duration-500 ${active ? 'scale-x-100 bg-ember' : 'scale-x-0 bg-bone'}`} />
          </Link>
        );
      })}
    </nav>
  );
}
