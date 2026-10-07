/**
 * NEC table data used by the wire size and conduit fill calculators.
 *
 * STATUS: these values were entered from knowledge of the published tables and have NOT yet been
 * compared against a licensed copy of the code. While `verified` is false, the pages that use them
 * show a warning, are marked noindex and are left out of the sitemap.
 *
 * To verify: run `npm run tables`, compare every value with your copy of the NEC, correct this file,
 * then set `verified: true`, `edition` and `verifiedBy`. The code text itself is not reproduced here;
 * only numeric values with section references.
 */
export const NEC_TABLES = {
  verified: false,
  edition: 'NEC 2020 section numbering (confirm against your adopted edition)',
  verifiedBy: '',
};

/** Pages that must stay hidden from search until the tables are verified. */
export const TABLE_PAGES = ['/wire-size-calculator/', '/conduit-fill-calculator/'];

export interface WireSize { id: string; label: string; kcmil?: number; awg?: number }
/** Table 310.16 size order, smallest to largest. 1/0 is awg 0, 4/0 is awg -3. */
export const SIZES: WireSize[] = [
  { id: '14', label: '14 AWG', awg: 14 }, { id: '12', label: '12 AWG', awg: 12 }, { id: '10', label: '10 AWG', awg: 10 },
  { id: '8', label: '8 AWG', awg: 8 }, { id: '6', label: '6 AWG', awg: 6 }, { id: '4', label: '4 AWG', awg: 4 },
  { id: '3', label: '3 AWG', awg: 3 }, { id: '2', label: '2 AWG', awg: 2 }, { id: '1', label: '1 AWG', awg: 1 },
  { id: '1/0', label: '1/0 AWG', awg: 0 }, { id: '2/0', label: '2/0 AWG', awg: -1 }, { id: '3/0', label: '3/0 AWG', awg: -2 },
  { id: '4/0', label: '4/0 AWG', awg: -3 },
  { id: '250', label: '250 kcmil', kcmil: 250 }, { id: '300', label: '300 kcmil', kcmil: 300 },
  { id: '350', label: '350 kcmil', kcmil: 350 }, { id: '400', label: '400 kcmil', kcmil: 400 },
  { id: '500', label: '500 kcmil', kcmil: 500 },
];

/** Table 310.16 allowable ampacity [60 C, 75 C, 90 C]. null = size not listed for that material. Section 310.16. */
export const AMPACITY_310_16: Record<string, { cu: [number, number, number]; al: [number, number, number] | null }> = {
  '14': { cu: [15, 20, 25], al: null },
  '12': { cu: [20, 25, 30], al: [15, 20, 25] },
  '10': { cu: [30, 35, 40], al: [25, 30, 35] },
  '8': { cu: [40, 50, 55], al: [30, 40, 45] },
  '6': { cu: [55, 65, 75], al: [40, 50, 55] },
  '4': { cu: [70, 85, 95], al: [55, 65, 75] },
  '3': { cu: [85, 100, 115], al: [65, 75, 85] },
  '2': { cu: [95, 115, 130], al: [75, 90, 100] },
  '1': { cu: [110, 130, 145], al: [85, 100, 115] },
  '1/0': { cu: [125, 150, 170], al: [100, 120, 135] },
  '2/0': { cu: [145, 175, 195], al: [115, 135, 150] },
  '3/0': { cu: [165, 200, 225], al: [130, 155, 175] },
  '4/0': { cu: [195, 230, 260], al: [150, 180, 205] },
  '250': { cu: [215, 255, 290], al: [170, 205, 230] },
  '300': { cu: [240, 285, 320], al: [195, 230, 260] },
  '350': { cu: [260, 310, 350], al: [210, 250, 280] },
  '400': { cu: [280, 335, 380], al: [225, 270, 305] },
  '500': { cu: [320, 380, 430], al: [260, 310, 350] },
};

/** Section 310.15(B)(1) ambient temperature correction, base 30 C. Factors for [75 C, 90 C] insulation. null = not listed. */
export const AMBIENT_FACTORS: { range: string; f75: number | null; f90: number | null }[] = [
  { range: '21 to 25 C', f75: 1.05, f90: 1.04 },
  { range: '26 to 30 C', f75: 1.0, f90: 1.0 },
  { range: '31 to 35 C', f75: 0.94, f90: 0.96 },
  { range: '36 to 40 C', f75: 0.88, f90: 0.91 },
  { range: '41 to 45 C', f75: 0.82, f90: 0.87 },
  { range: '46 to 50 C', f75: 0.75, f90: 0.82 },
  { range: '51 to 55 C', f75: 0.67, f90: 0.76 },
  { range: '56 to 60 C', f75: 0.58, f90: 0.71 },
  { range: '61 to 65 C', f75: 0.47, f90: 0.65 },
  { range: '66 to 70 C', f75: 0.33, f90: 0.58 },
  { range: '71 to 75 C', f75: null, f90: 0.5 },
  { range: '76 to 80 C', f75: null, f90: 0.41 },
];

/** Section 310.15(C)(1) adjustment for more than three current-carrying conductors. */
export const ADJUSTMENT_FACTORS: { range: string; factor: number }[] = [
  { range: '1 to 3', factor: 1.0 },
  { range: '4 to 6', factor: 0.8 },
  { range: '7 to 9', factor: 0.7 },
  { range: '10 to 20', factor: 0.5 },
  { range: '21 to 30', factor: 0.45 },
  { range: '31 to 40', factor: 0.4 },
  { range: '41 and over', factor: 0.35 },
];

/** Chapter 9 Table 5, approximate area in square inches of THHN/THWN/THWN-2 conductors (stranded). */
export const THHN_AREA_IN2: Record<string, number> = {
  '14': 0.0097, '12': 0.0133, '10': 0.0211, '8': 0.0366, '6': 0.0507, '4': 0.0824, '3': 0.0973, '2': 0.1158,
  '1': 0.1562, '1/0': 0.1855, '2/0': 0.2223, '3/0': 0.2679, '4/0': 0.3237,
  '250': 0.397, '300': 0.4608, '350': 0.5242, '400': 0.5863, '500': 0.7073,
};

/** Chapter 9 Table 1 allowable fill by number of conductors. */
export const FILL_PERCENT = { one: 53, two: 31, over: 40 };

/** Chapter 9 Table 4 (Article 358, EMT) internal area in square inches: total, and at 53 %, 31 %, 40 %. */
export const EMT_TABLE_4: { trade: string; total: number; p53: number; p31: number; p40: number }[] = [
  { trade: '1/2"', total: 0.304, p53: 0.161, p31: 0.094, p40: 0.122 },
  { trade: '3/4"', total: 0.533, p53: 0.283, p31: 0.165, p40: 0.213 },
  { trade: '1"', total: 0.864, p53: 0.458, p31: 0.268, p40: 0.346 },
  { trade: '1-1/4"', total: 1.496, p53: 0.793, p31: 0.464, p40: 0.598 },
  { trade: '1-1/2"', total: 2.036, p53: 1.079, p31: 0.631, p40: 0.814 },
  { trade: '2"', total: 3.356, p53: 1.778, p31: 1.04, p40: 1.342 },
  { trade: '2-1/2"', total: 5.858, p53: 3.105, p31: 1.816, p40: 2.343 },
  { trade: '3"', total: 8.846, p53: 4.688, p31: 2.742, p40: 3.538 },
  { trade: '3-1/2"', total: 11.545, p53: 6.119, p31: 3.579, p40: 4.618 },
  { trade: '4"', total: 14.753, p53: 7.819, p31: 4.573, p40: 5.901 },
];
