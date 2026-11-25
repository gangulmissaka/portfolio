'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RollText } from '@/components/motion/RollText';

/** One pill in the header's centre nav (desktop). Shared by the public items and the private Labs link. */
export function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + '/');
  return (
    <Link
      href={href}
      transitionTypes={['nav-forward']}
      className={`relative rounded-full px-4 py-2 text-sm transition-colors duration-300 ${active ? 'bg-bone text-ink' : 'text-bone-2 hover:text-bone'}`}
      aria-current={active ? 'page' : undefined}
    >
      <RollText>{label}</RollText>
    </Link>
  );
}

/** One row of the full-screen mobile menu. `data-mi` lets the menu's open animation find it. */
export function MobileNavLink({ href, label, index }: { href: string; label: string; index: number }) {
  return (
    <Link href={href} className="overflow-clip border-b border-line py-3">
      <span data-mi className="flex items-baseline justify-between">
        <span className="display text-[clamp(2.8rem,13vw,5rem)]">{label}</span>
        <span className="font-mono text-xs text-mute">{String(index + 1).padStart(2, '0')}</span>
      </span>
    </Link>
  );
}
