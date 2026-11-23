import type { Metadata } from 'next';
import { CAPABILITIES, EDUCATION, INTERESTS, PROJECTS, SITE } from '@/content/site';
import { PrintButton } from '@/components/ui/PrintButton';

export const metadata: Metadata = {
  title: 'CV',
  description: `One-page CV of ${SITE.fullName}.`,
  alternates: { canonical: '/cv' },
};

/** A calm, print-perfect résumé. On screen it's a paper sheet; Ctrl/⌘+P gives a clean A4 PDF. */
export default function CvPage() {
  return (
    <div className="container-x pb-24 pt-[calc(var(--header-h)+3rem)] print:p-0">
      <div className="no-print mx-auto mb-6 flex max-w-[52rem] items-center justify-between">
        <p className="eyebrow">Curriculum vitae</p>
        <PrintButton />
      </div>
      <article className="mx-auto max-w-[52rem] rounded-xl bg-[#faf8f4] p-8 text-[#16130f] shadow-2xl shadow-black/50 md:p-14 print:max-w-none print:rounded-none print:p-0 print:shadow-none">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-black/15 pb-6">
          <div>
            <h1 className="text-4xl font-semibold tracking-[-0.04em]">{SITE.fullName}</h1>
            <p className="mt-1 text-lg text-black/65">{SITE.roleLong}</p>
          </div>
          <div className="text-right text-sm leading-relaxed text-black/70">
            <p>{SITE.location}</p>
            <p>{SITE.email}</p>
            <p>github.com/gangulmissaka</p>
          </div>
        </header>

        <Section title="Profile">
          <p>{SITE.description.replace('Gangul Missaka is a s', 'A s')}</p>
        </Section>

        <Section title="Education">
          {EDUCATION.map((e) => (
            <div key={e.where} className="flex justify-between gap-4">
              <p><strong className="font-semibold">{e.where}</strong>, {e.what}</p>
              <p className="shrink-0 text-black/55">{e.when}</p>
            </div>
          ))}
        </Section>

        <Section title="Projects">
          <div className="space-y-4">
            {PROJECTS.map((p) => (
              <div key={p.slug} className="break-inside-avoid">
                <div className="flex justify-between gap-4">
                  <p><strong className="font-semibold">{p.title}</strong>: {p.kicker}</p>
                  <p className="shrink-0 text-black/55">{p.year}</p>
                </div>
                <p className="text-black/75">{p.summary}</p>
                <p className="mt-0.5 text-sm text-black/55">{p.stack.join(' · ')}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Skills">
          <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
            {CAPABILITIES.map((c) => (
              <p key={c.title}><strong className="font-semibold">{c.title}:</strong> <span className="text-black/75">{c.items.join(', ')}</span></p>
            ))}
          </div>
        </Section>

        <Section title="Interests">
          <p className="text-black/75">{INTERESTS.join(' · ')}</p>
        </Section>
      </article>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-3 border-b border-black/10 py-6 text-[0.95rem] leading-relaxed last:border-0 md:grid-cols-[9rem_1fr]">
      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-black/50">{title}</h2>
      <div>{children}</div>
    </section>
  );
}
