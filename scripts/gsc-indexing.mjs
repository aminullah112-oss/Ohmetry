// Asks Google, through the Search Console URL Inspection API, whether each page in the sitemap is indexed.
// Writes docs/seo/indexing.json and docs/seo/indexing.md. Needs the GSC_SERVICE_ACCOUNT secret (the service-account
// JSON, which must be a user of the property). Skips quietly if it is missing. Read-only: it never requests indexing.
import crypto from 'node:crypto';
import fs from 'node:fs';

const SITE = process.env.GSC_SITE || 'sc-domain:ohmetry.com';
const ORIGIN = process.env.SITE_ORIGIN || 'https://ohmetry.com';
const locs = (xml) => [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);

async function sitemapUrls() {
  const read = async (u) => (process.env.SITEMAP_FILE ? fs.readFileSync(process.env.SITEMAP_FILE, 'utf8') : (await fetch(u)).text());
  const first = locs(await read(`${ORIGIN}/sitemap-index.xml`));
  if (process.env.SITEMAP_FILE) return first;
  const urls = [];
  for (const l of first) urls.push(...(l.endsWith('.xml') ? locs(await read(l)) : [l]));
  return [...new Set(urls)];
}

const urls = await sitemapUrls();
if (process.env.DRY_RUN) { console.log(`Dry run: ${urls.length} URLs`, urls.slice(0, 3)); process.exit(0); }

const raw = process.env.GSC_SERVICE_ACCOUNT;
if (!raw) { console.log('GSC_SERVICE_ACCOUNT is not set, skipping.'); process.exit(0); }
const sa = JSON.parse(raw);
const b64 = (o) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');
const now = Math.floor(Date.now() / 1000);
const unsigned = b64({ alg: 'RS256', typ: 'JWT' }) + '.' + b64({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/webmasters.readonly', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
const jwt = unsigned + '.' + crypto.createSign('RSA-SHA256').update(unsigned).sign(sa.private_key, 'base64url');
const tok = await (await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }) })).json();
if (!tok.access_token) { console.error('Token request failed:', JSON.stringify(tok)); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function inspect(url) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
      method: 'POST', headers: { authorization: `Bearer ${tok.access_token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ inspectionUrl: url, siteUrl: SITE, languageCode: 'en-US' }),
    });
    if (r.status === 429 || r.status >= 500) { await sleep(2000 * (attempt + 1)); continue; }
    const j = await r.json();
    if (!r.ok) return { url, error: j.error?.message || `HTTP ${r.status}` };
    const s = j.inspectionResult?.indexStatusResult || {};
    return { url, verdict: s.verdict, coverage: s.coverageState, crawled: s.lastCrawlTime?.slice(0, 10), fetch: s.pageFetchState, robots: s.robotsTxtState, indexing: s.indexingState, googleCanonical: s.googleCanonical, userCanonical: s.userCanonical };
  }
  return { url, error: 'too many retries' };
}

const results = [];
for (const u of urls) { results.push(await inspect(u)); await sleep(400); }

const errors = results.filter((r) => r.error);
if (errors.length === results.length) { console.error('Every inspection failed. First error:', errors[0].error); process.exit(1); }
const indexed = results.filter((r) => r.verdict === 'PASS');
const rest = results.filter((r) => !r.error && r.verdict !== 'PASS');
const date = new Date().toISOString().slice(0, 10);
const path = (u) => u.replace(ORIGIN, '') || '/';
const md = [
  '# Indexing status (URL Inspection API)', '', `Site: ${SITE}. Checked ${date}. ${results.length} sitemap URLs: ${indexed.length} indexed, ${rest.length} not indexed, ${errors.length} could not be checked.`, '',
  '## Not indexed', '', '| Page | Status | Last crawl | Page fetch |', '|---|---|---|---|',
  ...rest.map((r) => `| ${path(r.url)} | ${r.coverage || r.verdict || 'unknown'} | ${r.crawled || 'never'} | ${r.fetch || ''} |`), '',
  '## Indexed with a different Google canonical', '', ...(indexed.filter((r) => r.googleCanonical && r.userCanonical && r.googleCanonical !== r.userCanonical).map((r) => `- ${path(r.url)}: Google chose ${r.googleCanonical}`)), '',
  ...(errors.length ? ['## Could not be checked', '', ...errors.map((r) => `- ${path(r.url)}: ${r.error}`), ''] : []),
  '## Indexed', '', ...indexed.map((r) => `- ${path(r.url)} (last crawl ${r.crawled || 'unknown'})`), '',
];
fs.mkdirSync('docs/seo', { recursive: true });
fs.writeFileSync('docs/seo/indexing.json', JSON.stringify({ checked: date, site: SITE, total: results.length, indexed: indexed.length, results }, null, 1));
fs.writeFileSync('docs/seo/indexing.md', md.join('\n'));
console.log(`indexing: ${indexed.length} indexed, ${rest.length} not indexed, ${errors.length} errors, of ${results.length}`);
