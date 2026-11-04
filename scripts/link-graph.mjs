// Internal link report from the built site (dist/). Run after a build:  npm run build && npm run links:graph
// Writes docs/seo/link-graph.md. Read-only: it never changes a page.
// "Body" links are links inside <article> (written by a person for the reader). Nav, footer and hub-card links are counted separately,
// because sitewide links do not tell a search engine which pages are related.
import fs from 'node:fs';
import path from 'node:path';

const dist = path.join(process.cwd(), 'dist');
const SITE = (process.env.SITE_URL || 'https://ohmetry.com').replace(/\/$/, '');
const pages = [];
(function walk(d, rel = '') {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.isDirectory()) { if (e.name !== '_astro' && e.name !== 'downloads' && e.name !== 'og') walk(path.join(d, e.name), path.join(rel, e.name)); }
    else if (e.name.endsWith('.html') && e.name !== '404.html') pages.push(path.join(rel, e.name));
  }
})(dist);

const urlOf = (f) => (f === 'index.html' ? '/' : '/' + f.slice(0, -'index.html'.length));
const norm = (href, from) => {
  if (!href || href.startsWith('#') || /^(mailto:|tel:|javascript:)/i.test(href)) return null;
  let u;
  try { u = new URL(href, SITE + from); } catch { return null; }
  if (u.origin !== SITE) return null;
  let p = u.pathname; if (!p.endsWith('/') && !path.extname(p)) p += '/';
  return p;
};
const data = new Map();
for (const f of pages) {
  const url = urlOf(f);
  const html = fs.readFileSync(path.join(dist, f), 'utf8');
  const noindex = /<meta name="robots" content="[^"]*noindex/.test(html);
  const title = (html.match(/<title>([^<]*)/) || [])[1] || '';
  const article = (html.match(/<article[\s\S]*?<\/article>/) || [''])[0];
  const links = (s) => [...s.matchAll(/<a\s[^>]*href="([^"]*)"/g)].map((m) => norm(m[1], url)).filter((x) => x && x !== url);
  data.set(url, { url, title, noindex, all: new Set(links(html)), body: new Set(links(article)) });
}
const rows = [...data.values()].filter((p) => !p.noindex).map((p) => {
  const inAll = [...data.values()].filter((q) => q.url !== p.url && q.all.has(p.url)).length;
  const inBody = [...data.values()].filter((q) => q.url !== p.url && q.body.has(p.url)).length;
  return { url: p.url, title: p.title, inAll, inBody, outBody: [...p.body].filter((u) => data.has(u)).length };
});
const broken = [];
for (const p of data.values()) for (const u of p.all) if (!data.has(u) && !fs.existsSync(path.join(dist, u.slice(1)))) broken.push(`${p.url} -> ${u}`);

// A target linked from most pages' article text is boilerplate (the report line, the toolkit box), not editorial linking.
const sitewide = new Set(rows.filter((r) => r.inBody >= rows.length * 0.4).map((r) => r.url));
rows.sort((a, b) => a.inBody - b.inBody || a.url.localeCompare(b.url));
const weak = rows.filter((r) => r.inBody < 3);
const out = [];
out.push('# Internal link report', '', `Built site: ${rows.length} indexable pages. Generated ${new Date().toISOString().slice(0, 10)}.`, '',
  'Body links are links inside the article text. Total links include the nav, footer and hub cards. A page with few body links has few pages telling a search engine, and a reader, that it is relevant.', '',
  `## Pages with fewer than 3 body links pointing to them (${weak.length})`, '', '| Page | Body inbound | Total inbound | Body outbound |', '|---|---|---|---|',
  ...weak.map((r) => `| ${r.url} | ${r.inBody} | ${r.inAll} | ${r.outBody} |`), '',
  `## Pages with no body links pointing to them (${rows.filter((r) => r.inBody === 0).length})`, '',
  ...rows.filter((r) => r.inBody === 0).map((r) => `- ${r.url} (total inbound ${r.inAll})`), '',
  `## Broken internal links (${broken.length})`, '', ...(broken.length ? broken.map((b) => `- ${b}`) : ['None.']), '',
  '## All pages', '', '| Page | Body inbound | Total inbound | Body outbound |', '|---|---|---|---|',
  ...rows.slice().sort((a, b) => b.inBody - a.inBody).map((r) => `| ${r.url}${sitewide.has(r.url) ? ' (sitewide boilerplate)' : ''} | ${r.inBody} | ${r.inAll} | ${r.outBody} |`), '');
fs.writeFileSync('docs/seo/link-graph.md', out.join('\n'));
console.log(`${rows.length} indexable pages, ${weak.length} with fewer than 3 body links in, ${broken.length} broken internal links. Wrote docs/seo/link-graph.md`);
