import type { MetadataRoute } from 'next';
import { PROJECTS, SITE } from '@/content/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ['', '/work', '/about', '/contact', '/guestbook', '/cv'].map((p) => ({ url: `${SITE.url}${p}`, changeFrequency: 'monthly' as const, priority: p === '' ? 1 : 0.8 }));
  const work = PROJECTS.map((p) => ({ url: `${SITE.url}/work/${p.slug}`, changeFrequency: 'yearly' as const, priority: p.featured ? 0.9 : 0.6 }));
  return [...pages, ...work];
}
