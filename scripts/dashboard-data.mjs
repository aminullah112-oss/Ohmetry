// Adds today's snapshot of the site to docs/seo/history.json (one entry per date).
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const read = (f) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null);
const audit = read('docs/seo/audit-latest.json') || {};
const cal = fs.readFileSync('src/data/calculators.ts', 'utf8');
const calBlock = cal.slice(cal.indexOf('export const calculators'), cal.indexOf('export const guides'));
const guideBlock = cal.slice(cal.indexOf('export const guides'), cal.indexOf('export const calcsIn'));
const count = (t) => (t.match(/slug:/g) || []).length;
const tests = Number((fs.readFileSync('src/data/site.ts', 'utf8').match(/testCount = (\d+)/) || [])[1]) || null;
const commits = Number(execFileSync('git', ['rev-list', '--count', 'HEAD'], { encoding: 'utf8' }).trim());
const gsc = read('docs/seo/gsc-latest.json');
const cf = read('docs/seo/cf-latest.json');
const today = new Date().toISOString().slice(0, 10);

const entry = {
  date: today,
  pages: audit.pages ?? null, indexable: audit.indexable ?? null,
  calculators: count(calBlock), guides: count(guideBlock), tests, commits,
  auditFailures: audit.failures?.length ?? null, auditWarnings: audit.warnings?.length ?? null,
  ...(gsc ? { gscClicks28: gsc.totals.clicks, gscImpressions28: gsc.totals.impressions } : {}),
  ...(cf ? { cfVisits30: cf.daily.reduce((a, d) => a + d.visits, 0) } : {}),
};
const file = 'docs/seo/history.json';
const history = (read(file) || []).filter((e) => e.date !== today);
history.push(entry);
history.sort((a, b) => a.date.localeCompare(b.date));
fs.mkdirSync('docs/seo', { recursive: true });
fs.writeFileSync(file, JSON.stringify(history, null, 1));
console.log('Snapshot:', JSON.stringify(entry));
