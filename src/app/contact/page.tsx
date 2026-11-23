import type { Metadata } from 'next';
import { ViewTransition } from 'react';
import { SITE } from '@/content/site';
import { PageHeader } from '@/components/ui/PageHeader';
import { ContactForm } from '@/components/contact/ContactForm';
import { CopyEmail } from '@/components/ui/CopyEmail';
import { LocalTime } from '@/components/ui/LocalTime';
import { FadeUp } from '@/components/motion/Reveal';
import { pageTransition } from '@/lib/transitions';

export const metadata: Metadata = {
  title: 'Contact',
  description: `Get in touch with ${SITE.name} about internships, graduate roles or projects.`,
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <ViewTransition {...pageTransition}>
      <div>
        <PageHeader
          eyebrow="Contact"
          title={<>Say <span className="serif-i text-ember">hello</span></>}
          intro="Internships, graduate roles, a project, or just a question about something I built. I read every message and usually reply within two days."
        />
        <section className="container-x grid gap-16 pb-32 md:grid-cols-12">
          <div className="md:col-span-7">
            <ContactForm turnstileSiteKey={process.env.TURNSTILE_SECRET_KEY ? process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY : undefined} />
          </div>
          <aside className="flex flex-col gap-10 md:col-span-4 md:col-start-9">
            <FadeUp>
              <p className="eyebrow mb-3">Email</p>
              <CopyEmail className="link-u text-left text-xl" />
            </FadeUp>
            <FadeUp delay={0.05}>
              <p className="eyebrow mb-3">Elsewhere</p>
              <ul className="space-y-2">
                {SITE.socials.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noreferrer" className="group flex items-baseline justify-between border-b border-line py-2">
                      <span className="text-lg">{s.label}</span>
                      <span className="text-sm text-mute transition-colors group-hover:text-ember">{s.handle} ↗</span>
                    </a>
                  </li>
                ))}
              </ul>
            </FadeUp>
            <FadeUp delay={0.1}>
              <p className="eyebrow mb-3">Where & when</p>
              <p className="text-lg">{SITE.location}</p>
              <p className="text-mute"><LocalTime /></p>
            </FadeUp>
          </aside>
        </section>
      </div>
    </ViewTransition>
  );
}
