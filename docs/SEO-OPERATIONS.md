# SEO operations (what runs, what it writes, how to read it)

Everything here is read-only against the live site and Search Console. Nothing publishes, edits pages, or requests indexing.

| What | How it runs | Output |
|---|---|---|
| Build checks (titles, canonicals, sitemap, headings) | Every deploy (`npm run seo`) | Fails the deploy on errors |
| Link check | Fridays (lychee) | Workflow log |
| Lighthouse across every page | Thursdays | Workflow log |
| GEO audit (AI search readiness) | Wednesdays | Workflow log |
| Search Console report (pages, queries, daily) | Mondays 06:17 UTC | `docs/seo/gsc-report.md` |
| Indexing status (URL Inspection API) | On demand | `docs/seo/indexing.md` |
| **Queries by page and the top-10 tracker** | Mondays 06:47 UTC, or on demand | `docs/seo/query-page-report.md`, `query-page-latest.json`, `query-top10-history.json` |
| Internal link report | On demand (`npm run build && npm run links:graph`) | `docs/seo/link-graph.md` |
| Backlink check | On demand (`npm run backlinks`) | Terminal / `docs/BACKLINK-CHECK.md` |

## Reading the queries-by-page report

- **Striking distance:** a query where one of your pages averages position 4 to 20. One better page or a few links can turn these into clicks. This is the first list to work from.
- **Two pages for one query:** check whether the pages split the same intent. Sharing a query is not automatically a fault.
- **Top 10 tracker:** a query and page pair is listed when Search Console's average position over the 28-day range is 10 or better with at least 3 impressions. "New" and "no longer" compare with the previous snapshot. This is Google's average, not a rank for every user, device or country. Do not describe a pair as "ranking number N" from it.
- **Shown but rarely clicked:** a title, snippet or position problem. Look at the title before anything else.

Search Console leaves out rare queries for privacy, so the report's totals are lower than the Performance report's.

## Running it by hand

Actions > "Search Console queries by page" > Run workflow:
https://github.com/aminullah112-oss/Ohmetry/actions/workflows/gsc-queries.yml

It needs the `GSC_SERVICE_ACCOUNT` secret, which is already set for the other Search Console workflows. The key is never pasted anywhere else.

## Testing without credentials

`FIXTURE=rows.json OUT_DIR=/tmp/out node --experimental-strip-types scripts/gsc-queries.mjs` runs the analysis on a JSON list of `{query, page, clicks, impressions, position}`. The unit tests for the analysis are in `src/lib/seo/gsc-analysis.test.ts` and use invented data.

## Rollback

Delete `.github/workflows/gsc-queries.yml`, `scripts/gsc-queries.mjs` and `src/lib/seo/`. Nothing else depends on them.
