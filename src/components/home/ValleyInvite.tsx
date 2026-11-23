import { SITE } from '@/content/site';
import { FadeUp, SplitReveal } from '@/components/motion/Reveal';
import { Magnetic } from '@/components/ui/Magnetic';
import { RollText } from '@/components/motion/RollText';

/**
 * An invitation to the old 3D portfolio. It's a plain link to a separate site, so none of the 3D models,
 * physics or textures are downloaded until someone actually clicks it.
 */
export function ValleyInvite() {
  return (
    <section id="valley" className="container-x pb-28" aria-labelledby="valley-title">
      <div className="relative overflow-hidden rounded-[1.8rem] border border-line">
        {/* code-drawn scenery: no images, no WebGL */}
        <div aria-hidden className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #10180f 0%, #1c2a16 55%, #2f3f1d 100%)' }} />
        <div
          aria-hidden
          className="absolute inset-x-[-10%] bottom-[-30%] h-[80%] opacity-50 [transform:perspective(600px)_rotateX(62deg)]"
          style={{ backgroundImage: 'linear-gradient(rgb(240 220 170 / .14) 1px, transparent 1px), linear-gradient(90deg, rgb(240 220 170 / .14) 1px, transparent 1px)', backgroundSize: '48px 48px' }}
        />
        <svg aria-hidden viewBox="0 0 1200 300" preserveAspectRatio="none" className="absolute inset-x-0 top-[18%] h-[45%] w-full opacity-70">
          <path d="M0 220 L80 150 L140 190 L230 90 L320 170 L420 110 L520 190 L600 120 L700 180 L820 80 L920 170 L1010 120 L1100 180 L1200 130 L1200 300 L0 300Z" fill="#0d140c" />
          <path d="M0 260 L120 200 L220 240 L360 180 L480 240 L640 190 L780 245 L940 195 L1080 240 L1200 210 L1200 300 L0 300Z" fill="#132011" />
        </svg>
        <div aria-hidden className="absolute right-[12%] top-[14%] size-16 rounded-full bg-[#ffd9a0] opacity-80 blur-[2px] shadow-[0_0_80px_30px_rgb(255_200_120/0.25)]" />

        <div className="relative grid gap-10 p-8 md:grid-cols-12 md:items-end md:p-14">
          <div className="md:col-span-7">
            <p className="eyebrow !text-[#d8e6c4]/70">(05) Take the scenic route</p>
            <SplitReveal as="h2" className="h-lg mt-5 max-w-[18ch] text-bone">
              <span id="valley-title">Prefer to <span className="serif-i text-ember">explore</span>? Drive through my 3D world.</span>
            </SplitReveal>
            <FadeUp as="p" className="lead mt-6 max-w-[46ch] !text-[#e4ecd8]/80">
              My previous portfolio is a little open world: drive a 1939 car around a valley, knock over my name, and find each
              project in its own house. Same work, more play.
            </FadeUp>
          </div>
          <FadeUp className="flex flex-col items-start gap-4 md:col-span-5 md:items-end">
            <Magnetic>
              <a href={SITE.valleyUrl} className="btn btn-solid h-16 px-8 text-base" data-cursor="Drive">
                <span aria-hidden>🚗</span> <RollText>Enter the 3D world</RollText>
              </a>
            </Magnetic>
            <p className="max-w-[34ch] text-sm text-[#d8e6c4]/70 md:text-right">
              Loads about 20&nbsp;MB of 3D models when you open it. Best on a laptop or desktop with a decent graphics card.
            </p>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
