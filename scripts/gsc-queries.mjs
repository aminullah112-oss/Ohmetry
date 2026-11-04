// Pulls Search Console data with query AND page together (last 28 days) and writes an opportunity report.
// Read-only. Needs the GSC_SERVICE_ACCOUNT secret; skips quietly if it is missing.
//   node --experimental-strip-types scripts/gsc-queries.mjs
// Test without credentials: FIXTURE=path/to/rows.json OUT_DIR=somewhere node --experimental-strip-types scripts/gsc-queries.mjs
// Outputs (in OUT_DIR, default docs/seo): query-page-report.md, query-page-latest.json, query-top10-history.json
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { cannibalised, lowCtrPages, pageSummaries, strikingDistance, trackTop10 } from '../src/lib/seo/gsc-analysis.ts';

const SITE = process.env.GSC_SITE || 'sc-domain:ohmetry.com';
const OUT = process.env.OUT_DIR || 'docs/seo';
const day = (d) => new Date(Date.now() - d * 864e5).toISOString().slice(0, 10);
const start = day(30), end = day(2);

async function fetchRows() {
  if (process.env.FIXTURE) return JSON.parse(fs.readFileSync(process.env.FIXTURE, 'utf8'));
  const raw = process.env.GSC_SERVICE_ACCOUNT;
  if (!raw) { console.log('GSC_SERVICE_ACCOUNT is not set, skipping.'); process.exit(0); }
  const sa = JSON.parse(raw);
  const b64 = (o) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const unsigned = b64({ alg: 'RS256', typ: 'JWT' }) + '.' + b64({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/webmasters.readonly', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
  const jwt = unsigned + '.' + crypto.createSign('RSA-SHA256').update(unsigned).sign(sa.private_key, 'base64url');
  const tok = await (await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }) })).json();
  if (!tok.access_token) { console.error('Token request failed:', JSON.stringify(tok)); process.exit(1); }
  const rows = [];
  for (let startRow = 0; startRow < 100000; startRow += 25000) {
    const r = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE)}/searchAnalytics/query`, {
      method: 'POST', headers: { authorization: `Bearer ${tok.access_token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ startDate: start, endDate: end, dimensions: ['query', 'page'], rowLimit: 25000, startRow }),
    });
    const j = await r.json();
    if (!r.ok) { console.error('Search Console error:', JSON.stringify(j)); process.exit(1); }
    const got = j.rows || [];
    for (const x of got) rows.push({ query: x.keys[0], page: x.keys[1].replace(/^https?:\/\/(www\.)?ohmetry\.com/, ''), clicks: x.clicks, impressions: x.impressions, position: x.position });
    if (got.length < 25000) break;
  }
  return rows;
}

const rows = await fetchRows();
fs.mkdirSync(OUT, { recursive: true });
const histFile = path.join(OUT, 'query-top10-history.json');
const history = fs.existsSync(histFile) ? JSON.parse(fs.readFileSync(histFile, 'utf8')) : [];
const previous = history.length ? history[history.length - 1] : null;

const sd = strikingDistance(rows);
const cn = cannibalised(rows);
const t10 = trackTop10(rows, previous);
const pages = pageSummaries(rows);
const low = lowCtrPages(pages);
const totalImpr = rows.reduce((a, r) => a + r.impressions, 0);
const f1 = (n) => n.toFixed(1);
const tbl = (head, body) => [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...body.map((b) => `| ${b.join(' | ')} |`)];

const md = [
  '# Search Console: queries by page', '',
  `Site: ${SITE}. Date range: ${start} to ${end}. Generated ${new Date().toISOString().slice(0, 10)}.`, '',
  `${rows.length} query and page pairs with ${totalImpr} impressions. Google leaves out rare queries for privacy, so the totals are lower than the Performance report.`, '',
  'Position is the Search Console average over the date range. It is not a rank for every user, device or country. A pair is counted as top 10 only when that average is 10 or better with at least 3 impressions.', '',
  '## Striking distance (average position 4 to 20, at least 3 impressions)', '',
  ...(sd.length ? tbl(['Query', 'Page', 'Impressions', 'Clicks', 'Position'], sd.slice(0, 40).map((r) => [r.query, r.page, r.impressions, r.clicks, f1(r.position)])) : ['None.']), '',
  '## Two of your pages showing for the same query (at least 5 impressions each)', '',
  ...(cn.length ? tbl(['Query', 'Pages (impressions, position)'], cn.slice(0, 25).map((c) => [c.query, c.pages.map((p) => `${p.page} (${p.impressions}, ${f1(p.position)})`).join('<br>')])) : ['None.']), '',
  'Two pages showing is not automatically a problem. It is worth checking when neither page ranks well, because the pages may split the same intent.', '',
  '## Top 10 tracker (measured by Search Console, this range against the previous snapshot)', '',
  previous ? `Previous snapshot: ${previous.generated} (${previous.start} to ${previous.end}).` : 'First snapshot: there is nothing to compare with yet.', '',
  `Currently measured at position 10 or better: ${t10.current.length}.`, '',
  ...(t10.current.length ? t10.current.map((k) => `- ${k}`) : ['- none']), '',
  ...(previous ? ['### New this snapshot', '', ...(t10.achieved.length ? t10.achieved.map((k) => `- ${k}`) : ['- none']), '', '### No longer measured in the top 10', '', ...(t10.lost.length ? t10.lost.map((k) => `- ${k}`) : ['- none']), ''] : []),
  '## Pages shown often but rarely clicked (50+ impressions, 1 % click rate or less, position 30 or better)', '',
  ...(low.length ? tbl(['Page', 'Impressions', 'Clicks', 'Position'], low.map((p) => [p.page, p.impressions, p.clicks, f1(p.position)])) : ['None.']), '',
  '## Pages by impressions', '', ...tbl(['Page', 'Impressions', 'Clicks', 'Queries', 'Position (weighted)'], pages.slice(0, 40).map((p) => [p.page, p.impressions, p.clicks, p.queries, f1(p.position)])), '',
].join('\n');

fs.writeFileSync(path.join(OUT, 'query-page-report.md'), md);
fs.writeFileSync(path.join(OUT, 'query-page-latest.json'), JSON.stringify({ generated: new Date().toISOString().slice(0, 10), start, end, rows: rows.filter((r) => r.impressions >= 2).map((r) => [r.query, r.page, r.clicks, r.impressions, +r.position.toFixed(1)]) }));
const snap = { generated: new Date().toISOString().slice(0, 10), start, end, top10: t10.current };
// One snapshot per day at most, and keep the last 52.
const kept = history.filter((h) => h.generated !== snap.generated).concat(snap).slice(-52);
fs.writeFileSync(histFile, JSON.stringify(kept, null, 1));
console.log(`Wrote ${path.join(OUT, 'query-page-report.md')}: ${rows.length} pairs, ${sd.length} striking-distance, ${cn.length} shared queries, ${t10.current.length} in the top 10.`);
