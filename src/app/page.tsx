import Image from 'next/image';
import Link from 'next/link';
import { ViewTransition } from 'react';
import studio from '@/assets/me/studio.jpg';
import { CAPABILITIES, PROJECTS, SITE, STATEMENT, WRITING } from '@/content/site';
import { Hero } from '@/components/home/Hero';
import { FeaturedWork } from '@/components/home/FeaturedWork';
import { ProcessScroller } from '@/components/home/ProcessScroller';
import { NowStrip } from '@/components/home/NowStrip';
import { ValleyInvite } from '@/components/home/ValleyInvite';
import { Marquee } from '@/components/ui/Marquee';
import { FadeUp, ImageReveal, Parallax, ScrubWords, SplitReveal } from '@/components/motion/Reveal';
import { Magnetic } from '@/components/ui/Magnetic';
import { pageTransition } from '@/lib/transitions';
import { Spotlight } from '@/components/motion/Spotlight';
import { CountUp } from '@/components/motion/CountUp';
import { SectionGuide } from '@/components/motion/SectionGuide';
import { RollText } from '@/components/motion/RollText';

export default function Home() {
  const featured = PROJECTS.filter((p) => p.featured);
  return (
    <ViewTransition {...pageTransition}>
      <div>
        <Hero />
        <SectionGuide
          sections={[
            { id: 'intro', label: 'Intro' },
            { id: 'work', label: 'Work' },
            { id: 'about', label: 'About' },
            { id: 'process', label: 'Process' },
            { id: 'skills', label: 'Skills' },
            { id: 'now', label: 'Right now' },
            { id: 'valley', label: '3D world' },
            { id: 'writing', label: 'Writing' },
          ]}
        />

        <div className="border-y border-line py-5 text-[clamp(1.4rem,3vw,2.6rem)] font-medium tracking-[-0.03em]">
          <Marquee
            items={['Software engineering', <span key="g" className="serif-i">Game development</span>, 'Desktop apps', <span key="a" className="serif-i">AI agents & MCP</span>, 'Web platforms', <span key="n" className="serif-i">Networks</span>]}
          />
        </div>

        {/* statement */}
        <section id="intro" className="container-x grid gap-10 py-28 md:grid-cols-12 md:py-40" aria-label="Introduction">
          <p className="eyebrow md:col-span-3">(01) Intro</p>
          <div className="md:col-span-9">
            <ScrubWords text={STATEMENT} className="text-[clamp(1.7rem,3.6vw,3.4rem)] font-medium leading-[1.12] tracking-[-0.035em]" />
            <FadeUp className="mt-12 flex flex-wrap items-center gap-6">
              <Link href="/about" className="btn btn-ghost"><RollText>More about me</RollText> <span aria-hidden>→</span></Link>
              <span className="text-sm text-mute">{SITE.degree} · {SITE.university}</span>
            </FadeUp>
          </div>
        </section>

        {/* selected work */}
        <section id="work" className="container-x pb-24" aria-labelledby="work-title">
          <div className="mb-12 grid gap-6 md:grid-cols-12 md:items-end">
            <p className="eyebrow md:col-span-3">(02) Selected work</p>
            <SplitReveal as="h2" className="h-xl md:col-span-7" >
              <span id="work-title">Things I’ve <span className="serif-i text-ember">made</span></span>
            </SplitReveal>
            <FadeUp className="md:col-span-2 md:text-right">
              <Link href="/work" className="link-u text-sm text-bone-2">All {PROJECTS.length} projects →</Link>
            </FadeUp>
          </div>
          <FeaturedWork projects={featured} />
        </section>

        {/* about teaser: inverted bone section */}
        <section id="about" className="relative bg-bone text-ink" aria-labelledby="about-title">
          <div className="container-x grid gap-12 py-24 md:grid-cols-12 md:py-36">
            <div className="flex flex-col justify-between gap-10 md:col-span-5">
              <div>
                <p className="eyebrow !text-ink/55">(03) About</p>
                <SplitReveal as="h2" className="h-xl mt-6">
                  <span id="about-title">Curious by default, <span className="serif-i">careful</span> by habit.</span>
                </SplitReveal>
              </div>
              <FadeUp>
                <p className="max-w-[44ch] text-lg leading-relaxed text-ink/75">
                  I’m Gangul, a Computer Science (Software Engineering) student at {SITE.university}, based in Colombo.
                  I like problems that sit between disciplines: game feel and AI, file systems and trust, maths and film.
                  I care about the last 10%: the polish that makes software feel finished.
                </p>
                <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-ink/15 pt-6">
                  {[
                    [String(PROJECTS.length).padStart(2, '0'), 'Projects built'],
                    ['03', 'Platforms released on'],
                    ['01', 'Game you finish by speaking'],
                  ].map(([n, l]) => (
                    <div key={l}>
                      <dt className="sr-only">{l}</dt>
                      <dd className="text-[clamp(2rem,4vw,3.4rem)] font-medium leading-none tracking-[-0.05em]"><CountUp value={n} /></dd>
                      <dd className="mt-2 text-xs text-ink/60">{l}</dd>
                    </div>
                  ))}
                </dl>
                <Magnetic className="mt-10">
                  <Link href="/about" className="btn btn-solid !bg-ink !text-bone" data-cursor="Read">
                    <RollText>My story</RollText> <span aria-hidden>→</span>
                  </Link>
                </Magnetic>
              </FadeUp>
            </div>
            <div className="md:col-span-7">
              <ImageReveal className="overflow-hidden rounded-[1.4rem]">
                <Parallax amount={6} className="aspect-[4/3] overflow-hidden md:aspect-[5/4]">
                  <Image src={studio} alt="Gangul relaxing in an armchair beside a laptop and a warm lamp" placeholder="blur" sizes="(min-width: 768px) 55vw, 100vw" className="h-[112%] w-full object-cover object-[60%_40%]" />
                </Parallax>
              </ImageReveal>
              <p className="mt-3 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-ink/50">Off the clock · Colombo</p>
            </div>
          </div>
        </section>

        <ProcessScroller />

        {/* capabilities */}
        <section id="skills" className="container-x py-28 md:py-36" aria-labelledby="cap-title">
          <div className="mb-14 grid gap-6 md:grid-cols-12">
            <p className="eyebrow md:col-span-3">(04) Capabilities</p>
            <SplitReveal as="h2" className="h-xl md:col-span-9">
              <span id="cap-title">A generalist’s toolkit, <span className="serif-i text-ember">sharpened</span> by building.</span>
            </SplitReveal>
          </div>
          <Spotlight className="grid gap-px overflow-hidden rounded-[1.4rem] border border-line bg-line md:grid-cols-2 xl:grid-cols-4">
            {CAPABILITIES.map((c, i) => (
              <FadeUp key={c.title} delay={i * 0.08} className="bg-ink p-7 md:p-9" data-spot>
                <p className="font-mono text-xs text-mute">0{i + 1}</p>
                <h3 className="mt-10 text-xl font-medium tracking-tight">{c.title}</h3>
                <ul className="mt-5 space-y-2.5 text-[0.95rem] text-bone-2">
                  {c.items.map((it) => (
                    <li key={it} className="flex items-center gap-3"><span className="h-px w-3 bg-ember" aria-hidden /> {it}</li>
                  ))}
                </ul>
              </FadeUp>
            ))}
          </Spotlight>
        </section>

        <NowStrip />

        <ValleyInvite />

        {/* writing */}
        <section id="writing" className="container-x pb-32" aria-labelledby="writing-title">
          <div className="mb-10 grid gap-6 md:grid-cols-12 md:items-end">
            <p className="eyebrow md:col-span-3">(06) Writing</p>
            <SplitReveal as="h2" className="h-lg md:col-span-6"><span id="writing-title">Notes from LinkedIn</span></SplitReveal>
            <FadeUp className="md:col-span-3 md:text-right">
              <a href={SITE.socials[1].url} target="_blank" rel="noreferrer" className="link-u text-sm text-bone-2">Follow on LinkedIn ↗</a>
            </FadeUp>
          </div>
          <ul className="border-t border-line">
            {WRITING.map((w) => (
              <li key={w.title} className="border-b border-line">
                <a href={SITE.socials[1].url} target="_blank" rel="noreferrer" className="group grid grid-cols-12 items-baseline gap-4 py-5 transition-colors hover:text-ember">
                  <span className="col-span-3 font-mono text-xs text-mute md:col-span-2">{w.when}</span>
                  <span className="col-span-9 text-lg tracking-tight md:col-span-9 md:text-xl">{w.title}</span>
                  <span className="hidden text-right md:col-span-1 md:block" aria-hidden>↗</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </ViewTransition>
  );
}
