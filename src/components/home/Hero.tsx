'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';
import portrait from '@/assets/me/portrait.jpg';
import { SITE } from '@/content/site';
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import { FadeUp, ImageReveal, SplitReveal } from '@/components/motion/Reveal';
import { LocalTime } from '@/components/ui/LocalTime';
import { HeroShader } from './HeroShader';
import { RollText } from '@/components/motion/RollText';

export function Hero() {
  const root = useRef<HTMLElement>(null);

  // scroll-out depth: portrait drifts up slower, name lines slide apart, everything dims
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const st = { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true } as const;
      gsap.to('[data-hero-portrait]', { yPercent: -14, ease: 'none', scrollTrigger: st });
      gsap.to('[data-hero-l1]', { xPercent: -8, ease: 'none', scrollTrigger: st });
      gsap.to('[data-hero-l2]', { xPercent: 6, ease: 'none', scrollTrigger: st });
      gsap.to('[data-hero-fade]', { opacity: 0, ease: 'none', scrollTrigger: { ...st, end: '60% top' } });

      // playful: each letter of the name hops when the pointer touches it
      const name = root.current!.querySelector('[data-hero-name]');
      const hop = (e: Event) => {
        const c = (e.target as Element).closest?.('.split-char');
        if (!c || gsap.isTweening(c)) return;
        gsap
          .timeline()
          .to(c, { y: '-0.12em', rotate: gsap.utils.random(-8, 8), color: '#f08a3c', duration: 0.28, ease: 'power3.out' })
          .to(c, { y: 0, rotate: 0, color: '#ede6da', duration: 0.9, ease: 'elastic.out(1, 0.35)' });
      };
      name?.addEventListener('pointerover', hop);
      return () => name?.removeEventListener('pointerover', hop);
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative isolate min-h-[100svh] overflow-clip container-x pb-8 pt-[calc(var(--header-h)+1.5rem)]" aria-labelledby="hero-title">
      <HeroShader className="absolute inset-0 -z-10" />

      <div data-hero-fade className="flex items-start justify-between gap-6">
        <FadeUp onIntro delay={0.2} className="eyebrow hidden sm:block">
          Software engineer · Portfolio 2026
        </FadeUp>
        <FadeUp onIntro delay={0.3} className="eyebrow flex items-center gap-2 sm:text-right">
          <span className="dot-live" /> {SITE.availability}
        </FadeUp>
      </div>

      <div data-hero-name className="relative mt-[6vh] md:mt-[4vh]">
        {/* line 1 sits behind the portrait */}
        <h1 id="hero-title" className="sr-only">
          {SITE.name}, {SITE.roleLong}
        </h1>
        <div data-hero-l1 className="relative z-0" aria-hidden>
          <SplitReveal onIntro type="chars" delay={0.05} className="display text-[clamp(4.6rem,18.5vw,21rem)]">
            Gangul
          </SplitReveal>
        </div>

        {/* portrait: under line 2, over line 1 */}
        <div data-hero-portrait className="relative z-10 mx-auto mt-6 w-[min(100%,26rem)] md:absolute md:right-[4vw] md:top-[-2vw] md:mt-0 md:w-[25vw] md:max-w-[30rem]">
          <ImageReveal onIntro delay={0.25} className="aspect-[4/5] overflow-hidden rounded-[1.2rem] md:aspect-[2/3]">
            <Image
              src={portrait}
              alt="Gangul Missaka in a tweed blazer, seated on a stool beside a chalkboard"
              priority
              placeholder="blur"
              sizes="(min-width: 768px) 25vw, 90vw"
              className="h-full w-full object-cover object-[50%_20%]"
            />
          </ImageReveal>
          <FadeUp onIntro delay={1.1} className="mt-3 flex justify-between font-mono text-[0.68rem] uppercase tracking-[0.14em] text-mute">
            <span>Colombo, LK</span>
            <LocalTime />
          </FadeUp>
        </div>

        <div data-hero-l2 className="relative z-20 mt-4 md:-mt-[2vw] md:text-right" aria-hidden>
          <SplitReveal onIntro type="chars" delay={0.2} className="display serif-i text-[clamp(4.6rem,18.5vw,21rem)] text-bone">
            Missaka
          </SplitReveal>
        </div>
      </div>

      <div data-hero-fade className="mt-10 grid gap-8 md:mt-14 md:grid-cols-12 md:items-end">
        <SplitReveal onIntro delay={0.55} as="p" className="lead max-w-[34ch] md:col-span-5">
          I’m a software engineering student at {SITE.university} who builds games that listen, apps that tidy your life
          and tools that turn maths into motion.
        </SplitReveal>
        <FadeUp onIntro delay={0.8} className="flex flex-wrap gap-3 md:col-span-4 md:col-start-6">
          <Link href="/work" className="btn btn-solid" data-cursor="Explore">
            <RollText>See my work</RollText> <span aria-hidden>→</span>
          </Link>
          <Link href="/contact" className="btn btn-ghost"><RollText>Get in touch</RollText></Link>
          <a href={SITE.valleyUrl} className="group flex h-12 items-center gap-2 px-2 text-sm text-bone-2 transition-colors hover:text-bone" title="Opens my 3D portfolio (loads 3D models)">
            <span aria-hidden className="transition-transform duration-500 group-hover:translate-x-1">🚗</span>
            <span className="link-u">Try the 3D version</span>
          </a>
        </FadeUp>
        <FadeUp onIntro delay={0.9} className="hidden items-center justify-end gap-3 md:col-span-3 md:flex">
          <span className="eyebrow">Scroll</span>
          <span className="relative block h-12 w-px overflow-hidden bg-line">
            <span className="absolute inset-x-0 top-0 h-1/2 animate-[scrollcue_2s_var(--ease-in-out-quart)_infinite] bg-bone" />
          </span>
        </FadeUp>
      </div>
    </section>
  );
}
