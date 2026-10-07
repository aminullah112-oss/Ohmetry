# Ohmetry

Static electrical/solar/protection calculator site. Astro + React islands + MDX, Vitest for calculation logic. No backend.

```bash
npm install
npm run dev      # local dev
npm test         # golden-case tests for src/lib/calc
npm run build    # outputs dist/
```

## Adding a calculator (one TS file, one test, one component, one MDX page)

1. `src/lib/calc/<name>.ts`: pure function, no UI imports.
2. `src/lib/calc/<name>.test.ts`: expected values from a published worked example or hand calculation, with the source in a comment.
3. `src/components/<Name>.tsx`: thin React wrapper.
4. `src/pages/<slug>-calculator/index.mdx`: use `layout: ../../layouts/CalcPage.astro`; include formula, code section, worked example, 500 to 900 words, FAQ, related links.
5. Link it from its hub page.

Code tables (NEC 310.16 etc.) go in as data files with the section cited. Do not paste NFPA text.

## Deploy (Cloudflare Pages)

Root directory `ohmetry`, build command `npm run build`, output `dist`. Sitemap is at `/sitemap-index.xml`.

## Preview on GitHub Pages

`.github/workflows/pages.yml` runs the tests, then builds with `BASE_PATH=/<repo>` and `PUBLIC_PREVIEW=true` (adds `noindex`) and deploys to `https://<owner>.github.io/<repo>/`. One-time setup: repo Settings > Pages > Source: **GitHub Actions**. Production on a real domain builds at the root with no environment variables.

## NEC table verification (blocks launch of two pages)

The wire size and conduit fill calculators use NEC table values from `src/data/nec-tables.ts`. They were entered without access to a licensed copy of the code, so `NEC_TABLES.verified` is `false`. While it is false, those two pages show a warning, are `noindex`, and are left out of the sitemap.

1. `npm run tables` prints every value used (also saved as `docs/TABLE-VERIFICATION.md`).
2. Compare each value with your copy of the NEC. The site follows the latest edition (`NEC_TABLES.edition`); `verifiedAgainst` records the edition of the copy used for checking.
3. Fix any differences in `src/data/nec-tables.ts`, update `edition`, set `verifiedBy`, and set `verified: true`.
4. `npm test` and push. The warning disappears and the pages enter the sitemap.

## Trust and metadata

- **Updated dates.** Each page shows when its source file last changed in git. CI checks out full history (`fetch-depth: 0`) so this works in the deployed build.
- **Reviewed lines.** `src/data/reviews.ts` is empty on purpose. Add a page only when a qualified person has actually reviewed it; the page then shows "Reviewed <date> by <name>".
- **Corrections log.** Add entries to `src/data/corrections.ts` whenever a published value or formula was wrong. They appear on `/corrections/` and as a notice on the page concerned.
- **Social images.** `npm run build && npm run og` renders `public/og/<page>.png` (needs a Chromium: set `CHROMIUM_PATH` or run `npx playwright-core install chromium`). Re-run it after adding or renaming a page, then commit the images.

## Content planning

`docs/keyword-research.csv` and `docs/CONTENT-CALENDAR.md` hold the candidate pages and the weekly process. Run Google Keyword Planner on the query list first and fill in the volume columns before choosing pages.

## Before launch

- Domain is not bought. `site` in `astro.config.mjs` and `public/robots.txt` assume `ohmetry.com`.
- Trust pages contain `TODO` placeholders (author bio, contact email, privacy details).
- Toolkit page: set `gumroadUrl` and `emailFormAction` in `src/data/site.ts`. Until both are set the page is `noindex`, has no form, and is excluded from the sitemap. Review the page copy against the real product.
- Add a consent banner and name the email provider on the privacy page before enabling email capture.

Live preview: https://aminullah112-oss.github.io/Ohmetry/ (noindex, deployed by GitHub Actions)
