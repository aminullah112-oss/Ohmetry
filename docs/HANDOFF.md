# Handoff: Ohmetry (ohmetry.com)

Read this first in a new session. Written 2026-10-15.

## What the project is
Free NEC-first electrical, solar and protection calculators plus a paid Excel workbook ($19, Gumroad). Astro + React islands + MDX, Vitest (216 tests), static site on Cloudflare Workers, deployed by GitHub Actions on every push to `main`. Domain ohmetry.com (Cloudflare). Email: hello@ohmetry.com forwards to the owner's mailbox.

## Standing rules from the owner
- Direct, concise answers. Push back on weak assumptions. No hype words.
- **The owner wants to stay anonymous.** Do not add their name, country, employer or photo anywhere on the site, in commits, or in outreach. The site says "an independent electrical protection engineer". Never post from the owner's personal profiles.
- Site follows NEC 2023; code tables were verified by the owner against NEC 2020. Do not reproduce NEC tables (NFPA copyright is unresolved). The NEC ampacity add-on stays unreleased.
- Never ask for or handle passwords, API keys, the Search Console service-account key, or payment details. Secrets live only in GitHub secrets.
- Do not publish, buy, delete, or submit forms on the owner's behalf without asking. The Gumroad 100 % discount-code test purchase and GitHub 2FA (deadline 2026-11-23) are the owner's to do.
- No pull requests unless asked. Commit to `main` directly (the repo workflow does this). The dashboard bot commits `docs/seo/*`, so use `git pull --rebase origin main` before pushing.

## State (2026-10-15)
- Live: 56 indexable pages, including 10 formula-based chart pages under `/charts/` (kW to amps, voltage drop, wire resistance, transformer, power factor and others). Chart numbers come from `src/lib/calc/charts.ts`, which has tests.
- Gumroad product live at https://aminullah11.gumroad.com/l/hdauo, verified (cover, 5 gallery images, 57.7 KB workbook v1.1.1, thumbnail, 30-day refund). `gumroadUrl` is set in `src/data/site.ts`.
- Email capture is built and **hidden** until `emailFormAction` in `src/data/site.ts` is set. Setup steps: `docs/EMAIL-SETUP.md` (Brevo). Free sample workbook: `public/downloads/ohmetry-sample-sheet.xlsx` (build script `docs/build_sample_sheet.py`).
- Search Console (domain property sc-domain:ohmetry.com): 42 of 56 pages indexed as of 2026-10-15. 632 impressions, 1 click, average position 70.7 (data to Oct 12). Dashboard: GitHub Pages site built by `.github/workflows/dashboard.yml`, data in `docs/seo/`.
- Ahrefs Webmaster Tools verified. The 51 "backlinks" it shows are spam on numeric .xyz domains (nofollow); real backlinks = 0. Ignore them, do not disavow.
- Semrush MCP has no API units. Do not use it.

## Pending, in order
1. **Search Console indexing requests:** all 12 pending pages have been requested (2026-10-13 to 2026-10-16): /transformer-full-load-current-chart/, /watts-to-amps-chart/, /power-factor-correction-chart/, /power-factor-correction-calculator/, /idmt-relay-calculator/, /battery-bank-calculator/, /inverter-size-calculator/, /about/, /wire-size-by-distance-chart/, /amps-to-kw-chart/, /hp-to-kw-chart/, /motor-circuit-calculator/. Sitemap resolved (sitemap-index.xml and sitemap-0.xml: Success, 56 pages on 2026-10-15; the new page makes 57). Check results around 2026-10-22.
2. **Oct 22 check:** /kw-to-hp-calculator/, /voltage-drop-chart/, /wire-resistance-chart/ were "Crawled, currently not indexed". If still so, look at what each page offers that overlapping pages do not.
3. **Brevo form values** from the owner into `src/data/site.ts` (action URL, field name, hidden fields, honeypot) per `docs/EMAIL-SETUP.md`.
4. **Link building (owner-led, anonymous):** Eng-Tips and Reddit answers; 5 polite resource-page emails a week from hello@ohmetry.com. Targets and the email template: tricountyelectricservice.com (EV breaker post), northernmistersparky.com (generator sizing), innovativehobbysupply.com (NEC 80 % rule), aldridgeconstruction.biz, safetyspace.co, rvnews.com. Disclose that Ohmetry is the sender's site. No paid links, no exchanges.
5. **Built 2026-10-18:** /how-to-size-a-cable/ guide (five checks, one worked example; request indexing). The watts-to-amps and kW-to-amps charts gained rows (7,500 W, 7.6 kW, 400 V and 230 V columns) after the 2026-10-18 Search Console export showed specific-number queries like "1200 watts to amps" ranking on page one. Next candidates from that export: earth conductor sizing calculator (adiabatic, UK/IEC demand; verify k values first), cable derating content, fault loop queries.
5b. **Built 2026-10-16:** /wire-size-by-distance-chart/ (smallest copper AWG for a 3 % drop, 15/20/30 A, 25 to 300 ft, with the 240.4(D) floor). Request indexing for it. Keep any new page formula-based.
6. **Nov 12 review:** compare pilot chart-page impressions with the rest. Gate: if there is no upward trend and fewer than 5 real backlinks, change how outreach is done before building more pages.

## Targets and honesty
Owner's target is $1,000/month. Realistic odds were stated as about 20 % at the start and perhaps 35 to 45 % with this plan. Do not promise a probability. Traffic gate: roughly 300 search clicks a month by month 3.

## How checks were done
The cloud session cannot reach ohmetry.com, Gumroad or Search Console. Verification was by GitHub Actions status, the build output in `dist/`, and the owner's screenshots, plus a Claude-in-Chrome agent in the owner's browser for read-only checks. From a session with Chrome access, prefer doing those directly and report outcomes faithfully, including failures.
