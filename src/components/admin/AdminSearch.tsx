'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';

/** Search box that updates `?q=` in the URL (debounced), keeping the other filters. */
export function AdminSearch({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get('q') ?? '');
  const [pending, start] = useTransition();
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const apply = (v: string) => {
    const next = new URLSearchParams(params.toString());
    if (v.trim()) next.set('q', v.trim());
    else next.delete('q');
    start(() => router.replace(`${pathname}${next.size ? `?${next}` : ''}`, { scroll: false }));
  };

  return (
    <label className="relative block w-full sm:w-80">
      <span className="sr-only">{placeholder}</span>
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mute" aria-hidden>⌕</span>
      <input
        type="search"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          if (timer) clearTimeout(timer);
          setTimer(setTimeout(() => apply(e.target.value), 300));
        }}
        placeholder={placeholder}
        className={`h-10 w-full rounded-full border border-line-2 bg-transparent pl-10 pr-4 text-sm text-bone placeholder:text-mute-2 focus:border-ember focus:outline-none ${pending ? 'opacity-60' : ''}`}
      />
    </label>
  );
}
