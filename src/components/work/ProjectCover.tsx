import Image from 'next/image';
import type { CSSProperties } from 'react';
import apparition from '@/assets/work/apparition.jpg';
import manimdesk from '@/assets/work/manimdesk.png';

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

    default:
      return <div className={wrap} style={{ background: 'var(--color-ink-3)' }} />;
  }
}
