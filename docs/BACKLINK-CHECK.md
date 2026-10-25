# Backlink check

Confirms that pages which should link to Ohmetry still do, and shows the link's `rel` attribute and anchor text.

```sh
npm run backlinks -- links.csv
npm run backlinks -- links.csv --target https://ohmetry.com/ --json
```

`links.csv` needs a header row with `source_url`. An optional `target_url` column overrides `--target` for that row.

```csv
source_url,target_url
https://example.org/resources/electrical-calculators/,https://ohmetry.com/voltage-drop-calculator/
```

A JSON array of `{ "source_url": "...", "target_url": "..." }` works too. Keep the real list out of the repository: it names the sites you contact.

## Results

| Status | Meaning |
|---|---|
| verified | A link to the target was found. `rel` shows `follow`, or the `nofollow`, `sponsored` or `ugc` values on it. |
| link_removed | The page loads but has no link in its HTML. |
| lost | The page returns 404 or 410. |
| unverifiable_js | The page looks JavaScript-rendered, so a missing link proves nothing. Check it in a browser. |
| error | Timeout, blocked address, too many redirects or an unexpected HTTP status. |

A match on the exact page beats a match on the same domain. `rel` reports `follow` only when none of `nofollow`, `sponsored` or `ugc` is present.

## What it does not do

- It does not tell you whether the source page is indexed, or whether Google counts the link. Check indexing separately.
- It sends one GET per source page, one second apart per host, with the user agent `OhmetryLinkCheck/1.0`. It does not read robots.txt, because it fetches only pages that were meant to link to you. Run it sparingly.
- It refuses private, loopback and link-local addresses and checks every redirect. It resolves the name before fetching, so a hostile DNS server could still change the answer between the check and the request. Run it only against URLs you chose.

The approach follows `verify_backlinks.py` in [AgriciDaniel/claude-seo](https://github.com/AgriciDaniel/claude-seo) (MIT). This is a smaller, separate implementation with no dependencies. That repo's Common Crawl script was not ported: it returns a domain's rank in the Common Crawl web graph, not a list of who links to it.
