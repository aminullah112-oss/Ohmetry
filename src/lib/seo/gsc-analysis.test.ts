import { describe, expect, it } from 'vitest';
import { cannibalised, lowCtrPages, pageSummaries, strikingDistance, trackTop10, type QueryPageRow } from './gsc-analysis';

// Small invented data set: these are test inputs, not Search Console results.
const rows: QueryPageRow[] = [
  { query: 'voltage drop calculator', page: '/a/', clicks: 0, impressions: 100, position: 70 },
  { query: 'kva to kw', page: '/b/', clicks: 1, impressions: 40, position: 12 },
  { query: 'kva to kw', page: '/c/', clicks: 0, impressions: 10, position: 25 },
  { query: 'idmt formula', page: '/d/', clicks: 2, impressions: 6, position: 1 },
  { query: 'earth rod', page: '/e/', clicks: 0, impressions: 2, position: 6 },
  { query: 'cable size', page: '/b/', clicks: 0, impressions: 60, position: 8.5 },
];

describe('strikingDistance', () => {
  it('keeps positions 4 to 20 with enough impressions, busiest first', () => {
    const r = strikingDistance(rows);
    expect(r.map((x) => x.query)).toEqual(['cable size', 'kva to kw']);
    expect(r[0].impressions).toBe(60);
  });
  it('drops rows under the impression floor', () => {
    expect(strikingDistance(rows).some((x) => x.query === 'earth rod')).toBe(false);
  });
});

describe('cannibalised', () => {
  it('finds a query that two pages both show for', () => {
    const c = cannibalised(rows);
    expect(c).toHaveLength(1);
    expect(c[0].query).toBe('kva to kw');
    expect(c[0].pages.map((p) => p.page)).toEqual(['/b/', '/c/']);
    expect(c[0].totalImpressions).toBe(50);
  });
  it('ignores a second page with negligible impressions', () => {
    expect(cannibalised(rows, { minImpressions: 20 })).toHaveLength(0);
  });
});

describe('trackTop10', () => {
  it('lists current top-10 pairs and reports nothing as new without a previous snapshot', () => {
    const t = trackTop10(rows, null);
    expect(t.current).toEqual(['cable size | /b/', 'idmt formula | /d/']);
    expect(t.achieved).toEqual([]);
    expect(t.lost).toEqual([]);
  });
  it('reports achieved, lost and steady against the previous snapshot', () => {
    const prev = { generated: '2026-11-01', start: '2026-10-04', end: '2026-10-31', top10: ['idmt formula | /d/', 'old query | /z/'] };
    const t = trackTop10(rows, prev);
    expect(t.achieved).toEqual(['cable size | /b/']);
    expect(t.lost).toEqual(['old query | /z/']);
    expect(t.steady).toEqual(['idmt formula | /d/']);
  });
  it('does not count a position-3 pair with one impression', () => {
    const t = trackTop10([{ query: 'x', page: '/p/', clicks: 0, impressions: 1, position: 3 }], null);
    expect(t.current).toEqual([]);
  });
});

describe('pageSummaries and lowCtrPages', () => {
  it('sums a page across queries and weights its position by impressions', () => {
    const s = pageSummaries(rows).find((x) => x.page === '/b/')!;
    expect(s.impressions).toBe(100);
    expect(s.clicks).toBe(1);
    expect(s.queries).toBe(2);
    expect(s.position).toBeCloseTo((12 * 40 + 8.5 * 60) / 100, 6);
    expect(s.ctr).toBeCloseTo(0.01, 9);
  });
  it('flags a shown-but-not-clicked page within reach of page 3', () => {
    const flagged = lowCtrPages(pageSummaries(rows), { minImpressions: 50, maxCtr: 0.01, maxPosition: 30 });
    expect(flagged.map((x) => x.page)).toEqual(['/b/']);
  });
});
