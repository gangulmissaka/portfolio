import type { ReactNode } from 'react';
import { FadeUp, SplitReveal } from '@/components/motion/Reveal';

export function PageHeader({ eyebrow, title, intro, aside }: { eyebrow: string; title: ReactNode; intro?: ReactNode; aside?: ReactNode }) {
  return (
    <header className="container-x pb-16 pt-[calc(var(--header-h)+5rem)] md:pb-24 md:pt-[calc(var(--header-h)+8rem)]">
      <FadeUp onIntro className="eyebrow mb-6">{eyebrow}</FadeUp>
      <SplitReveal onIntro as="h1" className="display max-w-[14ch] text-[clamp(3.4rem,10vw,10rem)]">
        {title}
      </SplitReveal>
      {(intro || aside) && (
        <div className="mt-12 grid gap-8 md:grid-cols-12">
          {intro && <FadeUp onIntro delay={0.3} className="lead max-w-[48ch] md:col-span-6">{intro}</FadeUp>}
          {aside && <FadeUp onIntro delay={0.4} className="md:col-span-4 md:col-start-9">{aside}</FadeUp>}
        </div>
      )}
    </header>
  );
}
