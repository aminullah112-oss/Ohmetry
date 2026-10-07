/** Date a page's source file last changed in git (YYYY-MM-DD), or null when history is unavailable. */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const cache = new Map<string, string | null>();

export function lastUpdated(slug: string): string | null {
  if (cache.has(slug)) return cache.get(slug)!;
  const candidates = [`src/pages/${slug}/index.mdx`, `src/pages/${slug}/index.astro`, `src/pages/${slug}.astro`];
  const file = candidates.find((f) => fs.existsSync(path.join(process.cwd(), f)));
  let out: string | null = null;
  if (file) {
    try {
      const d = execFileSync('git', ['log', '-1', '--format=%cs', '--', file], { cwd: process.cwd(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
      out = /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;
    } catch { out = null; }
  }
  cache.set(slug, out);
  return out;
}

/** Page slug from a URL pathname, ignoring the deployment base path. */
export function slugFromPath(pathname: string, base: string): string {
  const b = base.replace(/\/$/, '');
  return pathname.replace(b, '').replace(/^\/|\/$/g, '');
}
