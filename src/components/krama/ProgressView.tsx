'use client';

import { useId, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Avatar } from '@/components/auth/AccountMenu';
import type { BoardData } from '@/lib/krama/model';
import { CHEERS, GLOOMS, HINTS, RUNNER_UP, SCORING, pickLine, pointsRace, scoreBoard, team, type PersonScore } from '@/lib/krama/score';
import { formatShort } from '@/lib/krama/time';
import { RoleBadge } from './team';
import { Icon } from './ui';

/** Categorical series colours (dark steps of the validated reference palette). Colour follows the person, never the rank. */
const SERIES = ['#338ced', '#e76624', '#00a888', '#d28e05', '#e24d8b', '#0aac23', '#9887ef'];
const FOLD = '#8a8178';
const MEDAL = ['#f2c94c', '#c9ced6', '#d08a4f'];

const fmtMargin = (h: number | null) => {
  if (h === null) return '–';
  const abs = Math.abs(h);
  const v = abs >= 24 ? `${(abs / 24).toFixed(1)} d` : abs >= 1 ? `${abs.toFixed(1)} h` : `${Math.round(abs * 60)} min`;
  return h >= 0 ? `${v} early` : `${v} late`;
};

/**
 * Progress: who finishes their cards fastest. Points race chart + a live scoreboard. Scores update by themselves
 * (overdue penalties tick every minute; teammates' changes arrive with the board's background refresh).
 */
/** The current minute, in the browser only (null while server-rendering), so scores never differ between the two. */
const subscribeMinute = (cb: () => void) => {
  const id = setInterval(cb, 30_000);
  return () => clearInterval(id);
};
const useNowMinute = () => useSyncExternalStore(subscribeMinute, () => Math.floor(Date.now() / 60_000) * 60_000, () => null);

export function ProgressView({ data }: { data: BoardData }) {
  const now = useNowMinute();
  if (now === null) {
    return (
      <div className="min-h-0 flex-1 px-[var(--gutter)]" aria-busy>
        <div className="mx-auto h-64 max-w-6xl animate-pulse rounded-[1.6rem] bg-ink-2/70" />
      </div>
    );
  }
  return <Progress data={data} now={now} />;
}

function Progress({ data, now }: { data: BoardData; now: number }) {
  const { scores, events } = useMemo(() => scoreBoard(data, now), [data, now]);
  const colorOf = useMemo(() => {
    const order = team(data).map((p) => p.id);
    return (id: string) => {
      const i = order.indexOf(id);
      return i >= 0 && i < SERIES.length ? SERIES[i] : FOLD;
    };
  }, [data]);
  const active = Object.values(data.cards).filter((c) => !c.archived);
  const done = active.filter((c) => c.dueDone).length;
  const inRevision = active.filter((c) => c.revision).length;
  const anyScore = scores.some((s) => s.points !== 0 || s.done > 0 || s.revisions > 0);
  const top = anyScore ? scores.filter((s) => s.points > 0 || s.done > 0).slice(0, 3) : [];
  const lowest = scores.length >= 2 && anyScore && scores[scores.length - 1].points < scores[0].points ? scores[scores.length - 1] : null;
  const maxAbs = Math.max(1, ...scores.map((s) => Math.abs(s.points)));

  return (
    <div data-lenis-prevent className="k-scroll min-h-0 flex-1 overflow-y-auto px-[var(--gutter)] pb-12">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* headline numbers */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Tile icon="check" label="Cards done" value={`${done} / ${active.length}`} />
          <Tile icon="users" label="On the scoreboard" value={scores.length} />
          <Tile icon="sun" label="Leader" value={anyScore ? scores[0].name.split(' ')[0] : '–'} />
          <Tile icon="restore" label="In revision" value={inRevision} tone={inRevision ? '#ff9f9f' : undefined} />
        </div>

        {/* podium */}
        <section className="relative overflow-hidden rounded-[1.6rem] border border-line bg-ink/70 p-5 backdrop-blur-xl md:p-8" aria-labelledby="k-podium">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="k-podium" className="text-xl font-medium tracking-tight">Leaderboard</h2>
              <p className="mt-1 text-sm text-mute">Finish early to climb. Late finishes, overdue cards and revisions cost points.</p>
            </div>
            <ScoringHelp />
          </div>
          {top.length ? (
            <ol className="mt-8 flex flex-wrap items-end justify-center gap-x-6 gap-y-10" aria-label="Top three">
              {[1, 0, 2].map((i) => top[i] && <Podium key={top[i].id} rank={i} p={top[i]} color={colorOf(top[i].id)} />)}
            </ol>
          ) : (
            <p className="mt-8 rounded-2xl border border-dashed border-line-2 p-8 text-center text-sm text-mute">No points yet. Tick cards before their due dates to get on the board.</p>
          )}
        </section>

        {/* full scoreboard */}
        {/* raised so the hint tooltip can overlap the chart panel below (each blurred panel is its own layer) */}
        <section className="relative z-10 rounded-[1.6rem] border border-line bg-ink/70 p-5 backdrop-blur-xl md:p-6" aria-labelledby="k-scores">
          <h2 id="k-scores" className="text-lg font-medium">Scoreboard</h2>
          <ol className="mt-4 space-y-2">
            {scores.map((s, i) => (
              <ScoreRow key={s.id} p={s} rank={i} color={colorOf(s.id)} maxAbs={maxAbs} gloomy={lowest?.id === s.id} me={s.id === data.me.id} />
            ))}
          </ol>
          {scores.length <= 1 && <p className="mt-4 text-sm text-mute">Add teammates in Members &amp; Roles to start a competition. People appear here once they have signed in.</p>}
        </section>

        {/* points race */}
        <PointsRace events={events} scores={scores} colorOf={colorOf} />
      </div>
    </div>
  );
}

function Tile({ icon, label, value, tone }: { icon: Parameters<typeof Icon>[0]['name']; label: string; value: string | number; tone?: string }) {
  return (
    <div className="rounded-[1.2rem] border border-line bg-ink/70 p-4 backdrop-blur-xl">
      <p className="flex items-center gap-2 text-xs text-mute"><Icon name={icon} className="size-3.5" /> {label}</p>
      <p className="mt-2 truncate text-3xl font-medium tabular-nums tracking-tight" style={tone ? { color: tone } : undefined}>{value}</p>
    </div>
  );
}

function ScoringHelp() {
  return (
    <details className="group relative">
      <summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-full border border-line-2 px-3.5 text-sm text-bone-2 hover:border-bone hover:text-bone [&::-webkit-details-marker]:hidden">
        <Icon name="flag" className="size-3.5" /> How scoring works
      </summary>
      <div className="k-pop absolute right-0 top-11 z-20 w-80 rounded-2xl border border-line-2 bg-ink-2/95 p-4 text-sm shadow-2xl shadow-black/60 backdrop-blur-xl">
        <p className="text-xs text-mute">Points go to whoever ticks a card done. Deadlines are Sri Lanka time; a date without a time means 23:59.</p>
        <dl className="mt-3 space-y-1.5">
          {[
            ['3 or more days early', `+${SCORING.early3d}`],
            ['1 day or more early', `+${SCORING.early1d}`],
            ['3 hours or more early', `+${SCORING.early3h}`],
            ['On time', `+${SCORING.onTime}`],
            ['No due date', `+${SCORING.noDate}`],
            ['Late (each 10 minutes)', `-${SCORING.lateEvery10Min}, max -${SCORING.lateCap}`],
            ['Overdue and still open (your role)', `-${SCORING.lateEvery10Min} per 10 min, max -${SCORING.lateCap}`],
            ['Sent back for revision', `-${SCORING.revision}`],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3">
              <dt className="text-bone-2">{k}</dt>
              <dd className={`shrink-0 font-mono tabular-nums ${v.startsWith('+') ? 'text-[#7fd9a0]' : 'text-[#ff9f9f]'}`}>{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </details>
  );
}

function Podium({ rank, p, color }: { rank: number; p: PersonScore; color: string }) {
  const first = rank === 0;
  const quote = first ? pickLine(CHEERS, p.id) : pickLine(RUNNER_UP, p.id);
  return (
    <li className="relative flex w-full flex-col items-center text-center sm:w-64">
      {first && <Confetti />}
      <div className={`relative ${first ? 'k-champion' : ''} rounded-full`} style={{ ['--medal' as string]: MEDAL[rank] }}>
        {first && (
          <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[#f2c94c]" aria-hidden>
            <svg viewBox="0 0 24 24" className="size-7 drop-shadow-[0_0_8px_rgb(242_201_76/0.8)]" fill="currentColor"><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z" /></svg>
          </span>
        )}
        <span className="block rounded-full p-1" style={{ background: `conic-gradient(from 0deg, ${MEDAL[rank]}, ${color}, ${MEDAL[rank]})` }}>
          <span className="block rounded-full bg-ink-2 p-0.5"><Avatar user={{ name: p.name, image: p.image }} size={first ? 84 : 64} /></span>
        </span>
      </div>
      <p className={`mt-3 font-medium ${first ? 'text-xl' : 'text-base'}`}>{p.name}</p>
      <p className="mt-0.5 font-mono text-sm tabular-nums" style={{ color: MEDAL[rank] }}>
        {rank === 0 ? '1st' : rank === 1 ? '2nd' : '3rd'} · {p.points} pts
      </p>
      <p className={`mt-2 max-w-[26ch] text-sm leading-snug ${first ? 'text-bone' : 'text-mute'}`}>“{quote}”</p>
      <div
        className="mt-4 w-full rounded-t-2xl border border-b-0 border-line"
        style={{ height: first ? 72 : rank === 1 ? 48 : 32, background: `linear-gradient(to bottom, ${MEDAL[rank]}33, transparent)` }}
        aria-hidden
      />
    </li>
  );
}

/** A one-off burst of confetti around the leader (skipped with reduced motion). */
function Confetti() {
  const colors = ['#f2c94c', '#f08a3c', '#4fbf7a', '#5fd0e6', '#e24d8b', '#a98bf0'];
  return (
    <div className="k-confetti pointer-events-none absolute left-1/2 top-10 z-10" aria-hidden>
      {Array.from({ length: 28 }, (_, i) => {
        const angle = (i / 28) * Math.PI * 2;
        const dist = 70 + ((i * 37) % 60);
        return (
          <span
            key={i}
            style={{
              ['--x' as string]: `${Math.cos(angle) * dist}px`,
              ['--y' as string]: `${Math.sin(angle) * dist - 30}px`,
              ['--r' as string]: `${(i * 47) % 360}deg`,
              background: colors[i % colors.length],
              animationDelay: `${(i % 5) * 40}ms`,
            }}
          />
        );
      })}
    </div>
  );
}

function ScoreRow({ p, rank, color, maxAbs, gloomy, me }: { p: PersonScore; rank: number; color: string; maxAbs: number; gloomy: boolean; me: boolean }) {
  const tipId = useId();
  const width = `${(Math.abs(p.points) / maxAbs) * 50}%`;
  return (
    <li className={`grid items-center gap-x-4 gap-y-2 rounded-2xl border p-3 md:grid-cols-[2.5rem_minmax(0,15rem)_minmax(0,1fr)_minmax(8rem,14rem)_4.5rem] ${gloomy ? 'border-[#5b6cf0]/25 bg-[#5b6cf0]/[0.05]' : rank === 0 && p.points > 0 ? 'border-[#f2c94c]/30 bg-[#f2c94c]/[0.04]' : 'border-line bg-ink-2/50'}`}>
      <span className="font-mono text-sm tabular-nums" style={{ color: rank < 3 ? MEDAL[rank] : undefined }}>#{rank + 1}</span>
      <div className="flex min-w-0 items-center gap-3">
        <span className="relative shrink-0">
          <Avatar user={{ name: p.name, image: p.image }} size={36} />
          <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full ring-2 ring-ink-2" style={{ background: color }} aria-hidden />
        </span>
        <div className="group relative min-w-0">
          <button type="button" aria-describedby={gloomy ? tipId : undefined} className={`flex max-w-full items-center gap-1.5 truncate text-left font-medium ${gloomy ? 'cursor-help text-bone-2' : ''}`}>
            <span className="truncate">{p.name}</span>
            {me && <span className="text-xs font-normal text-mute">(you)</span>}
            {gloomy && (
              <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-[#8f9bff]" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden>
                <path d="M7 15a4 4 0 0 1 .5-8 5 5 0 0 1 9.5 1.5A3.5 3.5 0 0 1 16.5 15z" /><path d="M9 18l-1 2M13 18l-1 2M17 18l-1 2" />
              </svg>
            )}
          </button>
          {gloomy && (
            <div id={tipId} role="tooltip" className="invisible absolute left-0 top-full z-30 mt-2 w-72 rounded-2xl border border-[#5b6cf0]/40 bg-ink-2/95 p-3.5 text-sm opacity-0 shadow-2xl shadow-black/60 backdrop-blur-xl transition-opacity duration-200 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
              <p className="italic text-[#b9c1ff]">“{pickLine(GLOOMS, p.id)}”</p>
              <p className="mt-2 flex gap-2 text-bone-2"><Icon name="sun" className="mt-0.5 size-4 shrink-0 text-[#f2c94c]" /> {pickLine(HINTS, p.id)}</p>
            </div>
          )}
          <div className="mt-0.5 flex flex-wrap gap-1">
            {p.isOwner && <span className="rounded bg-ember/15 px-1.5 text-[0.62rem] text-ember">Creator</span>}
            {p.roles.map((r) => <RoleBadge key={r.id} role={r} />)}
          </div>
        </div>
      </div>
      <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-mute">
        <div><dt className="sr-only">Done</dt><dd><span className="text-bone-2">{p.done}</span> done</dd></div>
        <div><dt className="sr-only">Early</dt><dd><span className="text-[#7fd9a0]">{p.early}</span> early</dd></div>
        <div><dt className="sr-only">Late</dt><dd><span className={p.late ? 'text-[#ff9f9f]' : 'text-bone-2'}>{p.late}</span> late</dd></div>
        {p.overdueOpen > 0 && <div><dt className="sr-only">Overdue</dt><dd><span className="text-[#ff9f9f]">{p.overdueOpen}</span> overdue now</dd></div>}
        <div><dt className="sr-only">Revisions</dt><dd><span className={p.revisions ? 'text-[#ff9f9f]' : 'text-bone-2'}>{p.revisions}</span> revisions</dd></div>
        <div><dt className="sr-only">Average finish</dt><dd>avg {fmtMargin(p.avgMarginH)}</dd></div>
      </dl>
      {/* points bar around zero: right for positive, left for negative */}
      <div className="relative h-2.5 rounded-full bg-ink-3" aria-hidden>
        <span className="absolute inset-y-0 left-1/2 w-px bg-bone/30" />
        <span
          className="absolute inset-y-0 rounded-full"
          style={p.points >= 0 ? { left: '50%', width, background: color } : { right: '50%', width, background: '#ef5d5d' }}
        />
      </div>
      <p className={`text-right font-mono text-lg tabular-nums ${p.points < 0 ? 'text-[#ff9f9f]' : ''}`}>{p.points > 0 ? `+${p.points}` : p.points}</p>
    </li>
  );
}

// ─────────────────────────────── points race chart ───────────────────────────────
function PointsRace({ events, scores, colorOf }: { events: ReturnType<typeof scoreBoard>['events']; scores: PersonScore[]; colorOf: (id: string) => string }) {
  const shown = scores.slice(0, 5);
  const { dates, series } = pointsRace(events, shown.map((s) => s.id), 14); // the React Compiler memoises this
  const [hover, setHover] = useState<number | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const titleId = useId();
  const W = 760, H = 260, L = 44, R = 118, T = 14, B = 30;
  const all = series.flatMap((s) => s.values);
  const lo = Math.min(0, ...all);
  const hi = Math.max(10, ...all);
  const step = niceStep((hi - lo) / 4);
  const yMin = Math.floor(lo / step) * step;
  const yMax = Math.ceil(hi / step) * step;
  const ticks = Array.from({ length: Math.round((yMax - yMin) / step) + 1 }, (_, i) => yMin + i * step);
  const x = (i: number) => L + (i / Math.max(1, dates.length - 1)) * (W - L - R);
  const y = (v: number) => T + ((yMax - v) / (yMax - yMin || 1)) * (H - T - B);
  const name = (id: string) => shown.find((s) => s.id === id)?.name ?? '';

  // direct labels at the line ends, nudged apart so they never overlap
  const ends = series.map((s) => ({ id: s.id, y: y(s.values[s.values.length - 1]), v: s.values[s.values.length - 1] })).sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 15) ends[i].y = ends[i - 1].y + 15;

  const pick = (clientX: number) => {
    const r = svg.current?.getBoundingClientRect();
    if (!r) return;
    const px = ((clientX - r.left) / r.width) * W;
    const i = Math.round(((px - L) / (W - L - R)) * (dates.length - 1));
    setHover(Math.max(0, Math.min(dates.length - 1, i)));
  };

  if (!shown.length) return null;
  const tip = hover === null ? null : series.map((s) => ({ id: s.id, v: s.values[hover] })).sort((a, b) => b.v - a.v);

  return (
    <section className="rounded-[1.6rem] border border-line bg-ink/70 p-5 backdrop-blur-xl md:p-6" aria-labelledby={titleId}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id={titleId} className="text-lg font-medium">Points race</h2>
          <p className="mt-1 text-sm text-mute">Running total of points over the last 14 days{scores.length > 5 ? ' (top 5)' : ''}.</p>
        </div>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-bone-2" aria-label="Legend">
          {shown.map((s) => (
            <li key={s.id} className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded-full" style={{ background: colorOf(s.id) }} />{s.name}</li>
          ))}
        </ul>
      </div>
      <div className="relative mt-4">
        <svg
          ref={svg}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full touch-none select-none outline-none"
          role="img"
          aria-label={`Points over the last 14 days. ${shown.map((s) => `${s.name}: ${s.points} points now`).join('. ')}.`}
          tabIndex={0}
          onPointerMove={(e) => pick(e.clientX)}
          onPointerLeave={() => setHover(null)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') setHover((h) => Math.min(dates.length - 1, (h ?? -1) + 1));
            if (e.key === 'ArrowLeft') setHover((h) => Math.max(0, (h ?? dates.length) - 1));
            if (e.key === 'Escape') setHover(null);
          }}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke={t === 0 ? 'rgb(237 230 218 / 0.35)' : 'rgb(237 230 218 / 0.08)'} strokeWidth={1} />
              <text x={L - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-[#a89e90] font-mono text-[11px]">{t}</text>
            </g>
          ))}
          {dates.map((d, i) => (i % 2 === 0 || i === dates.length - 1) && (
            <text key={d} x={x(i)} y={H - 8} textAnchor="middle" className="fill-[#a89e90] text-[11px]">{formatShort(d)}</text>
          ))}
          {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} stroke="rgb(237 230 218 / 0.35)" strokeDasharray="3 3" />}
          {series.map((s) => (
            <g key={s.id}>
              <polyline points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')} fill="none" stroke={colorOf(s.id)} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              <circle cx={x(s.values.length - 1)} cy={y(s.values[s.values.length - 1])} r={4.5} fill={colorOf(s.id)} stroke="#14110e" strokeWidth={2} />
              {hover !== null && <circle cx={x(hover)} cy={y(s.values[hover])} r={4.5} fill={colorOf(s.id)} stroke="#14110e" strokeWidth={2} />}
            </g>
          ))}
          {ends.map((e) => (
            <g key={e.id}>
              <circle cx={W - R + 12} cy={e.y} r={3} fill={colorOf(e.id)} />
              <text x={W - R + 20} y={e.y} dy="0.32em" className="fill-[#ddd5c8] text-[11px]">{name(e.id).split(' ')[0]} · {e.v}</text>
            </g>
          ))}
        </svg>
        {tip && hover !== null && (
          <div
            className="pointer-events-none absolute top-2 z-10 min-w-40 rounded-xl border border-line-2 bg-ink-2/95 p-2.5 text-xs shadow-xl shadow-black/50 backdrop-blur"
            style={{ left: `${(x(hover) / W) * 100}%`, transform: `translateX(${hover > dates.length / 2 ? 'calc(-100% - 12px)' : '12px'})` }}
          >
            <p className="mb-1.5 text-mute">{formatShort(dates[hover])}</p>
            {tip.map((t) => (
              <p key={t.id} className="flex items-center justify-between gap-4 text-bone-2">
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: colorOf(t.id) }} />{name(t.id)}</span>
                <span className="font-mono tabular-nums text-bone">{t.v}</span>
              </p>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function niceStep(raw: number) {
  const p = Math.pow(10, Math.floor(Math.log10(Math.max(raw, 1))));
  const n = raw / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}
