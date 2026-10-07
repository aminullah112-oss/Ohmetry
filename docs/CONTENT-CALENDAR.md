# Content calendar and keyword research

The first step is yours: search volumes come from Google Keyword Planner, which needs your Google Ads account.
Nothing on the site or in this file should be treated as demand data until the volume column is filled.

## 1. Run Keyword Planner (about 15 minutes)

1. Sign in at ads.google.com. Open **Tools > Planning > Keyword Planner** (a new account may ask you to create a campaign; you can skip the ad creation).
2. Choose **Get search volume and forecasts**.
3. Paste the `query` column of `keyword-research.csv` (one per line).
4. Set the location to the markets that pay best for ads and tools: United States first, then United Kingdom, Canada and Australia. Run it once per market if you want a split.
5. Click **Get started** and download the results as CSV.
6. Copy the average monthly searches into `monthly_volume` and the competition level into `competition` in `keyword-research.csv`.

Keyword Planner shows ranges for accounts without active spend (for example 1K to 10K). Use the range midpoints to rank, and treat close calls as ties.

## 2. Choose each week's page

Rank candidates by this rule, in order:

1. **Can we be accurate?** Skip anything that needs code tables we have not verified. The motor, box fill and ampacity pages wait for `NEC_TABLES.verified`.
2. **Is the intent distinct?** One page per distinct question. Do not publish near-duplicates (for example separate pages for "kw to kva" and "kva to kw" when one page covers both directions). Google's scaled-content policy targets that pattern.
3. **Volume, then competition.** Prefer the highest volume that is not dominated by the big calculator sites. Narrow queries (EV charger wire size, motor starting, relay curves) are where a new site can rank first.
4. **Fit.** Protection and IEC topics build authority and consulting inquiries. High-volume electronics queries (resistor colour code, LED resistor) bring traffic from an audience that will not buy the workbook.

## 3. Weekly cadence

| Day | Task |
|---|---|
| Mon | Pick the page from the ranked list. Write the test cases first, with hand-calculated expected values. |
| Tue to Wed | Build the calculation, component and page (600 to 900 words, worked example, FAQ, related links). |
| Thu | Check against a second source. Add the page to `src/data/calculators.ts`. Run `npm run build && npm run og` to create its social image. |
| Fri | Publish. Request indexing in Search Console. Post one worked example on LinkedIn. |
| Weekly | Review Search Console: positions 8 to 20 get a content refresh, impressions with no clicks get a title rewrite. |

Stop adding pages and put the effort into the toolkit and consulting leads if sessions are under 3,000 a month at day 180 (the plan's own checkpoint).

## 4. Candidate backlog (not ranked until volumes exist)

See `keyword-research.csv`. Status values: `live`, `hidden until NEC tables verified`, `candidate`.
