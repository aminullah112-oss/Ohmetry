// Optional: pulls daily visits and page views from Cloudflare Web Analytics into docs/seo/cf-latest.json.
// Needs CF_ANALYTICS_TOKEN (an API token with "Account Analytics: Read"), CLOUDFLARE_ACCOUNT_ID and CF_SITE_TAG.
// Skips quietly when any is missing or the request fails. Written against Cloudflare's GraphQL
// Analytics API (rumPageloadEventsAdaptiveGroups); check it against a live token before relying on it.
import fs from 'node:fs';

const { CF_ANALYTICS_TOKEN: token, CLOUDFLARE_ACCOUNT_ID: account, CF_SITE_TAG: siteTag } = process.env;
if (!token || !account || !siteTag) { console.log('Cloudflare analytics not configured, skipping.'); process.exit(0); }
try {
  const day = (d) => new Date(Date.now() - d * 864e5).toISOString().slice(0, 10);
  const query = `query($acc: String!, $tag: String!, $from: Date!, $to: Date!) {
    viewer { accounts(filter: { accountTag: $acc }) {
      series: rumPageloadEventsAdaptiveGroups(limit: 100, orderBy: [date_ASC], filter: { siteTag: $tag, date_geq: $from, date_leq: $to }) {
        count sum { visits } dimensions { date }
      }
    } }
  }`;
  const res = await fetch('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables: { acc: account, tag: siteTag, from: day(30), to: day(0) } }),
  });
  const j = await res.json();
  if (j.errors?.length) throw new Error(JSON.stringify(j.errors).slice(0, 300));
  const rows = j.data?.viewer?.accounts?.[0]?.series || [];
  const daily = rows.map((r) => ({ date: r.dimensions.date, pageViews: r.count, visits: r.sum.visits }));
  fs.mkdirSync('docs/seo', { recursive: true });
  fs.writeFileSync('docs/seo/cf-latest.json', JSON.stringify({ generated: day(0), daily }, null, 1));
  console.log(`Wrote docs/seo/cf-latest.json (${daily.length} days).`);
} catch (e) { console.log('Cloudflare analytics skipped: ' + e.message); }
