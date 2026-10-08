// Checks the built site (dist/) for SEO mistakes. Run after a build:  npm run build && npm run seo
// Failures stop the deploy. Warnings are printed for a human to judge.
import fs from 'node:fs';
import path from 'node:path';

const dist = path.join(process.cwd(), 'dist');
const SITE = (process.env.SITE_URL || 'https://ohmetry.com').replace(/\/$/, '');
const fail = [];
const warn = [];

const pages = [];
(function walk(d, rel = '') {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.isDirectory()) { if (e.name !== '_astro') walk(path.join(d, e.name), path.join(rel, e.name)); }
    else if (e.name.endsWith('.html')) pages.push(path.join(rel, e.name));
  }
})(dist);

const urlOf = (file) => (file === 'index.html' ? '/' : file.endsWith('/index.html') ? '/' + file.slice(0, -'index.html'.length) : '/' + file);
const attr = (html, re) => (html.match(re) || [])[1];
const titles = new Map();
const indexable = new Set();
const noindexed = new Set();

for (const file of pages) {
  const url = urlOf(file);
  const html = fs.readFileSync(path.join(dist, file), 'utf8');
  const at = (msg, list = fail) => list.push(`${url}: ${msg}`);
  const is404 = file === '404.html';
  const noindex = /<meta name="robots" content="[^"]*noindex/.test(html);
  (noindex || is404 ? noindexed : indexable).add(url);

  const title = attr(html, /<title>([^<]*)<\/title>/);
  if (!title) at('missing <title>');
  else {
    if (title.length > 70) at(`title is ${title.length} characters (over 70)`, warn);
    if (!is404) { if (titles.has(title)) at(`duplicate title, also on ${titles.get(title)}`); else titles.set(title, url); }
  }
  const desc = attr(html, /<meta name="description" content="([^"]*)"/);
  if (!desc) at('missing meta description');
  else if (desc.length < 50 || desc.length > 170) at(`description is ${desc.length} characters (aim for 50 to 170)`, warn);

  const canonical = attr(html, /<link rel="canonical" href="([^"]*)"/);
  if (!canonical) at('missing canonical');
  else if (!is404 && canonical !== SITE + url) at(`canonical is ${canonical}, expected ${SITE + url}`);

  const h1s = (html.match(/<h1[\s>]/g) || []).length;
  if (h1s !== 1) at(`${h1s} <h1> elements (expected 1)`);

  const og = attr(html, /<meta property="og:image" content="([^"]*)"/);
  if (!og) at('missing og:image');
  else {
    const local = og.replace(SITE, '');
    if (!fs.existsSync(path.join(dist, local))) at(`og:image file not found: ${local}`);
  }

  for (const m of html.matchAll(/<img\b[^>]*>/g)) if (!/\balt=/.test(m[0])) at('image without alt text', warn);

  for (const m of html.matchAll(/<a\b[^>]*\bhref="(\/[^"]*)"/g)) {
    const href = m[1];
    if (href.startsWith('//')) continue;
    const clean = href.split('#')[0].split('?')[0];
    if (!clean) continue;
    const target = clean.endsWith('/') ? path.join(dist, clean, 'index.html') : path.join(dist, clean);
    if (!fs.existsSync(target)) at(`broken internal link ${href}`);
  }

  if (!noindex && !is404) {
    const words = html.replace(/<(script|style)[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
    if (words < 300) at(`only ${words} words`, warn);
  }
}

// Sitemap must list every indexable page and no noindex page.
const sitemapFiles = fs.readdirSync(dist).filter((f) => /^sitemap-\d+\.xml$/.test(f));
const inSitemap = new Set();
for (const f of sitemapFiles) for (const m of fs.readFileSync(path.join(dist, f), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)) inSitemap.add(m[1].replace(SITE, ''));
if (!sitemapFiles.length) fail.push('no sitemap-N.xml in dist');
for (const u of indexable) if (!inSitemap.has(u)) fail.push(`${u}: indexable but missing from the sitemap`);
for (const u of noindexed) if (inSitemap.has(u)) fail.push(`${u}: noindex but listed in the sitemap`);

const robots = fs.existsSync(path.join(dist, 'robots.txt')) ? fs.readFileSync(path.join(dist, 'robots.txt'), 'utf8') : '';
if (!/Sitemap:\s*\S+/.test(robots)) fail.push('robots.txt has no Sitemap line');

console.log(`Checked ${pages.length} pages (${indexable.size} indexable, ${noindexed.size} noindex).`);
for (const w of warn) console.log('warn: ' + w);
for (const f of fail) console.log('FAIL: ' + f);
console.log(`${fail.length} failure(s), ${warn.length} warning(s).`);
// On GitHub Actions, also show the result as a readable summary on the run page.
if (process.env.GITHUB_STEP_SUMMARY) {
  const lines = [
    '## SEO audit', '',
    `**${fail.length ? 'FAILED' : 'Passed'}.** ${pages.length} pages checked (${indexable.size} indexable, ${noindexed.size} noindex). ${fail.length} failure(s), ${warn.length} warning(s).`, '',
  ];
  if (fail.length) lines.push('### Failures', '', ...fail.map((f) => `- ${f}`), '');
  if (warn.length) lines.push('### Warnings', '', ...warn.map((w) => `- ${w}`), '');
  lines.push('Checks: title, description, canonical, one h1, og:image, broken internal links, sitemap against noindex.');
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join('\n') + '\n');
}
process.exit(fail.length ? 1 : 0);
