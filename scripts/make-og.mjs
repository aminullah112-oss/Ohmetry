// Renders a 1200x630 social image for every page in dist/ into public/og/<slug>.png.
// Run after a build:  npm run build && npm run og
// Needs a Chromium. Set CHROMIUM_PATH, or run `npx playwright-core install chromium` once.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const root = process.cwd();
const dist = path.join(root, 'dist');
const out = path.join(root, 'public', 'og');
fs.mkdirSync(out, { recursive: true });

// Fonts are embedded as data URIs: a page set from a string cannot load file:// fonts.
const font = (pkg, file) => 'data:font/woff2;base64,' + fs.readFileSync(path.join(root, 'node_modules', pkg, 'files', file)).toString('base64');
const css = `
@font-face{font-family:'Archivo Variable';src:url('${font('@fontsource-variable/archivo', 'archivo-latin-wdth-normal.woff2')}');font-weight:100 900;font-stretch:62% 125%}
@font-face{font-family:'IBM Plex Mono';font-weight:500;src:url('${font('@fontsource/ibm-plex-mono', 'ibm-plex-mono-latin-500-normal.woff2')}')}
@font-face{font-family:'IBM Plex Mono';font-weight:400;src:url('${font('@fontsource/ibm-plex-mono', 'ibm-plex-mono-latin-400-normal.woff2')}')}
@font-face{font-family:'IBM Plex Sans';font-weight:400;src:url('${font('@fontsource/ibm-plex-sans', 'ibm-plex-sans-latin-400-normal.woff2')}')}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;background:#0e171e;color:#e7eef4;font-family:'IBM Plex Sans',sans-serif;position:relative;overflow:hidden}
.grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px);background-size:40px 40px;-webkit-mask-image:linear-gradient(#000,transparent 90%)}
.wrap{position:absolute;inset:0;padding:64px 72px;display:flex;flex-direction:column;justify-content:space-between}
.brand{display:flex;align-items:center;gap:16px;font:800 34px 'Archivo Variable';font-stretch:112%;letter-spacing:-.01em}
.eyebrow{font:500 22px 'IBM Plex Mono';letter-spacing:.16em;text-transform:uppercase;color:#ffb84d;margin-bottom:22px}
h1{font:800 76px/1.04 'Archivo Variable';font-stretch:108%;letter-spacing:-.02em;max-width:1000px}
.foot{display:flex;justify-content:space-between;align-items:center;font:400 22px 'IBM Plex Mono';color:#8a9ba7}
.read{background:#060c11;border:1px solid #223340;border-radius:12px;padding:12px 20px;color:#ffb84d;font:500 26px 'IBM Plex Mono';text-shadow:0 0 14px rgba(255,184,77,.35)}
svg{width:44px;height:44px}`;
const logo = `<svg viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#0e171e" stroke="#223340"/><path d="M7 22h4.2c-2-1.6-3.2-3.8-3.2-6.3C8 11.4 11.4 8.5 16 8.5s8 2.9 8 7.2c0 2.5-1.2 4.7-3.2 6.3H25" fill="none" stroke="#ffb84d" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 26.5h4l1.5-2.2 2.4 3.4 2.2-4.4 1.8 3.2H27" fill="none" stroke="#6b93ff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function pages() {
  const list = [];
  const walk = (d, rel = '') => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) { if (e.name !== '_astro') walk(path.join(d, e.name), path.join(rel, e.name)); }
      else if (e.name === 'index.html') list.push(rel);
    }
  };
  walk(dist);
  return list.map((slug) => {
    const html = fs.readFileSync(path.join(dist, slug, 'index.html'), 'utf8');
    const h1 = (html.match(/<h1[^>]*>(.*?)<\/h1>/s) || [])[1]?.replace(/<[^>]+>/g, '').trim();
    const eyebrow = (html.match(/class="eyebrow">(.*?)<\/div>/s) || [])[1]?.replace(/<[^>]+>/g, '').trim() || '';
    return { slug: slug || 'default', title: h1 || 'Ohmetry', eyebrow };
  });
}

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
let n = 0;
for (const p of pages()) {
  const title = p.slug === 'default' ? 'Calculators that show their work.' : p.title;
  const eyebrow = p.slug === 'default' ? 'Electrical · Solar · Protection' : p.eyebrow || 'Ohmetry';
  await page.setContent(`<style>${css}</style><div class="grid"></div><div class="wrap"><div class="brand">${logo}Ohmetry</div><div><div class="eyebrow">${esc(eyebrow)}</div><h1>${esc(title)}</h1></div><div class="foot"><span>Formula · reference · worked example</span><span class="read">ohmetry</span></div></div>`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(out, `${p.slug.replace(/\//g, '-')}.png`) });
  n++;
}
await browser.close();
console.log(`wrote ${n} images to public/og/`);
