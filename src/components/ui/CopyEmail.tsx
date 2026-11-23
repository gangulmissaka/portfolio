'use client';

import { useState } from 'react';
import { SITE } from '@/content/site';

export function CopyEmail({ className }: { className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(SITE.email);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          window.location.href = `mailto:${SITE.email}`;
        }
      }}
    >
      <span aria-live="polite">{copied ? 'Copied to clipboard ✓' : SITE.email}</span>
    </button>
  );
}
