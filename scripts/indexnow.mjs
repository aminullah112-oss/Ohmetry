// Tells IndexNow search engines (Bing, Yandex and others; not Google) about pages changed in a push.
// Usage: node scripts/indexnow.mjs <before-sha> <after-sha>. Never fails the build.
import { execFileSync } from 'node:child_process';

const KEY = 'c38202ae4969aa48f41bb1309a2cd268';
const HOST = 'ohmetry.com';
const [before, after] = process.argv.slice(2);
try {
  if (!before || /^0+$/.test(before)) { console.log('indexnow: no previous commit, skipping'); process.exit(0); }
  const files = execFileSync('git', ['diff', '--name-only', before, after, '--', 'src/pages'], { encoding: 'utf8' }).split('\n').filter(Boolean);
  const urls = new Set();
  for (const f of files) {
    const m = f.match(/^src\/pages\/(.+?)(?:\/index)?\.(?:mdx|astro)$/);
    if (!m || m[1] === '404' || m[1] === 'index') { if (m && m[1] === 'index') urls.add(`https://${HOST}/`); continue; }
    urls.add(`https://${HOST}/${m[1]}/`);
  }
  if (!urls.size) { console.log('indexnow: no changed pages'); process.exit(0); }
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: [...urls] }),
  });
  console.log(`indexnow: sent ${urls.size} URL(s), HTTP ${res.status}`);
} catch (e) { console.log('indexnow: skipped (' + e.message + ')'); }
