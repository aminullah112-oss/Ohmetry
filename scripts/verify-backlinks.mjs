// Checks that pages you were promised a link on still link to an Ohmetry URL, and with which rel attribute.
// Read-only: one GET per source page, one second apart per host, public addresses only.
//   node --experimental-strip-types scripts/verify-backlinks.mjs links.csv
//   node --experimental-strip-types scripts/verify-backlinks.mjs links.json --target https://ohmetry.com/ --json
// Input: a CSV with a header row including source_url (and optionally target_url), or a JSON array of objects with the same keys.
// It does not check whether the source page is indexed.
import fs from 'node:fs';
import dns from 'node:dns/promises';
import { verifyLink, isBlockedHost, isCheckableUrl } from '../src/lib/links/verify.ts';

const UA = 'OhmetryLinkCheck/1.0 (+https://ohmetry.com/contact/)';
const MAX_HOPS = 5;
const MAX_BYTES = 2_000_000;
const DELAY_MS = 1000;

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const flag = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined; };
const asJson = args.includes('--json');
if (!file) { console.error('Usage: node --experimental-strip-types scripts/verify-backlinks.mjs <links.csv|links.json> [--target URL] [--json]'); process.exit(1); }
const defaultTarget = flag('target') ?? 'https://ohmetry.com/';

function parseCsv(text) {
  const rows = text.trim().split(/\r?\n/).map((line) => line.match(/("([^"]|"")*"|[^,]*)(,|$)/g).map((c) => c.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"').trim()));
  const head = rows.shift().map((h) => h.toLowerCase());
  return rows.filter((r) => r.some(Boolean)).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])));
}
const raw = fs.readFileSync(file, 'utf8');
const items = (file.endsWith('.json') ? JSON.parse(raw) : parseCsv(raw)).filter((i) => i.source_url);

async function publicAddress(hostname) {
  if (isBlockedHost(hostname)) return false;
  try { return (await dns.lookup(hostname, { all: true })).every((a) => !isBlockedHost(a.address)); } catch { return false; }
}

// Follows redirects by hand so every hop is checked, and stops at MAX_HOPS.
async function fetchPage(url) {
  let current = url;
  for (let hop = 0; hop <= MAX_HOPS; hop++) {
    const u = new URL(current);
    if (!isCheckableUrl(current) || !(await publicAddress(u.hostname))) return { status: null, finalUrl: current, html: '', error: 'Blocked: not a public address.' };
    let res;
    try {
      res = await fetch(current, { redirect: 'manual', headers: { 'User-Agent': UA, Accept: 'text/html' }, signal: AbortSignal.timeout(20000) });
    } catch (e) { return { status: null, finalUrl: current, html: '', error: e?.cause?.code ?? e?.name ?? String(e) }; }
    const loc = res.headers.get('location');
    if (res.status >= 300 && res.status < 400 && loc) { current = new URL(loc, current).href; continue; }
    const html = (await res.text()).slice(0, MAX_BYTES);
    return { status: res.status, finalUrl: current, html };
  }
  return { status: null, finalUrl: current, html: '', error: 'Too many redirects.' };
}

const lastHit = new Map();
const polite = async (url) => {
  const host = new URL(url).hostname;
  const wait = (lastHit.get(host) ?? 0) + DELAY_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastHit.set(host, Date.now());
};

const results = [];
for (const it of items) {
  const target = it.target_url || defaultTarget;
  try { await polite(it.source_url); } catch { /* bad URL is reported by verifyLink */ }
  results.push(await verifyLink(it.source_url, target, fetchPage));
}

if (asJson) { console.log(JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2)); }
else {
  const count = (s) => results.filter((r) => r.status === s).length;
  console.log(`Checked ${results.length}: ${count('verified')} verified, ${count('link_removed')} removed, ${count('lost')} lost, ${count('unverifiable_js')} unverifiable (JS), ${count('error')} errors\n`);
  for (const r of results) console.log(`[${r.status.padEnd(15)}] ${r.sourceUrl}${r.anchorText ? `  "${r.anchorText.slice(0, 40)}"` : ''}${r.rel.length ? `  rel=${r.rel.join(',')}` : ''}${r.note ? `  (${r.note})` : ''}`);
}
