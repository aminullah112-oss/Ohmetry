// Pulls the last 28 days of Google Search Console data and writes docs/seo/gsc-report.md.
// Needs the GSC_SERVICE_ACCOUNT secret (the service-account JSON). Skips quietly if it is missing.
import crypto from 'node:crypto';
import fs from 'node:fs';

const raw = process.env.GSC_SERVICE_ACCOUNT;
if (!raw) { console.log('GSC_SERVICE_ACCOUNT is not set, skipping.'); process.exit(0); }
const sa = JSON.parse(raw);
const SITE = process.env.GSC_SITE || 'sc-domain:ohmetry.com';

const b64 = (o) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');
const now = Math.floor(Date.now() / 1000);
const unsigned = b64({ alg: 'RS256', typ: 'JWT' }) + '.' + b64({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/webmasters.readonly', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
const jwt = unsigned + '.' + crypto.createSign('RSA-SHA256').update(unsigned).sign(sa.private_key, 'base64url');
const tok = await (await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }) })).json();
if (!tok.access_token) { console.error('Token request failed:', JSON.stringify(tok)); process.exit(1); }

const day = (d) => new Date(Date.now() - d * 864e5).toISOString().slice(0, 10);
const query = async (dimensions, rowLimit) => {
  const r = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE)}/searchAnalytics/query`, {
    method: 'POST', headers: { authorization: `Bearer ${tok.access_token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ startDate: day(30), endDate: day(2), dimensions, rowLimit }),
  });
  const j = await r.json();
  if (!r.ok) { console.error('Search Console error:', JSON.stringify(j)); process.exit(1); }
  return j.rows || [];
};
const fmt = (r) => `${r.clicks} | ${r.impressions} | ${(r.ctr * 100).toFixed(1)} % | ${r.position.toFixed(1)}`;
const pages = await query(['page'], 50);
const queries = await query(['query'], 50);
const out = [
  '# Search Console report', '', `Site: ${SITE}. Period: ${day(30)} to ${day(2)}. Generated ${new Date().toISOString().slice(0, 10)}.`, '',
  '## Top pages', '', '| Page | Clicks | Impressions | CTR | Avg position |', '|---|---|---|---|---|',
  ...pages.map((r) => `| ${r.keys[0].replace('https://ohmetry.com', '')} | ${fmt(r)} |`), '',
  '## Top queries', '', '| Query | Clicks | Impressions | CTR | Avg position |', '|---|---|---|---|---|',
  ...queries.map((r) => `| ${r.keys[0]} | ${fmt(r)} |`), '',
  '## How to read this', '',
  '- Queries with many impressions and an average position of 8 to 20 are the best next pages: Google already shows the site, and one better page can move it up.',
  '- Pages with impressions but a click-through rate under 1 % need a better title and description.',
  '- Pages with no impressions after four weeks need checking in the URL Inspection tool.', '',
];
fs.mkdirSync('docs/seo', { recursive: true });
fs.writeFileSync('docs/seo/gsc-report.md', out.join('\n'));
console.log(`Wrote docs/seo/gsc-report.md (${pages.length} pages, ${queries.length} queries).`);
