'use client';

import { useOptimistic, useTransition, useState } from 'react';
import { toggleReaction } from '@/lib/actions/reactions';

type Kind = { id: string; emoji: string; label: string };

export function ReactionButtons({ slug, kinds, counts, mine, signedIn }: { slug: string; kinds: Kind[]; counts: Record<string, number>; mine: string[]; signedIn: boolean }) {
  const [pending, start] = useTransition();
  const [note, setNote] = useState<string | null>(null);
  const [state, apply] = useOptimistic({ counts, mine }, (s, kind: string) => {
    const has = s.mine.includes(kind);
    return {
      counts: { ...s.counts, [kind]: (s.counts[kind] ?? 0) + (has ? -1 : 1) },
      mine: has ? s.mine.filter((k) => k !== kind) : [...s.mine, kind],
    };
  });

  return (
    <div className="flex flex-col items-start gap-2 md:items-end">
      <div className="flex gap-2" aria-busy={pending}>
        {kinds.map((k) => {
          const on = state.mine.includes(k.id);
          return (
            <button
              key={k.id}
              type="button"
              title={k.label}
              aria-pressed={on}
              aria-label={`${k.label}: ${state.counts[k.id] ?? 0}`}
              onClick={() => {
                if (!signedIn) {
                  setNote('Sign in (top right) to react.');
                  return;
                }
                start(async () => {
                  apply(k.id);
                  const res = await toggleReaction(slug, k.id);
                  if (!res.ok && res.message) setNote(res.message);
                });
              }}
              className={`flex h-11 items-center gap-2 rounded-full border px-4 text-sm transition-all duration-300 hover:-translate-y-0.5 ${on ? 'border-ember bg-ember/15 text-bone' : 'border-line-2 text-bone-2'}`}
            >
              <span aria-hidden>{k.emoji}</span>
              <span className="tabular-nums">{state.counts[k.id] ?? 0}</span>
            </button>
          );
        })}
      </div>
      {note && <p className="text-xs text-mute" role="status">{note}</p>}
    </div>
  );
}
