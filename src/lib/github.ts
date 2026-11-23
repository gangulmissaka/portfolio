import { cacheLife } from 'next/cache';

export type GithubSnapshot = { repos: number; latest: { name: string; url: string; pushedAt: string; description: string | null } | null };

/** Public GitHub activity, cached for hours so the page stays static and we never hit rate limits. */
export async function getGithubSnapshot(): Promise<GithubSnapshot> {
  'use cache';
  cacheLife('hours');
  try {
    const headers: Record<string, string> = { accept: 'application/vnd.github+json', 'user-agent': 'portfolio-site' };
    if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const res = await fetch('https://api.github.com/users/gangulmissaka/repos?per_page=100&sort=pushed', { headers });
    if (!res.ok) throw new Error(`GitHub ${res.status}`);
    const repos = (await res.json()) as { name: string; html_url: string; pushed_at: string; description: string | null; fork: boolean }[];
    const own = repos.filter((r) => !r.fork && r.name !== 'gangulmissaka.github.io');
    const top = own[0];
    return {
      repos: repos.filter((r) => !r.fork).length,
      latest: top ? { name: top.name, url: top.html_url, pushedAt: top.pushed_at, description: top.description } : null,
    };
  } catch (e) {
    console.warn('[github]', (e as Error).message);
    return { repos: 0, latest: null };
  }
}
