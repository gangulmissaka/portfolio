'use client';

import { useRef, type ElementType, type ReactNode, type CSSProperties } from 'react';
import { gsap, ScrollTrigger, SplitText, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import { onIntroDone } from '@/lib/intro';

type Common = { className?: string; style?: CSSProperties; delay?: number; children: ReactNode };

/**
 * Text that rises line by line out of a mask. `onIntro` waits for the preloader instead of scroll.
 */
export function SplitReveal({
  as: Tag = 'div',
  className,
  style,
  children,
  delay = 0,
  onIntro = false,
  stagger = 0.09,
  type = 'lines',
}: Common & { as?: ElementType; onIntro?: boolean; stagger?: number; type?: 'lines' | 'chars' | 'words' }) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (prefersReducedMotion()) {
        gsap.set(el, { visibility: 'visible' });
        return;
      }
      let unsub = () => {};
      const split = SplitText.create(el, {
        type: type === 'lines' ? 'lines' : `lines,${type}`,
        mask: 'lines',
        linesClass: 'split-line',
        charsClass: 'split-char',
        autoSplit: true,
        onSplit(self) {
          const targets = type === 'lines' ? self.lines : type === 'chars' ? self.chars : self.words;
          gsap.set(el, { visibility: 'visible' });
          const tween = gsap.from(targets, {
            yPercent: 110,
            rotate: type === 'chars' ? 4 : 0,
            duration: type === 'chars' ? 1.1 : 1.05,
            stagger: type === 'chars' ? 0.028 : stagger,
            delay,
            paused: true,
          });
          if (onIntro) {
            unsub = onIntroDone(() => tween.play());
          } else {
            ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => tween.play() });
          }
          return tween;
        },
      });
      return () => {
        unsub();
        split.revert();
      };
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} data-reveal className={className} style={style}>
      {children}
    </Tag>
  );
}

/** Block that drifts up and fades in when it enters the viewport. */
export function FadeUp({ as: Tag = 'div', className, style, children, delay = 0, y = 36, onIntro = false, ...rest }: Common & { as?: ElementType; y?: number; onIntro?: boolean; [data: `data-${string}`]: unknown }) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (prefersReducedMotion()) {
        gsap.set(el, { visibility: 'visible' });
        return;
      }
      const tween = gsap.fromTo(el, { autoAlpha: 0, y }, { autoAlpha: 1, y: 0, duration: 1.1, delay, paused: true });
      if (onIntro) return onIntroDone(() => tween.play());
      ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => tween.play() });
    },
    { scope: ref },
  );
  return (
    <Tag ref={ref} data-reveal className={className} style={style} {...rest}>
      {children}
    </Tag>
  );
}

/** Children (usually an image) unclip from the bottom and settle from a slight zoom. */
export function ImageReveal({ className, style, children, delay = 0, onIntro = false, from = 'bottom' }: Common & { onIntro?: boolean; from?: 'bottom' | 'left' }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const inner = el.firstElementChild;
      if (prefersReducedMotion()) {
        gsap.set(el, { visibility: 'visible' });
        return;
      }
      const tl = gsap.timeline({ paused: true, delay });
      tl.set(el, { visibility: 'visible' })
        .fromTo(el, { clipPath: from === 'bottom' ? 'inset(100% 0% 0% 0%)' : 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'quart' })
        .fromTo(inner, { scale: 1.25 }, { scale: 1, duration: 1.8, ease: 'expo' }, 0);
      if (onIntro) return onIntroDone(() => tl.play());
      ScrollTrigger.create({ trigger: el, start: 'top 85%', once: true, onEnter: () => tl.play() });
    },
    { scope: ref },
  );
  return (
    <div ref={ref} data-reveal className={className} style={style}>
      {children}
    </div>
  );
}

/** Moves its child against the scroll for depth. `amount` is a percentage of the child's height. */
export function Parallax({ className, style, children, amount = 12 }: Omit<Common, 'delay'> & { amount?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      gsap.fromTo(
        el.firstElementChild,
        { yPercent: -amount },
        { yPercent: amount, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } },
      );
    },
    { scope: ref },
  );
  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}

/** Paragraph whose words light up one by one as you scroll through it. */
export function ScrubWords({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      const words = el.querySelectorAll('[data-w]');
      gsap.fromTo(
        words,
        { opacity: 0.16 },
        { opacity: 1, ease: 'none', stagger: 0.1, scrollTrigger: { trigger: el, start: 'top 78%', end: 'bottom 45%', scrub: true } },
      );
    },
    { scope: ref },
  );
  return (
    <p ref={ref} className={className}>
      {text.split(' ').map((w, i) => (
        <span key={i}>
          <span data-w>
            {w}
          </span>{' '}
        </span>
      ))}
    </p>
  );
}
