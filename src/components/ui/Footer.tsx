import Link from 'next/link';
import { NAV, SITE } from '@/content/site';
import { SplitReveal } from '@/components/motion/Reveal';
import { Magnetic } from './Magnetic';
import { LocalTime } from './LocalTime';
import { CopyEmail } from './CopyEmail';
import { RollText } from '@/components/motion/RollText';

export function Footer() {
  return (
    <footer className="no-print relative overflow-clip border-t border-line bg-ink container-x pb-8 pt-24 md:pt-36">
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-1/2 left-1/2 h-[70vh] w-[90vw] -translate-x-1/2 rounded-full opacity-40 blur-[120px]"
        style={{ background: 'radial-gradient(closest-side, var(--color-ember), transparent)' }}
      />
      <div className="relative">
        <p className="eyebrow mb-6 flex items-center gap-2">
          <span className="dot-live" /> {SITE.availability}
        </p>
        <SplitReveal as="h2" className="display text-[clamp(3.2rem,11vw,11.5rem)]">
          Let’s build <span className="serif-i text-ember">something</span> good.
        </SplitReveal>

        <div className="mt-14 flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <Magnetic>
              <Link href="/contact" className="btn btn-solid h-16 px-8 text-base" data-cursor="Say hi">
                <RollText>Start a conversation</RollText> <span aria-hidden>→</span>
              </Link>
            </Magnetic>
            <Magnetic strength={0.2}>
              <CopyEmail className="btn btn-ghost h-16 px-8 text-base" />
            </Magnetic>
          </div>
          <div className="grid grid-cols-2 gap-x-16 gap-y-2 text-sm">
            <p className="eyebrow col-span-2 mb-2">Elsewhere</p>
            {SITE.socials.map((s) => (
              <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="w-fit text-bone-2 hover:text-bone">
                <RollText>{`${s.label} ↗`}</RollText>
              </a>
            ))}
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="w-fit text-bone-2 hover:text-bone">
                <RollText>{n.label}</RollText>
              </Link>
            ))}
            <Link href="/cv" className="w-fit text-bone-2 hover:text-bone"><RollText>CV</RollText></Link>
            <a href={SITE.valleyUrl} className="w-fit text-bone-2 hover:text-bone"><RollText>3D world ↗</RollText></a>
          </div>
        </div>

        <div className="mt-24 flex flex-col gap-3 border-t border-line pt-6 text-xs text-mute md:flex-row md:items-center md:justify-between">
          <p>© 2026 {SITE.fullName}. Designed & engineered by me.</p>
          <p className="flex items-center gap-4">
            <span>{SITE.location}</span>
            <LocalTime />
            <Link href="/privacy" className="link-u">Privacy</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
