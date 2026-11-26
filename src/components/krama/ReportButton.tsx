'use client';

import { useState } from 'react';
import type { BoardData } from '@/lib/krama/model';
import { Icon } from './ui';

/** "PDF" in the board toolbar: downloads the progress report (lib/krama/report.ts, loaded on first click). */
export function ReportButton({ data }: { data: BoardData }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const run = async () => {
    if (busy) return;
    setBusy(true);
    setError(false);
    try {
      const { downloadReport } = await import('@/lib/krama/report');
      await downloadReport(data);
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <button
      type="button"
      onClick={run}
      disabled={busy}
      title={error ? 'The report could not be made. Try again.' : 'Download a PDF of this project’s progress: team, roles, finished cards and what is left'}
      aria-label={busy ? 'Making the progress report' : 'Download progress report (PDF)'}
      className={`flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm backdrop-blur transition-colors disabled:opacity-60 ${error ? 'border-red-400/70 text-red-300' : 'border-line-2 bg-ink/50 text-bone-2 hover:border-bone hover:text-bone'}`}
    >
      <Icon name={busy ? 'clock' : 'download'} className={`size-4 ${busy ? 'animate-spin' : ''}`} />
      <span className="hidden sm:inline">{busy ? 'Making PDF' : error ? 'Try again' : 'PDF'}</span>
    </button>
  );
}
