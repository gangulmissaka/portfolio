import type { Metadata } from 'next';
import { ViewTransition } from 'react';
import { PROJECTS } from '@/content/site';
import { PageHeader } from '@/components/ui/PageHeader';
import { WorkList } from '@/components/work/WorkList';
import { pageTransition } from '@/lib/transitions';

export const metadata: Metadata = {
  title: 'Work',
  description: 'Games, desktop apps, web platforms and networks: every project by Gangul Missaka, with case studies.',
  alternates: { canonical: '/work' },
};

export default function WorkPage() {
  return (
    <ViewTransition {...pageTransition}>
      <div>
        <PageHeader
          eyebrow={`Index · ${PROJECTS.length} projects`}
          title={<>Selected <span className="serif-i text-ember">work</span></>}
          intro="Games that listen, desktop apps people actually download, and the networks and websites in between. Hover a project to preview it; open one for the full story."
        />
        <section className="container-x pb-32" aria-label="Projects">
          <WorkList projects={PROJECTS} />
        </section>
      </div>
    </ViewTransition>
  );
}
