'use client';

import { useEffect, useState } from 'react';
import { SITE } from '@/content/site';

const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: SITE.timeZone, hour12: false });

/** Live clock in Colombo. Renders a stable placeholder on the server to avoid hydration mismatch. */
export function LocalTime({ className }: { className?: string }) {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    const update = () => setNow(fmt.format(new Date()));
    update();
    const id = setInterval(update, 15_000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className={`tabular-nums ${className ?? ''}`} suppressHydrationWarning>
      {now ?? '--:--'} <span className="text-mute">GMT+5:30</span>
    </span>
  );
}
