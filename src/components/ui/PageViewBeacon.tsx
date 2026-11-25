'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/** Cookie-less page counter: one beacon per page view, aggregated per day on the server. */
export function PageViewBeacon() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin') || pathname.startsWith('/labs')) return; // private areas aren't counted
    const body = JSON.stringify({ path: pathname });
    if (!navigator.sendBeacon?.('/api/view', new Blob([body], { type: 'application/json' }))) {
      fetch('/api/view', { method: 'POST', body, keepalive: true, headers: { 'content-type': 'application/json' } }).catch(() => {});
    }
  }, [pathname]);
  return null;
}
