# Deploy to Cloudflare (ohmetry.com)

The site is static. Production defaults already point at `https://ohmetry.com` at the root, so no environment variables are needed.

## Connect the repo
Cloudflare dashboard > Workers & Pages > Create > Pages > Connect to Git > `aminullah112-oss/Ohmetry`, branch `main`.

| Setting | Value |
|---|---|
| Framework preset | Astro |
| Build command | `git fetch --unshallow \|\| true; npm test && npm run build` |
| Build output directory | `dist` |
| Environment variable | `NODE_VERSION` = `22` |

The `git fetch --unshallow` step matters: each page's "Updated" date comes from `git log`, and Cloudflare clones shallow by default, which would stamp every page with the same date.
`npm test` runs the formula tests first, so a broken formula blocks the deploy.

## Attach the domain
Project > Custom domains > Set up a custom domain > `ohmetry.com`, then repeat for `www.ohmetry.com`.
Add a redirect rule (Rules > Redirect Rules) from `www.ohmetry.com/*` to `https://ohmetry.com/$1`, status 301.
SSL/TLS mode: Full (strict). Turn on Always Use HTTPS.

## After the first deploy
1. Open https://ohmetry.com/ and check a calculator, the sitemap (`/sitemap-index.xml`) and `robots.txt`.
2. Google Search Console: add the `ohmetry.com` domain property (DNS verification is one click when DNS is on Cloudflare), submit `sitemap-index.xml`.
3. Retire the GitHub Pages preview (delete `.github/workflows/pages.yml` and disable Pages in repo settings) so there is one copy of the site.
