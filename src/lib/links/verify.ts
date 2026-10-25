/**
 * Checks whether a page still links to an Ohmetry URL, and with which rel attribute.
 * Pure functions plus an injected fetcher, so the logic is testable without a network.
 * The command-line wrapper is scripts/verify-backlinks.mjs.
 *
 * The approach (fetch the source page, find anchors that point at the target, report rel and anchor text,
 * flag JS-rendered pages as unverifiable) follows verify_backlinks.py in AgriciDaniel/claude-seo (MIT).
 * This is a smaller, independent implementation with no dependencies.
 */

export interface PageLink { href: string; rel: string[]; text: string }
export interface FetchedPage { status: number | null; finalUrl: string; html: string; error?: string }
export type Fetcher = (url: string) => Promise<FetchedPage>;

export type LinkStatus = 'verified' | 'link_removed' | 'lost' | 'unverifiable_js' | 'error';
export interface LinkCheck {
  sourceUrl: string;
  targetUrl: string;
  status: LinkStatus;
  httpStatus: number | null;
  matchType: 'exact_url' | 'domain_match' | null;
  anchorText: string;
  /** 'follow' when the anchor has no nofollow, sponsored or ugc. Otherwise the qualifying values found. */
  rel: string[];
  redirectedTo: string | null;
  note: string;
}

const decode = (s: string) => s.replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/\s+/g, ' ').trim();

function attr(tag: string, name: string): string {
  const m = tag.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return m ? decode(m[1] ?? m[2] ?? m[3] ?? '') : '';
}

/** Every <a href> on the page, with relative links resolved against baseUrl. */
export function extractLinks(html: string, baseUrl: string): PageLink[] {
  const out: PageLink[] = [];
  for (const m of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const href = attr(m[1], 'href');
    if (!href || /^(mailto:|tel:|javascript:|#)/i.test(href)) continue;
    let abs: string;
    try { abs = new URL(href, baseUrl).href; } catch { continue; }
    if (!/^https?:/i.test(abs)) continue;
    out.push({ href: abs, rel: attr(m[1], 'rel').toLowerCase().split(/\s+/).filter(Boolean), text: decode(m[2].replace(/<[^>]+>/g, ' ')) });
  }
  return out;
}

const bareHost = (h: string) => h.toLowerCase().replace(/^www\./, '');

/** Lowercase host without www, no fragment or query, no trailing slash. */
export function normalizeUrl(url: string): string {
  const u = new URL(url);
  return `${bareHost(u.hostname)}${u.pathname.replace(/\/+$/, '')}`;
}

/** Find the first link that points at the target page, or at any page on the target's domain. */
export function findLink(links: PageLink[], targetUrl: string): { link: PageLink; matchType: 'exact_url' | 'domain_match' } | null {
  const target = normalizeUrl(targetUrl);
  const host = bareHost(new URL(targetUrl).hostname);
  let domainMatch: PageLink | null = null;
  for (const l of links) {
    let n: string; let h: string;
    try { n = normalizeUrl(l.href); h = bareHost(new URL(l.href).hostname); } catch { continue; }
    if (n === target) return { link: l, matchType: 'exact_url' };
    if (!domainMatch && h === host) domainMatch = l;
  }
  return domainMatch ? { link: domainMatch, matchType: 'domain_match' } : null;
}

/** The qualifying rel values on a link, or ['follow'] when there are none. */
export function relSummary(rel: string[]): string[] {
  const q = rel.filter((r) => r === 'nofollow' || r === 'sponsored' || r === 'ugc');
  return q.length ? q : ['follow'];
}

/** A page whose links are probably added by JavaScript, so a missing link proves nothing. */
export function looksJsRendered(html: string): boolean {
  const shell = ['<div id="root"', '<div id="app"', '<div id="__next"', '__NEXT_DATA__', '__nuxt', 'ng-app=', 'ng-version=', 'data-reactroot'];
  const lower = html.toLowerCase();
  const visible = html.replace(/<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>|<[^>]+>/gi, ' ').split(/\s+/).filter(Boolean).length;
  return shell.some((s) => lower.includes(s.toLowerCase())) || (html.length > 5000 && visible < 50);
}

/** True for hosts and IP literals a link checker must never contact. */
export function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (!h || h === 'localhost' || /\.(local|localhost|internal|lan|home|test)$/.test(h)) return true;
  const v4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    return [Number(v4[1]), Number(v4[2]), Number(v4[3]), Number(v4[4])].some((n) => n > 255)
      || a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31)
      || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  if (h.includes(':')) return h === '::1' || h === '::' || /^f[cd]/.test(h) || /^fe[89ab]/.test(h) || h.startsWith('::ffff:');
  return !h.includes('.');
}

export function isCheckableUrl(url: string): boolean {
  try { const u = new URL(url); return /^https?:$/.test(u.protocol) && !u.username && !u.password && !isBlockedHost(u.hostname); } catch { return false; }
}

export async function verifyLink(sourceUrl: string, targetUrl: string, fetchPage: Fetcher): Promise<LinkCheck> {
  const base: LinkCheck = { sourceUrl, targetUrl, status: 'error', httpStatus: null, matchType: null, anchorText: '', rel: [], redirectedTo: null, note: '' };
  if (!isCheckableUrl(sourceUrl)) return { ...base, note: 'Source URL is not a public http(s) address.' };
  const page = await fetchPage(sourceUrl);
  const redirectedTo = page.finalUrl && page.finalUrl !== sourceUrl ? page.finalUrl : null;
  const r = { ...base, httpStatus: page.status, redirectedTo };
  if (page.error) return { ...r, note: page.error };
  if (page.status === 404 || page.status === 410) return { ...r, status: 'lost', note: 'The page no longer exists.' };
  if (page.status === null || page.status < 200 || page.status >= 300) return { ...r, note: `Unexpected HTTP status ${page.status}.` };
  const hit = findLink(extractLinks(page.html, page.finalUrl || sourceUrl), targetUrl);
  if (hit) return { ...r, status: 'verified', matchType: hit.matchType, anchorText: hit.link.text.slice(0, 200), rel: relSummary(hit.link.rel) };
  if (looksJsRendered(page.html)) return { ...r, status: 'unverifiable_js', note: 'Page looks JavaScript-rendered; the link may exist but cannot be confirmed from the HTML.' };
  return { ...r, status: 'link_removed', note: 'No link to the target in the fetched HTML.' };
}
