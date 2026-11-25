import Image from 'next/image';
import type { CSSProperties, ReactNode } from 'react';
import apparition from '@/assets/work/apparition.jpg';
import comingSoon from '@/assets/work/comingsoon-1.jpg';
import manimdesk from '@/assets/work/manimdesk.png';

const mono = 'font-mono text-[max(9px,1.4cqw)]';

/** A floating app window used by several covers. */
function Window({ title, className = '', children, style }: { title: string; className?: string; children: ReactNode; style?: CSSProperties }) {
  return (
    <div className={`absolute overflow-hidden rounded-[1.2cqw] border border-white/15 shadow-[0_4cqw_8cqw_rgb(0_0_0/0.5)] ${className}`} style={style}>
      <div className="flex items-center gap-[0.8cqw] border-b border-white/10 bg-black/40 px-[1.6cqw] py-[1.1cqw]">
        {['#ff5f57', '#febc2e', '#28c840'].map((c) => <span key={c} className="size-[1.1cqw] rounded-full" style={{ background: c }} />)}
        <span className={`ml-[1cqw] ${mono} text-white/55`}>{title}</span>
      </div>
      {children}
    </div>
  );
}

/**
 * Art-directed covers, built in code so every project shares one visual language.
 * The cover fills its parent; size text with container units (cqw).
 */
export function ProjectCover({ slug, priority = false, sizes = '(min-width: 768px) 60vw, 100vw' }: { slug: string; priority?: boolean; sizes?: string }) {
  const base: CSSProperties = { containerType: 'inline-size' };
  const wrap = 'relative h-full w-full overflow-hidden';

  switch (slug) {
    case 'apparition':
      return (
        <div className={wrap} style={{ ...base, background: '#0a0708' }}>
          <Image src={apparition} alt="APPARITION key art: a haunted house at night and a pale ghost woman" fill priority={priority} sizes={sizes} placeholder="blur" className="object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgb(10 7 8 / 0) 45%, rgb(10 7 8 / 0.85)), radial-gradient(80% 60% at 30% 40%, rgb(194 65 45 / 0.25), transparent)' }} />
          <div className="absolute bottom-[5cqw] left-[5cqw] flex items-center gap-[1.5cqw] font-mono text-[max(10px,1.6cqw)] uppercase tracking-[0.2em] text-bone/80">
            <span className="inline-block size-[max(6px,1cqw)] rounded-full bg-[#ff4d3a] shadow-[0_0_12px_#ff4d3a]" /> Speak to escape
          </div>
        </div>
      );

    case 'nimbo': {
      const photos = [
        ['#f2b880', '#6b8fd6', -14, -26, 8],
        ['#9fd3c7', '#2f5b9e', -6, -12, -4],
        ['#ffd6a5', '#c2553d', 4, 2, 6],
        ['#cde7b0', '#3f7d4e', 13, 14, -8],
        ['#b8c0ff', '#2b2d6e', 22, 26, 3],
      ] as const;
      return (
        <div className={wrap} style={{ ...base, background: 'radial-gradient(120% 90% at 70% 10%, #2a4fd1 0%, #0f1a4a 45%, #070a1c 100%)' }}>
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(rgb(255 255 255 / .06) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / .06) 1px, transparent 1px)', backgroundSize: '5cqw 5cqw' }} />
          <div className="absolute left-1/2 top-[44%]">
            {photos.map(([a, b, rot, x, y], i) => (
              <div
                key={i}
                className="absolute rounded-[0.6cqw] bg-[#f4f1ea] p-[1cqw] pb-[3.4cqw] shadow-[0_2cqw_4cqw_rgb(0_0_0/0.45)]"
                style={{ width: '22cqw', transform: `translate(calc(-50% + ${x}cqw), calc(-50% + ${y}cqw)) rotate(${rot}deg)` }}
              >
                <div className="aspect-[4/3] w-full rounded-[0.3cqw]" style={{ background: `linear-gradient(160deg, ${a}, ${b})` }} />
              </div>
            ))}
          </div>
          <div className="absolute inset-x-[6cqw] bottom-[5cqw] flex gap-[1.5cqw]">
            {['2023', '2024', '2025', '2026'].map((y, i) => (
              <div key={y} className="flex-1 rounded-t-[1cqw] border border-white/15 bg-white/[0.07] px-[1.5cqw] pb-[2cqw] pt-[1cqw] backdrop-blur-sm" style={{ opacity: 0.55 + i * 0.15 }}>
                <span className="font-mono text-[max(9px,1.5cqw)] text-white/80">▸ {y}</span>
              </div>
            ))}
          </div>
          <span className="absolute right-[5cqw] top-[5cqw] rounded-full border border-white/20 px-[1.6cqw] py-[0.6cqw] font-mono text-[max(9px,1.4cqw)] text-white/80">undo ↺ ready</span>
        </div>
      );
    }

    case 'manimdesk':
      return (
        <div className={wrap} style={{ ...base, background: 'radial-gradient(110% 100% at 20% 0%, #ff5fae 0%, #8e1f63 38%, #1a0614 100%)' }}>
          <p className="absolute -left-[2cqw] top-[2cqw] whitespace-nowrap font-serif text-[16cqw] italic leading-none text-white/[0.09]">e^{'{iπ}'} + 1 = 0</p>
          <div className="absolute left-1/2 top-[54%] w-[74cqw] -translate-x-1/2 -translate-y-1/2 rotate-[-4deg] overflow-hidden rounded-[1.2cqw] border border-white/20 bg-[#1e1e24] shadow-[0_4cqw_8cqw_rgb(0_0_0/0.55)]">
            <div className="flex items-center gap-[0.8cqw] border-b border-white/10 px-[1.6cqw] py-[1.1cqw]">
              {['#ff5f57', '#febc2e', '#28c840'].map((c) => <span key={c} className="size-[1.2cqw] rounded-full" style={{ background: c }} />)}
              <span className="ml-[1cqw] font-mono text-[max(8px,1.3cqw)] text-white/50">ManimDesk · HelloManim.py</span>
            </div>
            <Image src={manimdesk} alt="ManimDesk window with a Manim script editor and render log" sizes={sizes} priority={priority} placeholder="blur" className="w-full" />
          </div>
          <span className="absolute bottom-[4cqw] right-[5cqw] rounded-full bg-white/90 px-[1.8cqw] py-[0.7cqw] font-mono text-[max(9px,1.4cqw)] text-[#8e1f63]">● REC 1080p60 · 9:16</span>
        </div>
      );

    case 'this-website':
      return (
        <div className={wrap} style={{ ...base, background: 'radial-gradient(90% 80% at 75% 85%, #f08a3c 0%, #6b2d0d 35%, #0c0a08 75%)' }}>
          <p className="absolute -bottom-[6cqw] -right-[2cqw] font-serif text-[52cqw] italic leading-none text-transparent [-webkit-text-stroke:0.25cqw_rgb(237_230_218/0.35)]">GM</p>
          <div className="absolute left-[6cqw] top-[6cqw] flex flex-col gap-[1.5cqw]">
            <span className="font-mono text-[max(9px,1.5cqw)] uppercase tracking-[0.2em] text-bone/70">Portfolio v3</span>
            <p className="max-w-[46cqw] text-[5.2cqw] font-medium leading-[0.95] tracking-[-0.04em] text-bone">Work first. <span className="font-serif italic text-ember-2">Craft</span> everywhere.</p>
          </div>
          <div className="absolute bottom-[6cqw] left-[6cqw] flex flex-wrap gap-[1cqw]">
            {['Next.js 16', 'GSAP', 'Better Auth', 'Postgres'].map((t) => (
              <span key={t} className="rounded-full border border-bone/25 bg-ink/40 px-[1.6cqw] py-[0.6cqw] text-[max(9px,1.4cqw)] text-bone/85 backdrop-blur">{t}</span>
            ))}
          </div>
        </div>
      );

    case 'network-design': {
      const nodes = [
        [50, 22, 'R1'], [24, 50, 'R2'], [76, 50, 'R3'],
        [12, 80, 'SW'], [36, 80, 'SW'], [64, 80, 'SW'], [88, 80, 'SW'],
      ] as const;
      const links = [[0, 1], [0, 2], [1, 2], [1, 3], [1, 4], [2, 5], [2, 6]];
      return (
        <div className={wrap} style={{ ...base, background: 'radial-gradient(100% 90% at 50% 0%, #1f6b47 0%, #0b2419 45%, #050d09 100%)' }}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
            {links.map(([a, b], i) => (
              <line key={i} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} stroke="#6ee7a8" strokeOpacity="0.45" strokeWidth="0.35" strokeDasharray="1.2 1" vectorEffect="non-scaling-stroke" />
            ))}
          </svg>
          {nodes.map(([x, y, label], i) => (
            <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: `${y}%` }}>
              <div className={`grid place-items-center rounded-full border border-[#6ee7a8]/60 bg-[#0b2419] font-mono text-[#bff5d8] shadow-[0_0_3cqw_rgb(110_231_168/0.35)] ${label === 'SW' ? 'size-[6cqw] text-[max(8px,1.3cqw)]' : 'size-[8cqw] text-[max(9px,1.6cqw)]'}`}>
                {label}
              </div>
            </div>
          ))}
          <div className="absolute left-[5cqw] top-[5cqw] flex gap-[1cqw] font-mono text-[max(9px,1.4cqw)]">
            {['VLAN 10', 'VLAN 20', 'VLAN 30'].map((v) => <span key={v} className="rounded-full border border-[#6ee7a8]/40 px-[1.4cqw] py-[0.5cqw] text-[#bff5d8]">{v}</span>)}
          </div>
          <span className="absolute right-[5cqw] top-[5cqw] font-mono text-[max(9px,1.4cqw)] text-[#6ee7a8]">EIGRP AS 100</span>
        </div>
      );
    }

    case 'roll-a-ball':
      return (
        <div className={wrap} style={{ ...base, background: 'linear-gradient(180deg, #2b1a05 0%, #7a4a0c 55%, #e0a530 100%)' }}>
          <div className="absolute inset-x-[-20%] bottom-[-10%] h-[60%] [transform:perspective(40cqw)_rotateX(62deg)]" style={{ backgroundImage: 'linear-gradient(rgb(255 240 210 / .25) 1px, transparent 1px), linear-gradient(90deg, rgb(255 240 210 / .25) 1px, transparent 1px)', backgroundSize: '6cqw 6cqw' }} />
          <div className="absolute left-1/2 top-[52%] size-[24cqw] -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_4cqw_6cqw_rgb(0_0_0/0.45)]" style={{ background: 'radial-gradient(circle at 32% 28%, #fff6e0 0%, #f3c062 22%, #b86e12 60%, #3a1f03 100%)' }} />
          {[[18, 30, 12], [80, 34, -18], [28, 70, 30], [74, 72, 8]].map(([x, y, r], i) => (
            <div key={i} className="absolute size-[5cqw] rounded-[0.6cqw] border border-white/40 bg-[#ffe7b0]/80 shadow-[0_0_3cqw_rgb(255_231_176/0.6)]" style={{ left: `${x}%`, top: `${y}%`, transform: `rotate(${r}deg) rotateX(30deg)` }} />
          ))}
          <span className="absolute left-[5cqw] top-[5cqw] font-mono text-[max(9px,1.4cqw)] text-[#fff1d6]">SCORE 08 / 12</span>
        </div>
      );

    case 'dads-assistant': {
      const tiles = [['❤️', 'Health', '#ff8a7a'], ['🧾', 'Bills', '#ffd27a'], ['💰', 'Expenses', '#9be3a4'], ['🚗', 'Vehicle', '#8ec5ff'], ['🗂️', 'Documents', '#d7b3ff'], ['🆘', 'Emergency', '#ff6b6b']] as const;
      return (
        <div className={wrap} style={{ ...base, background: 'radial-gradient(100% 100% at 75% 10%, #ff9a5c 0%, #b8461c 40%, #1c0a04 100%)' }}>
          <div className="absolute left-1/2 top-[54%] w-[34cqw] -translate-x-1/2 -translate-y-1/2 rounded-[4cqw] border-[0.8cqw] border-[#111] bg-[#fff8f1] p-[2.4cqw] shadow-[0_4cqw_8cqw_rgb(0_0_0/0.55)]">
            <p className="text-[2.6cqw] font-semibold text-[#3a1a0c]">Good morning, Dad</p>
            <div className="mt-[2cqw] grid grid-cols-2 gap-[1.4cqw]">
              {tiles.map(([e, t, c]) => (
                <div key={t} className="rounded-[1.6cqw] p-[1.6cqw]" style={{ background: c }}>
                  <span className="text-[3.4cqw] leading-none">{e}</span>
                  <p className="mt-[0.8cqw] text-[1.8cqw] font-semibold text-[#2a1208]">{t}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute right-[5cqw] top-[7cqw] w-[30cqw] rounded-[1.6cqw] bg-white/95 p-[1.8cqw] shadow-xl">
            <p className={`${mono} text-[#b8461c]`}>💊 8:00 · Medicine time</p>
            <p className="mt-[0.6cqw] text-[1.8cqw] font-semibold text-[#2a1208]">Morning tablets</p>
            <span className="mt-[1cqw] inline-block rounded-full bg-[#2f9e5b] px-[1.4cqw] py-[0.4cqw] text-[1.5cqw] font-semibold text-white">✓ Taken</span>
          </div>
          <span className={`absolute bottom-[5cqw] left-[5cqw] rounded-full border border-white/30 px-[1.6cqw] py-[0.6cqw] ${mono} text-white/85`}>Works offline · on-device AI</span>
        </div>
      );
    }

    case 'fraud-detection-architecture': {
      const boxes = [
        [8, 42, 16, 'API Gateway'], [30, 22, 18, 'Ingest queue'], [30, 62, 18, 'Access control'],
        [55, 22, 18, 'Risk engine'], [55, 62, 18, 'Case manager'], [79, 22, 15, 'Alerts'], [79, 62, 15, 'Store'],
      ] as const;
      const links = [[0, 1], [0, 2], [1, 3], [3, 5], [3, 4], [4, 6], [3, 6]];
      return (
        <div className={wrap} style={{ ...base, background: 'radial-gradient(110% 100% at 50% 0%, #4b34b8 0%, #1a1147 45%, #07051a 100%)' }}>
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(rgb(255 255 255 / .5) 1px, transparent 1px)', backgroundSize: '3cqw 3cqw' }} />
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
            {links.map(([a, b], i) => (
              <line key={i} x1={boxes[a][0] + boxes[a][2] / 2} y1={boxes[a][1] + 5} x2={boxes[b][0] + boxes[b][2] / 2} y2={boxes[b][1] + 5} stroke="#b9a8ff" strokeOpacity=".6" strokeWidth=".4" vectorEffect="non-scaling-stroke" />
            ))}
          </svg>
          {boxes.map(([x, y, w, label], i) => (
            <div key={label} className={`absolute grid place-items-center rounded-[0.8cqw] border px-[0.8cqw] text-center ${mono} ${i === 3 ? 'border-[#ff6b8b] bg-[#3a1030] text-[#ffc2d0] shadow-[0_0_3cqw_rgb(255_107_139/0.45)]' : 'border-[#b9a8ff]/60 bg-[#140d38] text-[#e3dcff]'}`} style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: '10%' }}>
              {label}
            </div>
          ))}
          <span className={`absolute left-[5cqw] top-[5cqw] rounded-full border border-[#b9a8ff]/40 px-[1.4cqw] py-[0.5cqw] ${mono} text-[#e3dcff]`}>C&amp;C view · ADD iteration 1: performance</span>
          <span className={`absolute bottom-[5cqw] right-[5cqw] ${mono} text-[#ff9fb4]`}>● added this iteration</span>
        </div>
      );
    }

    case 'mcp-control': {
      const cards = [['Microsoft Project', true, 'read-only'], ['draw.io UML', true, '19 tools'], ['LK calendar', false, 'Poya days']] as const;
      return (
        <div className={wrap} style={{ ...base, background: 'radial-gradient(110% 100% at 20% 0%, #f2c14e 0%, #7a5a08 40%, #120d02 100%)' }}>
          <Window title="MCP Control" className="left-1/2 top-[55%] w-[70cqw] -translate-x-1/2 -translate-y-1/2 bg-[#17140d]">
            <div className="grid gap-[1.4cqw] p-[2.2cqw]">
              {cards.map(([name, on, note]) => (
                <div key={name} className="flex items-center justify-between rounded-[1cqw] border border-white/10 bg-white/[0.04] px-[2cqw] py-[1.6cqw]">
                  <div>
                    <p className="text-[2.2cqw] font-medium text-white/90">{name}</p>
                    <p className={`${mono} text-white/45`}>{note}</p>
                  </div>
                  <span className={`relative h-[3cqw] w-[5.6cqw] rounded-full ${on ? 'bg-[#f2c14e]' : 'bg-white/15'}`}>
                    <span className={`absolute top-[0.4cqw] size-[2.2cqw] rounded-full bg-white shadow ${on ? 'right-[0.4cqw]' : 'left-[0.4cqw]'}`} />
                  </span>
                </div>
              ))}
            </div>
          </Window>
          <span className={`absolute left-[5cqw] top-[5cqw] ${mono} uppercase tracking-[0.2em] text-[#ffe6a8]`}>Model Context Protocol</span>
        </div>
      );
    }

    case 'tic-tac-tactics': {
      const board = ['X', 'O', 'X', '', 'X', 'O', 'O', '', 'X'];
      return (
        <div className={wrap} style={{ ...base, background: 'radial-gradient(100% 100% at 30% 0%, #6aa4ff 0%, #1f47b8 45%, #060f2e 100%)' }}>
          <div className="absolute left-1/2 top-[54%] grid w-[40cqw] -translate-x-1/2 -translate-y-1/2 grid-cols-3 gap-[1.2cqw] rotate-[-4deg]">
            {board.map((m, i) => (
              <div key={i} className={`grid aspect-square place-items-center rounded-[1.6cqw] border border-white/15 bg-white/[0.08] text-[9cqw] font-semibold leading-none backdrop-blur ${i === 0 || i === 4 || i === 8 ? 'shadow-[0_0_3cqw_rgb(255_214_102/0.5)]' : ''}`}>
                <span className={m === 'X' ? 'text-[#ffd666]' : 'text-[#ff7aa8]'}>{m}</span>
              </div>
            ))}
          </div>
          <span className={`absolute left-[5cqw] top-[5cqw] rounded-full bg-white/90 px-[1.6cqw] py-[0.6cqw] ${mono} text-[#1f47b8]`}>HARD · minimax</span>
          <span className={`absolute bottom-[5cqw] right-[5cqw] ${mono} text-white/80`}>🪙 coins · skins · lucky spin</span>
        </div>
      );
    }

    case 'myquote':
      return (
        <div className={wrap} style={{ ...base, background: 'radial-gradient(100% 100% at 80% 100%, #e0533f 0%, #7a1a12 40%, #170504 100%)' }}>
          <p className="absolute -left-[2cqw] -top-[10cqw] font-serif text-[48cqw] italic leading-none text-white/[0.08]">“</p>
          <div className="absolute left-1/2 top-1/2 w-[64cqw] -translate-x-1/2 -translate-y-1/2 rounded-[1.6cqw] bg-[#fbf4ec] p-[4cqw] shadow-[0_4cqw_8cqw_rgb(0_0_0/0.5)] rotate-[-2deg]">
            <p className="font-serif text-[4.4cqw] italic leading-[1.1] text-[#3a0d08]">“The unexamined life is not worth living.”</p>
            <div className="mt-[2.4cqw] flex items-center justify-between">
              <span className="text-[1.9cqw] font-semibold text-[#7a1a12]">Socrates</span>
              <span className="flex gap-[1cqw]">
                {['Ethics', 'Life'].map((t) => <span key={t} className={`rounded-full border border-[#7a1a12]/30 px-[1.2cqw] py-[0.3cqw] ${mono} text-[#7a1a12]`}>{t}</span>)}
              </span>
            </div>
          </div>
          <span className={`absolute bottom-[4cqw] left-[5cqw] ${mono} text-white/75`}>Ruby on Rails · users · quotes · philosophers · categories</span>
        </div>
      );

    case 'power-hive': {
      const hexes = [[30, 32], [42, 32], [54, 32], [36, 52], [48, 52], [60, 52], [42, 72], [54, 72]] as const;
      return (
        <div className={wrap} style={{ ...base, background: 'radial-gradient(100% 100% at 50% 40%, #3b2a02 0%, #120c01 60%, #050300 100%)' }}>
          {hexes.map(([x, y], i) => (
            <div key={i} className="absolute grid size-[12cqw] -translate-x-1/2 -translate-y-1/2 place-items-center" style={{ left: `${x + 4}%`, top: `${y}%`, clipPath: 'polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0 50%)', background: i % 3 === 0 ? '#ffc61a' : 'linear-gradient(160deg, #ffd85a, #c98a00)', opacity: 0.55 + (i % 4) * 0.12 }}>
              <span className={`${mono} font-semibold text-[#3b2a02]`}>1 MWh</span>
            </div>
          ))}
          <div className="absolute left-[5cqw] top-[5cqw]">
            <p className={`${mono} uppercase tracking-[0.2em] text-[#ffd85a]`}>Metropolitan Colombo</p>
            <p className="mt-[1cqw] text-[5cqw] font-medium leading-none tracking-[-0.04em] text-[#fff3d1]">8 batteries · 8 MWh</p>
          </div>
          <span className={`absolute bottom-[5cqw] right-[5cqw] rounded-full border border-[#ffd85a]/40 px-[1.6cqw] py-[0.6cqw] ${mono} text-[#ffe9a8]`}>⚡ shift load off-peak</span>
        </div>
      );
    }

    case 'hornet-finder': {
      const rows = [['#1', 'Hornet 250 · Japan', '✓ papers · original paint', '#2fbf71'], ['#2', 'Hornet 250 · Japan', '⚠ repainted tank', '#f2b705'], ['#3', 'Hornet 250 · Japan', '⚠ minor accident', '#f2b705'], ['✕', 'CB Hornet 160R', 'skipped: wrong model', '#888']] as const;
      return (
        <div className={wrap} style={{ ...base, background: 'radial-gradient(110% 100% at 90% 0%, #ff4b4b 0%, #7a1010 40%, #140303 100%)' }}>
          <Window title="Hornet Finder · Read and rank" className="left-1/2 top-[55%] w-[74cqw] -translate-x-1/2 -translate-y-1/2 bg-[#1a0d0d]">
            <div className="grid gap-[1cqw] p-[2cqw]">
              {rows.map(([rank, title, note, c]) => (
                <div key={note} className="flex items-center gap-[2cqw] rounded-[0.8cqw] bg-white/[0.05] px-[1.8cqw] py-[1.2cqw]" style={{ opacity: rank === '✕' ? 0.5 : 1 }}>
                  <span className={`w-[4cqw] ${mono} text-white/60`}>{rank}</span>
                  <span className="flex-1 text-[2cqw] text-white/90">{title}</span>
                  <span className={`${mono}`} style={{ color: c }}>{note}</span>
                </div>
              ))}
            </div>
          </Window>
          <span className={`absolute left-[5cqw] top-[5cqw] ${mono} text-[#ffc9c9]`}>Gemma reads English · සිංහල · Singlish</span>
        </div>
      );
    }

    case 'coming-soon':
      return (
        <div className={wrap} style={{ ...base, background: '#1d3b2a' }}>
          <Image src={comingSoon} alt="ComingSoon gameplay: the warrior leaps between platforms as a skeleton waits ahead" fill priority={priority} sizes={sizes} placeholder="blur" className="object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgb(8 16 10 / 0) 55%, rgb(8 16 10 / 0.8))' }} />
          <div className={`absolute bottom-[5cqw] left-[5cqw] flex gap-[1cqw] ${mono} uppercase tracking-[0.18em] text-white/90`}>
            {['Grab', 'Slide', 'Dash', 'Strike'].map((t) => <span key={t} className="rounded-full border border-white/30 bg-black/30 px-[1.4cqw] py-[0.5cqw] backdrop-blur">{t}</span>)}
          </div>
        </div>
      );

    case 'scheduler-testing': {
      const nodes = [[50, 16, '1'], [50, 34, '2'], [32, 52, '3'], [68, 52, '4'], [50, 70, '5'], [50, 88, '6']] as const;
      const edges = [[0, 1], [1, 2], [1, 3], [2, 4], [3, 4], [4, 5], [4, 1]] as const;
      return (
        <div className={wrap} style={{ ...base, background: 'radial-gradient(110% 100% at 0% 0%, #2bc3d1 0%, #0b4f57 42%, #031416 100%)' }}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-y-0 right-0 h-full w-[55%]" aria-hidden>
            {edges.map(([a, b], i) => (
              <path key={i} d={i === 6 ? `M ${nodes[a][0] + 4} ${nodes[a][1]} C 80 70, 80 40, ${nodes[b][0] + 4} ${nodes[b][1]}` : `M ${nodes[a][0]} ${nodes[a][1]} L ${nodes[b][0]} ${nodes[b][1]}`} stroke={i === 2 ? '#ff6b6b' : '#8ff0f7'} strokeOpacity=".75" strokeWidth=".5" fill="none" vectorEffect="non-scaling-stroke" />
            ))}
          </svg>
          {nodes.map(([x, y, n]) => (
            <div key={n} className={`absolute grid size-[6cqw] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[#8ff0f7]/70 bg-[#06282c] ${mono} text-[#c9fbff]`} style={{ left: `${45 + x * 0.55}%`, top: `${y}%` }}>{n}</div>
          ))}
          <div className="absolute left-[5cqw] top-1/2 w-[38cqw] -translate-y-1/2 rounded-[1cqw] border border-white/10 bg-black/45 p-[2cqw] font-mono text-[max(8px,1.35cqw)] leading-[1.7] backdrop-blur">
            <p className="text-white/50">$ pytest -q --cov=logic</p>
            <p className="text-[#7ef0a0]">PASSED  boundary: hour 0 and 23</p>
            <p className="text-[#7ef0a0]">PASSED  pairwise: room × person</p>
            <p className="text-[#ff8a8a]">FAILED  defect confirmed</p>
            <p className="mt-[0.6cqw] text-[#c9fbff]">branch coverage ▮▮▮▮▮▮▮▯</p>
          </div>
          <span className={`absolute left-[5cqw] top-[5cqw] ${mono} uppercase tracking-[0.2em] text-[#c9fbff]`}>Black box · white box</span>
        </div>
      );
    }

    case 'perfume-explorer':
      return (
        <div className={wrap} style={{ ...base, background: 'radial-gradient(100% 100% at 85% 15%, #d58cff 0%, #5d1f86 40%, #12051c 100%)' }}>
          <div className="absolute right-[7cqw] top-[12%] h-[34cqw] w-[20cqw] rounded-[3cqw_3cqw_2cqw_2cqw] border border-white/30 bg-gradient-to-b from-white/25 to-white/5 shadow-[inset_0_0_4cqw_rgb(255_255_255/0.15)] backdrop-blur">
            <div className="absolute -top-[5cqw] left-1/2 h-[5cqw] w-[7cqw] -translate-x-1/2 rounded-t-[1cqw] bg-white/35" />
          </div>
          <Window title="Perfume Explorer.exe" className="left-[5cqw] top-1/2 w-[56cqw] -translate-y-1/2 bg-[#0d0612]">
            <div className="p-[2.2cqw] font-mono text-[max(8px,1.5cqw)] leading-[1.75] text-[#e9d6ff]">
              <p className="text-[#d58cff]">MAIN MENU</p>
              {['1. Fragrance Search', '2. Oldest', '3. Top 5', '4. Tongue Twister', '5. WWFragrance', '6. Exit'].map((l) => <p key={l}>{l}</p>)}
              <p className="mt-[0.6cqw] text-white/60">Enter your choice (1 to 6): <span className="text-white">3▌</span></p>
            </div>
          </Window>
        </div>
      );

    case 'nulldle': {
      const rows = [
        ['C', 'R', 'A', 'N', 'E'],
        ['S', 'L', 'A', 'T', 'E'],
        ['P', 'L', 'A', 'N', 'T'],
      ];
      const marks = [
        ['n', 'n', 'g', 'g', 'n'],
        ['n', 'g', 'g', 'y', 'n'],
        ['g', 'g', 'g', 'g', 'g'],
      ];
      const col: Record<string, string> = { g: '#3fbf6e', y: '#e8b923', n: '#3a2a33' };
      return (
        <div className={wrap} style={{ ...base, background: 'radial-gradient(100% 100% at 50% 0%, #ff6fa3 0%, #8c1f4c 42%, #17050d 100%)' }}>
          <div className="absolute left-1/2 top-[50%] grid -translate-x-1/2 -translate-y-1/2 gap-[1.2cqw]">
            {rows.map((r, i) => (
              <div key={i} className="flex gap-[1.2cqw]">
                {r.map((ch, j) => (
                  <span key={j} className="grid size-[8.4cqw] place-items-center rounded-[0.8cqw] text-[4.4cqw] font-bold text-white shadow-[0_1cqw_2cqw_rgb(0_0_0/0.35)]" style={{ background: col[marks[i][j]] }}>{ch}</span>
                ))}
              </div>
            ))}
          </div>
          <span className={`absolute left-[5cqw] top-[5cqw] ${mono} uppercase tracking-[0.2em] text-[#ffd0e1]`}>6 tries · 1 word</span>
          <span className={`absolute bottom-[5cqw] right-[5cqw] rounded-full bg-white/90 px-[1.6cqw] py-[0.6cqw] ${mono} text-[#8c1f4c]`}>MVVM · unit tested</span>
        </div>
      );
    }

    case 'sports-association-system': {
      const actors = [[10, 30, 'Student'], [10, 70, 'Committee'], [90, 50, 'Admin']] as const;
      const cases = [[50, 18, 'Apply for membership'], [50, 38, 'Join an event'], [50, 58, 'Manage sports clubs'], [50, 78, 'Generate report']] as const;
      const links = [[0, 0], [0, 1], [1, 2], [1, 1], [2, 2], [2, 3]] as const;
      return (
        <div className={wrap} style={{ ...base, background: 'radial-gradient(110% 100% at 50% 0%, #2fbf6f 0%, #0f5230 42%, #04140b 100%)' }}>
          <div className="absolute inset-y-[8%] left-[24%] right-[24%] rounded-[2cqw] border border-[#9ff0c2]/40" />
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
            {links.map(([a, c], i) => (
              <line key={i} x1={actors[a][0] + (actors[a][0] < 50 ? 4 : -4)} y1={actors[a][1]} x2={cases[c][0] + (actors[a][0] < 50 ? -15 : 15)} y2={cases[c][1]} stroke="#9ff0c2" strokeOpacity=".55" strokeWidth=".4" vectorEffect="non-scaling-stroke" />
            ))}
          </svg>
          {cases.map(([x, y, label]) => (
            <div key={label} className={`absolute grid h-[7cqw] w-[30%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[50%] border border-[#9ff0c2]/70 bg-[#0b3a22] text-center ${mono} text-[#dcffe9]`} style={{ left: `${x}%`, top: `${y}%` }}>{label}</div>
          ))}
          {actors.map(([x, y, label]) => (
            <div key={label} className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center" style={{ left: `${x}%`, top: `${y}%` }}>
              <svg viewBox="0 0 20 30" className="h-[7cqw] w-[4.6cqw]" aria-hidden>
                <circle cx="10" cy="5" r="4" fill="none" stroke="#dcffe9" strokeWidth="1.5" />
                <path d="M10 9v11M3 13h14M10 20l-6 9M10 20l6 9" stroke="#dcffe9" strokeWidth="1.5" fill="none" />
              </svg>
              <span className={`${mono} text-[#dcffe9]`}>{label}</span>
            </div>
          ))}
          <span className={`absolute left-[26%] top-[3cqw] ${mono} uppercase tracking-[0.2em] text-[#9ff0c2]`}>Sports Association System</span>
        </div>
      );
    }

    case 'continuum':
      return (
        <div className={wrap} style={{ ...base, background: 'linear-gradient(180deg, #ff9f43 0%, #e8590c 30%, #3b1d5e 62%, #0b0718 100%)' }}>
          <div className="absolute left-1/2 top-[30%] size-[22cqw] -translate-x-1/2 rounded-full bg-[#ffd8a8] opacity-80 blur-[0.4cqw]" />
          <div className="absolute inset-x-0 top-[44%] h-[6cqw]" style={{ background: 'linear-gradient(90deg, #c2410c 0 18%, transparent 18% 22%, #f2cc8f 22% 40%, transparent 40% 60%, #e7f5ff 60% 82%, transparent 82%)', opacity: 0.35, clipPath: 'polygon(0 100%, 6% 30%, 12% 70%, 20% 10%, 30% 80%, 42% 20%, 55% 75%, 66% 15%, 78% 70%, 88% 25%, 100% 90%, 100% 100%)' }} />
          <div className="absolute inset-x-0 bottom-0 h-[56%]" style={{ background: 'linear-gradient(180deg, #2b2440, #0c0a14)', clipPath: 'polygon(46% 0, 54% 0, 100% 100%, 0 100%)' }} />
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="absolute left-1/2 -translate-x-1/2 bg-[#ffd166]" style={{ top: `${48 + i * 10}%`, width: `${0.6 + i * 0.5}cqw`, height: `${2 + i * 1.6}cqw` }} />
          ))}
          <div className="absolute bottom-[8%] left-[56%] h-[7cqw] w-[11cqw] rounded-[1.2cqw_1.2cqw_0.6cqw_0.6cqw] bg-[#ff3b3b] shadow-[0_0_3cqw_#ff3b3b]" />
          <div className="absolute bottom-[34%] left-[46%] h-[2.6cqw] w-[4cqw] rounded-[0.5cqw] bg-[#4dabf7] opacity-90" />
          <div className="absolute right-[8cqw] top-[30%] size-[9cqw] rounded-full border-[0.6cqw] border-[#b197fc] shadow-[0_0_4cqw_#b197fc,inset_0_0_3cqw_#b197fc]" />
          <div className={`absolute left-[5cqw] top-[5cqw] flex gap-[1cqw] ${mono} uppercase tracking-[0.18em] text-white/90`}>
            {['Desert', 'City', 'Snow'].map((t) => <span key={t} className="rounded-full border border-white/30 bg-black/25 px-[1.4cqw] py-[0.5cqw] backdrop-blur">{t}</span>)}
          </div>
          <span className={`absolute bottom-[5cqw] left-[5cqw] ${mono} text-[#ffe8cc]`}>NITRO ▮▮▮▯ · crash = shrink</span>
        </div>
      );

    case 'tethered': {
      const pts = [[22, 34], [40, 22], [58, 40], [36, 62], [70, 66], [80, 30]] as const;
      const links = [[0, 1], [1, 2], [2, 3], [3, 0], [2, 4], [2, 5]] as const;
      return (
        <div className={wrap} style={{ ...base, background: 'radial-gradient(90% 80% at 50% 60%, #2a1a3d 0%, #120b1f 55%, #05030a 100%)' }}>
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(rgb(33 230 193 / .18) 1px, transparent 1px), linear-gradient(90deg, rgb(33 230 193 / .18) 1px, transparent 1px)', backgroundSize: '6cqw 6cqw', transform: 'perspective(60cqw) rotateX(55deg) scale(1.6)', transformOrigin: '50% 100%' }} />
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
            {links.map(([a, b], i) => (
              <line key={i} x1={pts[a][0]} y1={pts[a][1]} x2={pts[b][0]} y2={pts[b][1]} stroke={i > 3 ? '#ff4fd8' : '#21e6c1'} strokeWidth="0.6" vectorEffect="non-scaling-stroke" style={{ filter: `drop-shadow(0 0 4px ${i > 3 ? '#ff4fd8' : '#21e6c1'})` }} />
            ))}
          </svg>
          {pts.map(([x, y], i) => (
            <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: `${y}%` }}>
              {i === 4 ? (
                <div className="h-[5cqw] w-[4cqw] rounded-[0.6cqw] border border-[#ff9f43] bg-[#5c2a0c] shadow-[0_0_3cqw_#ff9f43]" />
              ) : i === 5 ? (
                <div className="size-[6cqw] rounded-[40%] bg-[#4b4458] shadow-[0_0_2cqw_#ff4fd8]" />
              ) : (
                <div className="size-[3.4cqw] rotate-45 border border-[#21e6c1] bg-[#0d2f2a] shadow-[0_0_2.4cqw_#21e6c1]" />
              )}
            </div>
          ))}
          <div className="absolute left-[50%] top-[86%] size-[2.6cqw] -translate-x-1/2 rounded-full bg-white shadow-[0_0_3cqw_#fff]" />
          <span className={`absolute left-[5cqw] top-[5cqw] ${mono} uppercase tracking-[0.2em] text-[#7ff5df]`}>Wave 09 · chain ×5</span>
          <span className={`absolute bottom-[5cqw] right-[5cqw] ${mono} text-[#ffb3ef]`}>◆ Neon Shards +12</span>
        </div>
      );
    }

    case 'smart-dictionary': {
      return (
        <div className={wrap} style={{ ...base, background: 'radial-gradient(100% 100% at 10% 0%, #5aa2ff 0%, #1d4f96 42%, #050f20 100%)' }}>
          <p className="absolute -right-[3cqw] -top-[6cqw] font-serif text-[34cqw] italic leading-none text-white/[0.07]">Aa</p>
          <Window title="Smart Search" className="left-[6cqw] top-1/2 w-[62cqw] -translate-y-1/2 bg-[#081426]">
            <div className="p-[2.2cqw] font-mono text-[max(8px,1.5cqw)] leading-[1.8] text-[#d6e6ff]">
              <p className="text-white/60">Enter a word: <span className="text-white">acheive</span></p>
              <p className="mt-[0.8cqw] text-[#8fc1ff]">Damerau-Levenshtein · closest 5</p>
              <p className="flex justify-between"><span>1. achieve</span><span className="text-[#ffd166]">distance 1</span></p>
              {[70, 58, 64, 52].map((w, i) => (
                <p key={i} className="flex items-center justify-between opacity-50"><span className="my-[0.7cqw] h-[1cqw] rounded-full bg-[#d6e6ff]/40" style={{ width: `${w}%` }} /><span className="h-[1cqw] w-[6cqw] rounded-full bg-[#ffd166]/40" /></p>
              ))}
            </div>
          </Window>
          <div className={`absolute bottom-[5cqw] right-[5cqw] flex flex-col items-end gap-[0.8cqw] ${mono}`}>
            {['Hamming', 'Levenshtein', 'Damerau-Levenshtein'].map((t, i) => (
              <span key={t} className={`rounded-full border px-[1.4cqw] py-[0.4cqw] ${i === 2 ? 'border-[#ffd166] text-[#ffd166]' : 'border-white/30 text-white/70'}`}>{t}</span>
            ))}
          </div>
          <span className={`absolute right-[5cqw] top-[5cqw] ${mono} text-[#cfe2ff]`}>105,160 words</span>
        </div>
      );
    }

    default:
      return <div className={wrap} style={{ background: 'var(--color-ink-3)' }} />;
  }
}
