import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ViewTransition } from 'react';
import portrait from '@/assets/me/portrait.jpg';
import studio from '@/assets/me/studio.jpg';
import river from '@/assets/me/river.jpg';
import { CAPABILITIES, EDUCATION, INTERESTS, PROCESS, SITE } from '@/content/site';
import { FadeUp, ImageReveal, Parallax, SplitReveal } from '@/components/motion/Reveal';
import { PageHeader } from '@/components/ui/PageHeader';
import { pageTransition } from '@/lib/transitions';

export const metadata: Metadata = {
  title: 'About',
  description: `About ${SITE.fullName}, software engineering student at ${SITE.university}, based in ${SITE.location}.`,
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <ViewTransition {...pageTransition}>
      <div>
        <PageHeader
          eyebrow="About · Gangul Missaka Hinguralaarachchi"
          title={<>Engineer in <span className="serif-i text-ember">progress</span></>}
          intro={<>I’m a Computer Science (Software Engineering) student at {SITE.university}, based in Colombo, Sri Lanka. I build things to understand them, and I finish them properly.</>}
          aside={
            <div className="flex flex-col gap-3 text-sm">
              <span className="flex items-center gap-2"><span className="dot-live" /> {SITE.availability}</span>
              <Link href="/cv" className="link-u w-fit text-bone-2">View / print my CV →</Link>
            </div>
          }
        />

        {/* photo trio */}
        <section className="container-x grid gap-4 md:grid-cols-12" aria-label="Photos">
          <ImageReveal className="overflow-hidden rounded-[1.4rem] md:col-span-4">
            <Image src={portrait} alt="Gangul in a tweed blazer and glasses, studio portrait" placeholder="blur" sizes="(min-width: 768px) 33vw, 100vw" className="aspect-[3/4] h-full w-full object-cover object-top" />
          </ImageReveal>
          <ImageReveal delay={0.12} className="overflow-hidden rounded-[1.4rem] md:col-span-8">
            <Parallax amount={5} className="aspect-[4/3] h-full overflow-hidden md:aspect-auto">
              <Image src={studio} alt="Gangul seated in an armchair in warm evening light, laptop and lamp beside him" placeholder="blur" sizes="(min-width: 768px) 66vw, 100vw" className="h-[110%] w-full object-cover" />
            </Parallax>
          </ImageReveal>
        </section>

        {/* story */}
        <section className="container-x grid gap-10 py-24 md:grid-cols-12 md:py-36">
          <p className="eyebrow md:col-span-3">The short version</p>
          <div className="space-y-8 md:col-span-8">
            <SplitReveal as="p" className="text-[clamp(1.6rem,3vw,2.8rem)] font-medium leading-[1.15] tracking-[-0.03em]">
              I started with a ball rolling around a Unity tutorial. A few months later I built a horror game you can only finish by speaking out loud.
            </SplitReveal>
            <FadeUp as="p" className="lead">
              That’s how I learn: pick something slightly too hard, then build until it works. Alongside games I write desktop tools I wished
              existed. Nimbo files a whole drive of photos without ever losing one; ManimDesk lets anyone render maths animations without touching
              a terminal. At university I go deep on the fundamentals: data structures, systems analysis, databases, networking and security.
            </FadeUp>
            <FadeUp as="p" className="lead">
              Right now I’m most excited about AI agents and the Model Context Protocol: software that can use other software. I’m looking for an
              internship or graduate role where I can ship real things with a team that cares about craft.
            </FadeUp>
          </div>
        </section>

        {/* education */}
        <section className="border-y border-line bg-ink-2">
          <div className="container-x grid gap-10 py-20 md:grid-cols-12">
            <p className="eyebrow md:col-span-3">Education</p>
            <ul className="md:col-span-9">
              {EDUCATION.map((e) => (
                <FadeUp as="li" key={e.where} className="grid gap-2 border-b border-line py-6 last:border-0 md:grid-cols-9">
                  <span className="font-mono text-xs text-mute md:col-span-2">{e.when}</span>
                  <span className="text-2xl font-medium tracking-tight md:col-span-4">{e.where}</span>
                  <span className="text-bone-2 md:col-span-3">{e.what}</span>
                </FadeUp>
              ))}
            </ul>
          </div>
        </section>

        {/* skills */}
        <section className="container-x py-24 md:py-32">
          <div className="mb-12 grid gap-6 md:grid-cols-12">
            <p className="eyebrow md:col-span-3">Skills</p>
            <h2 className="h-lg md:col-span-9">What I bring to a team</h2>
          </div>
          <div className="grid gap-x-10 gap-y-12 md:grid-cols-2 xl:grid-cols-4">
            {CAPABILITIES.map((c) => (
              <FadeUp key={c.title}>
                <h3 className="border-b border-line pb-3 text-lg font-medium">{c.title}</h3>
                <ul className="mt-4 space-y-2 text-bone-2">{c.items.map((i) => <li key={i}>{i}</li>)}</ul>
              </FadeUp>
            ))}
          </div>
        </section>

        {/* principles */}
        <section className="container-x pb-24">
          <div className="grid gap-px overflow-hidden rounded-[1.4rem] border border-line bg-line md:grid-cols-4">
            {PROCESS.map((s) => (
              <FadeUp key={s.n} className="bg-ink p-7">
                <p className="font-mono text-xs text-ember">{s.n}</p>
                <h3 className="mt-6 text-2xl font-medium">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mute">{s.body}</p>
              </FadeUp>
            ))}
          </div>
        </section>

        {/* off the clock */}
        <section className="container-x grid gap-10 pb-32 md:grid-cols-12 md:items-center">
          <div className="md:col-span-5">
            <p className="eyebrow">Off the clock</p>
            <SplitReveal as="h2" className="h-lg mt-5">Mangroves, rivers & <span className="serif-i text-ember">long questions</span>.</SplitReveal>
            <FadeUp as="p" className="lead mt-6">
              Life outside the editor: exploring Sri Lanka’s rivers and mangroves, and reading about where AI is heading next.
            </FadeUp>
            <FadeUp className="mt-8">
              <p className="eyebrow mb-3">Interests</p>
              <ul className="flex flex-wrap gap-2">{INTERESTS.map((i) => <li key={i} className="chip">{i}</li>)}</ul>
            </FadeUp>
          </div>
          <ImageReveal from="left" className="overflow-hidden rounded-[1.4rem] md:col-span-7">
            <Image src={river} alt="Gangul taking a selfie on a boat on a river lined with mangroves" placeholder="blur" sizes="(min-width: 768px) 58vw, 100vw" className="aspect-[16/10] w-full object-cover" />
          </ImageReveal>
        </section>
      </div>
    </ViewTransition>
  );
}
