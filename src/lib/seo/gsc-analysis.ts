/**
 * Analysis of Search Console data that has query and page together (the API's query + page dimensions).
 * Pure functions: no network, no files. Position is Google's average position over the date range, not a rank for every
 * user or location, so every label here says "measured by Search Console" and carries the date range.
 */
export interface QueryPageRow { query: string; page: string; clicks: number; impressions: number; position: number }
export interface Snapshot { generated: string; start: string; end: string; top10: string[] }

const key = (r: QueryPageRow) => `${r.query} | ${r.page}`;

/** Queries where a page already shows near the top of page 1 or on page 2: the cheapest place to gain clicks. */
export function strikingDistance(rows: QueryPageRow[], o: { minImpressions?: number; minPosition?: number; maxPosition?: number } = {}): QueryPageRow[] {
  const { minImpressions = 3, minPosition = 4, maxPosition = 20 } = o;
  return rows.filter((r) => r.impressions >= minImpressions && r.position >= minPosition && r.position <= maxPosition).sort((a, b) => b.impressions - a.impressions);
}

export interface Cannibalised { query: string; totalImpressions: number; pages: { page: string; impressions: number; position: number }[] }

/** A query where two or more of your own pages each get a meaningful number of impressions. */
export function cannibalised(rows: QueryPageRow[], o: { minImpressions?: number } = {}): Cannibalised[] {
  const { minImpressions = 5 } = o;
  const by = new Map<string, QueryPageRow[]>();
  for (const r of rows) (by.get(r.query) ?? by.set(r.query, []).get(r.query)!).push(r);
  const out: Cannibalised[] = [];
  for (const [query, rs] of by) {
    const pages = rs.filter((r) => r.impressions >= minImpressions);
    if (pages.length >= 2) out.push({ query, totalImpressions: pages.reduce((a, r) => a + r.impressions, 0), pages: pages.map((r) => ({ page: r.page, impressions: r.impressions, position: r.position })).sort((a, b) => b.impressions - a.impressions) });
  }
  return out.sort((a, b) => b.totalImpressions - a.totalImpressions);
}

export interface Top10Change { achieved: string[]; lost: string[]; steady: string[]; current: string[] }

/** Query + page pairs measured at position 10 or better with enough impressions, compared with the previous snapshot. */
export function trackTop10(rows: QueryPageRow[], previous: Snapshot | null, o: { minImpressions?: number } = {}): Top10Change {
  const { minImpressions = 3 } = o;
  const current = rows.filter((r) => r.position <= 10 && r.impressions >= minImpressions).map(key).sort();
  const prev = new Set(previous?.top10 ?? []);
  const now = new Set(current);
  return {
    current,
    achieved: previous ? current.filter((k) => !prev.has(k)) : [],
    lost: previous ? [...prev].filter((k) => !now.has(k)).sort() : [],
    steady: previous ? current.filter((k) => prev.has(k)) : [],
  };
}

export interface PageSummary { page: string; clicks: number; impressions: number; ctr: number; position: number; queries: number }

/** Page totals; position is the impression-weighted mean of its query positions. */
export function pageSummaries(rows: QueryPageRow[]): PageSummary[] {
  const by = new Map<string, QueryPageRow[]>();
  for (const r of rows) (by.get(r.page) ?? by.set(r.page, []).get(r.page)!).push(r);
  return [...by].map(([page, rs]) => {
    const impressions = rs.reduce((a, r) => a + r.impressions, 0);
    const clicks = rs.reduce((a, r) => a + r.clicks, 0);
    const position = impressions ? rs.reduce((a, r) => a + r.position * r.impressions, 0) / impressions : 0;
    return { page, clicks, impressions, ctr: impressions ? clicks / impressions : 0, position, queries: rs.length };
  }).sort((a, b) => b.impressions - a.impressions);
}

/** Pages that are shown a lot but rarely clicked: a title or snippet problem, or a result position problem. */
export function lowCtrPages(summaries: PageSummary[], o: { minImpressions?: number; maxCtr?: number; maxPosition?: number } = {}): PageSummary[] {
  const { minImpressions = 50, maxCtr = 0.01, maxPosition = 30 } = o;
  return summaries.filter((s) => s.impressions >= minImpressions && s.ctr <= maxCtr && s.position <= maxPosition);
}
