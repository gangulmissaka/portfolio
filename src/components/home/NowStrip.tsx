import { getGithubSnapshot } from '@/lib/github';
import { INTERESTS, SITE } from '@/content/site';
import { LocalTime } from '@/components/ui/LocalTime';
import { FadeUp } from '@/components/motion/Reveal';
import { RelativeTime } from '@/components/ui/RelativeTime';
import { Spotlight } from '@/components/motion/Spotlight';

/** "Right now": small live facts that make the site feel inhabited. GitHub data is cached for hours. */
export async function NowStrip() {
  const gh = await getGithubSnapshot();
  const cells = [
    {
      k: 'Local time',
      v: <LocalTime className="text-2xl" />,
      sub: SITE.location,
    },
    {
      k: 'Latest push',
      v: gh.latest ? (
        <a href={gh.latest.url} target="_blank" rel="noreferrer" className="link-u text-2xl">
          {gh.latest.name}
        </a>
      ) : (
        <a href="https://github.com/gangulmissaka" target="_blank" rel="noreferrer" className="link-u text-2xl">github.com/gangulmissaka</a>
      ),
      sub: gh.latest ? <RelativeTime iso={gh.latest.pushedAt} prefix="Pushed " /> : 'Public repositories',
    },
    { k: 'Status', v: <span className="flex items-center gap-2 text-2xl"><span className="dot-live" /> Available</span>, sub: SITE.availability },
    { k: 'Exploring', v: <span className="text-2xl">{INTERESTS[0]}</span>, sub: gh.repos ? `${gh.repos} public repositories` : 'and machine learning' },
  ];
  return (
    <section id="now" className="container-x py-24 md:py-32" aria-labelledby="now-title">
      <div className="mb-10 flex items-end justify-between">
        <h2 id="now-title" className="eyebrow">Right now</h2>
        <span className="eyebrow hidden md:block">Live · updated automatically</span>
      </div>
      <Spotlight className="grid gap-px overflow-hidden rounded-[1.4rem] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {cells.map((c, i) => (
          <FadeUp key={c.k} delay={i * 0.08} className="flex min-h-48 flex-col justify-between bg-ink p-6 md:p-8" data-spot>
            <p className="eyebrow">{c.k}</p>
            <div>
              <div className="font-medium tracking-tight">{c.v}</div>
              <p className="mt-1 text-sm text-mute">{c.sub}</p>
            </div>
          </FadeUp>
        ))}
      </Spotlight>
    </section>
  );
}
