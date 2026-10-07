import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { toolkitReady } from './src/data/site.ts';
import { TABLE_PAGES, pageVerified } from './src/data/nec-tables.ts';

// Production defaults: served at the root of the real domain (not purchased yet).
// For a preview hosted under a sub-path (GitHub Pages project site) set
//   BASE_PATH=/Ohmetry  SITE_URL=https://<user>.github.io  PUBLIC_PREVIEW=true
const base = process.env.BASE_PATH || '/';
const prefix = base === '/' ? '' : base.replace(/\/$/, '');

// Pages hardcode root-relative links ("/electrical/"). Prefix them with the base after the build.
const rebaseLinks = {
  name: 'rebase-links',
  hooks: {
    'astro:build:done': ({ dir }) => {
      if (!prefix) return;
      const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
        const p = path.join(d, e.name);
        if (e.isDirectory()) return walk(p);
        if (!e.name.endsWith('.html')) return;
        const html = fs.readFileSync(p, 'utf8').replace(/\b(href|src)="\/(?!\/)([^"]*)"/g, (m, attr, rest) =>
          `/${rest}`.startsWith(`${prefix}/`) || `/${rest}` === prefix ? m : `${attr}="${prefix}/${rest}"`);
        fs.writeFileSync(p, html);
      });
      walk(fileURLToPath(dir));
    },
  },
};

export default defineConfig({
  site: process.env.SITE_URL || 'https://ohmetry.com',
  base,
  trailingSlash: 'always',
  // Small site: inline the CSS so each page needs one fewer request.
  build: { inlineStylesheets: 'always' },
  integrations: [react(), mdx(), sitemap({ filter: (page) => (toolkitReady || !page.includes('/toolkit/')) && TABLE_PAGES.every((p) => !page.includes(p) || pageVerified(p)) }), rebaseLinks],
});
