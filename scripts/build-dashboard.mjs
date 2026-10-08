// Builds a self-contained progress dashboard into dashboard-dist/index.html from docs/seo/*.json and git history.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const read = (f) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null);
const history = read('docs/seo/history.json') || [];
const audit = read('docs/seo/audit-latest.json');
const gsc = read('docs/seo/gsc-latest.json');
const cf = read('docs/seo/cf-latest.json');
const git = (...a) => execFileSync('git', a, { encoding: 'utf8' }).trim();
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const latest = history[history.length - 1] || {};

// ---- pages: when each was added and how it performs in search
const cal = fs.readFileSync('src/data/calculators.ts', 'utf8');
const slugs = (block) => [...block.matchAll(/slug:\s*'([^']+)'.*?name:\s*'([^']+)'|slug:\s*'([^']+)'.*?name:\s*"([^"]+)"/g)].map((m) => ({ slug: m[1] || m[3], name: m[2] || m[4] }));
const calcBlock = cal.slice(cal.indexOf('export const calculators'), cal.indexOf('export const guides'));
const guideBlock = cal.slice(cal.indexOf('export const guides'), cal.indexOf('export const calcsIn'));
const pageList = [...slugs(calcBlock).map((p) => ({ ...p, kind: 'Calculator' })), ...slugs(guideBlock).map((p) => ({ ...p, kind: 'Guide' }))];
const gscByPage = new Map((gsc?.pages || []).map((p) => [p.page, p]));
for (const p of pageList) {
  const file = ['mdx', 'astro'].map((e) => `src/pages/${p.slug}/index.${e}`).find((f) => fs.existsSync(f));
  p.added = file ? git('log', '--diff-filter=A', '--format=%cs', '--', file).split('\n').filter(Boolean).pop() || '' : '';
  p.gsc = gscByPage.get(`/${p.slug}/`) || null;
}
pageList.sort((a, b) => (b.added || '').localeCompare(a.added || ''));

// ---- change log (skip automated commits)
const log = git('log', '-60', '--format=%cs|%s').split('\n').map((l) => { const i = l.indexOf('|'); return [l.slice(0, i), l.slice(i + 1)]; })
  .filter(([, s]) => !/^(Weekly Search Console report|Update dashboard data)/.test(s)).slice(0, 40);

// ---- charts (inline SVG, no libraries)
function chart(title, xs, series, note) {
  if (!xs.length) return `<section class="card"><h2>${esc(title)}</h2><p class="muted">${esc(note)}</p></section>`;
  const W = 640, H = 220, L = 46, R = 12, T = 12, B = 30;
  const max = Math.max(1, ...series.flatMap((s) => s.values.filter((v) => v != null)));
  const x = (i) => L + (xs.length === 1 ? (W - L - R) / 2 : (i * (W - L - R)) / (xs.length - 1));
  const y = (v) => T + (H - T - B) * (1 - v / max);
  const colors = ['#ffb84d', '#6b93ff', '#4ade80'];
  const grid = [0, 0.5, 1].map((f) => `<line x1="${L}" x2="${W - R}" y1="${y(max * f)}" y2="${y(max * f)}" stroke="#223340"/><text x="${L - 6}" y="${y(max * f) + 4}" text-anchor="end" fill="#8a9ba7" font-size="11">${Math.round(max * f)}</text>`).join('');
  const lines = series.map((s, k) => {
    const pts = s.values.map((v, i) => (v == null ? null : [x(i), y(v)])).filter(Boolean);
    return `<polyline fill="none" stroke="${colors[k]}" stroke-width="2.2" points="${pts.map((p) => p.join(',')).join(' ')}"/>` + pts.map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="3" fill="${colors[k]}"/>`).join('');
  }).join('');
  const step = Math.max(1, Math.ceil(xs.length / 6));
  const labels = xs.map((d, i) => (i % step === 0 || i === xs.length - 1 ? `<text x="${x(i)}" y="${H - 8}" text-anchor="middle" fill="#8a9ba7" font-size="11">${esc(d.slice(5))}</text>` : '')).join('');
  const legend = series.map((s, k) => `<span><i style="background:${colors[k]}"></i>${esc(s.name)}</span>`).join('');
  return `<section class="card"><h2>${esc(title)}</h2><div class="legend">${legend}</div><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)}">${grid}${lines}${labels}</svg></section>`;
}
const growth = chart('Site growth', history.map((h) => h.date), [
  { name: 'Pages', values: history.map((h) => h.pages) }, { name: 'Tests', values: history.map((h) => h.tests) }, { name: 'Calculators', values: history.map((h) => h.calculators) },
], 'Snapshots appear after each deploy.');
const search = chart('Google search (last 30 days, daily)', gsc?.daily.map((d) => d.date) || [], [
  { name: 'Impressions', values: gsc?.daily.map((d) => d.impressions) || [] }, { name: 'Clicks', values: gsc?.daily.map((d) => d.clicks) || [] },
], 'Waiting for Search Console data. Add the GSC_SERVICE_ACCOUNT secret (see docs/DEPLOY-CLOUDFLARE.md).');
const visits = chart('Visitors (Cloudflare Web Analytics, daily)', cf?.daily.map((d) => d.date) || [], [
  { name: 'Visits', values: cf?.daily.map((d) => d.visits) || [] }, { name: 'Page views', values: cf?.daily.map((d) => d.pageViews) || [] },
], 'Not connected. Add CF_ANALYTICS_TOKEN and CF_SITE_TAG (see docs/DEPLOY-CLOUDFLARE.md).');

const stat = (label, value, sub = '') => `<div class="stat"><span>${esc(label)}</span><strong>${value ?? '–'}</strong>${sub ? `<small>${esc(sub)}</small>` : ''}</div>`;
const auditOk = audit ? (audit.failures.length === 0) : null;
const cards = [
  stat('Pages', latest.pages, `${latest.indexable ?? '–'} indexable`),
  stat('Calculators', latest.calculators, `${latest.guides ?? '–'} guides`),
  stat('Tests', latest.tests, 'formula checks'),
  stat('SEO audit', auditOk === null ? '–' : auditOk ? 'Pass' : 'Fail', audit ? `${audit.failures.length} failures, ${audit.warnings.length} warnings` : ''),
  stat('Search clicks', gsc ? gsc.totals.clicks : '–', gsc ? `${gsc.totals.impressions} impressions, 28 d` : 'not connected'),
  stat('Visits (30 d)', cf ? cf.daily.reduce((a, d) => a + d.visits, 0) : '–', cf ? '' : 'not connected'),
].join('');

const rows = pageList.map((p) => `<tr><td><a href="https://ohmetry.com/${p.slug}/">${esc(p.name)}</a><small>${p.kind}</small></td><td>${esc(p.added)}</td><td class="n">${p.gsc ? p.gsc.impressions : gsc ? 0 : '–'}</td><td class="n">${p.gsc ? p.gsc.clicks : gsc ? 0 : '–'}</td><td class="n">${p.gsc ? p.gsc.position : '–'}</td></tr>`).join('');
const issues = audit ? [...audit.failures.map((f) => `<li class="bad">${esc(f)}</li>`), ...audit.warnings.map((w) => `<li>${esc(w)}</li>`)].join('') || '<li>None</li>' : '<li>No audit data yet</li>';
const changes = log.map(([d, s]) => `<tr><td>${esc(d)}</td><td>${esc(s)}</td></tr>`).join('');

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Ohmetry progress dashboard</title>
<style>
:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#0e171e;color:#e7eef4;font:16px/1.5 system-ui,-apple-system,Segoe UI,sans-serif}
main{max-width:1000px;margin:0 auto;padding:24px 16px 64px}h1{font-size:1.8rem;margin:0 0 4px}h2{font-size:1.1rem;margin:0 0 10px}
.muted,small{color:#8a9ba7}small{display:block;font-size:.78rem}a{color:#ffb84d}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:20px 0}
.stat,.card{background:#14222c;border:1px solid #223340;border-radius:12px;padding:14px}.stat span{color:#8a9ba7;font-size:.8rem}.stat strong{display:block;font-size:1.7rem;color:#ffb84d}
.card{margin:14px 0}svg{width:100%;height:auto}.legend{display:flex;gap:16px;font-size:.8rem;color:#a9bac6;margin-bottom:4px}.legend i{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px}
table{width:100%;border-collapse:collapse;font-size:.9rem}th,td{padding:7px 8px;border-top:1px solid #223340;text-align:left;vertical-align:top}th{color:#8a9ba7;font-weight:500}td.n,th.n{text-align:right}
.scroll{overflow-x:auto}ul{margin:0;padding-left:18px}li.bad{color:#ff7b7b}.note{font-size:.85rem;color:#a9bac6}
</style></head><body><main>
<h1>Ohmetry progress dashboard</h1><p class="muted">Updated ${esc(latest.date || '')}. Private working view: this page asks search engines not to index it.</p>
<div class="stats">${cards}</div>
${search}${visits}${growth}
<section class="card"><h2>Pages and how they perform</h2><p class="note">Impressions and clicks are Google search, last 28 days, once Search Console is connected. Position is the average ranking (lower is better). Pages need weeks to start showing, so compare age before judging.</p><div class="scroll"><table><tr><th>Page</th><th>Added</th><th class="n">Impressions</th><th class="n">Clicks</th><th class="n">Avg position</th></tr>${rows}</table></div></section>
<section class="card"><h2>What changed, in order</h2><p class="note">Read the search charts against these dates. A change can take two to eight weeks to show in rankings, and several things change at once, so this shows timing, not proof of cause.</p><div class="scroll"><table>${changes}</table></div></section>
<section class="card"><h2>SEO audit</h2><ul>${issues}</ul></section>
<section class="card"><h2>Top search queries</h2>${gsc ? `<div class="scroll"><table><tr><th>Query</th><th class="n">Impressions</th><th class="n">Clicks</th><th class="n">Position</th></tr>${gsc.queries.slice(0, 25).map((q) => `<tr><td>${esc(q.query)}</td><td class="n">${q.impressions}</td><td class="n">${q.clicks}</td><td class="n">${q.position}</td></tr>`).join('')}</table></div>` : '<p class="muted">Waiting for Search Console data.</p>'}</section>
</main></body></html>`;
fs.mkdirSync('dashboard-dist', { recursive: true });
fs.writeFileSync('dashboard-dist/index.html', html);
console.log(`Wrote dashboard-dist/index.html (${html.length} bytes, ${pageList.length} pages listed).`);
