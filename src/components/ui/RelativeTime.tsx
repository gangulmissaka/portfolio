'use client';

import { useSyncExternalStore } from 'react';

const noop = () => () => {};
const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60],
];

function format(iso: string) {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  for (const [unit, sec] of UNITS) if (Math.abs(diff) >= sec) return rtf.format(Math.round(diff / sec), unit);
  return 'just now';
}

/** "3 days ago", computed in the browser so cached HTML never shows a stale relative time. */
export function RelativeTime({ iso, prefix = '' }: { iso: string; prefix?: string }) {
  const text = useSyncExternalStore(
    noop,
    () => format(iso),
    () => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }),
  );
  return <span suppressHydrationWarning>{prefix}{text}</span>;
}
