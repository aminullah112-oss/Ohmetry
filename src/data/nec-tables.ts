/**
 * NEC table data used by the wire size and conduit fill calculators.
 *
 * STATUS: tracked per table in TABLE_STATUS below. Values were entered from knowledge of the published
 * tables and are only trusted once a table is marked verified. Pages that use an unverified table show a
 * warning, are marked noindex and are left out of the sitemap.
 *
 * To verify: run `npm run tables`, compare each table with your copy of the NEC, correct this file,
 * then set that table's `verified`, `by` and `date`. The code text itself is not reproduced here;
 * only numeric values with section references.
 */
export const NEC_TABLES = {
  edition: 'NEC 2020 section numbering (confirm against your adopted edition)',
};

export type TableId =
  | '310.16' | '310.15(B)(1)' | '310.15(C)(1)'
  | 'Ch9-T5' | 'Ch9-T1' | 'Ch9-T4-EMT' | 'Ch9-T4-RMC' | 'Ch9-T4-PVC40'
  | '430.250' | '430.248' | '430.52' | '240.6(A)';

/**
 * Verification status, one entry per table. Set `verified: true` (with who and when) only after the values
 * have been compared with a copy of the code. A page unlocks when every table it needs is verified.
 */
export const TABLE_STATUS: Record<TableId, { label: string; verified: boolean; by?: string; date?: string }> = {
  '310.16': { label: 'Table 310.16 allowable ampacities', verified: true, by: 'Site owner, row by row against their copy of the NEC', date: '2026-10-07' },
  '310.15(B)(1)': { label: 'Table 310.15(B)(1) ambient temperature correction', verified: true, by: 'Site owner, row by row against their copy of the NEC', date: '2026-10-07' },
  '310.15(C)(1)': { label: 'Table 310.15(C)(1) adjustment for more than three conductors', verified: true, by: 'Site owner, row by row against their copy of the NEC', date: '2026-10-07' },
  'Ch9-T5': { label: 'Chapter 9 Table 5 conductor areas (THHN/THWN)', verified: true, by: 'Site owner, row by row against their copy of the NEC', date: '2026-10-07' },
  'Ch9-T1': { label: 'Chapter 9 Table 1 fill percentages', verified: true, by: 'Site owner, row by row against their copy of the NEC', date: '2026-10-07' },
  'Ch9-T4-EMT': { label: 'Chapter 9 Table 4 EMT areas', verified: true, by: 'Site owner, row by row against their copy of the NEC', date: '2026-10-07' },
  'Ch9-T4-RMC': { label: 'Chapter 9 Table 4 RMC areas', verified: false },
  'Ch9-T4-PVC40': { label: 'Chapter 9 Table 4 PVC Schedule 40 areas', verified: false },
  '430.250': { label: 'Table 430.250 three-phase motor full-load current', verified: false },
  '430.248': { label: 'Table 430.248 single-phase motor full-load current', verified: false },
  '430.52': { label: 'Table 430.52 maximum device ratings for motor circuits', verified: false },
  '240.6(A)': { label: 'Section 240.6(A) standard overcurrent device ratings', verified: false },
};

/** Which tables each page depends on. A page is hidden from search until all of them are verified. */
export const PAGE_REQUIRES: Record<string, TableId[]> = {
  '/wire-size-calculator/': ['310.16', '310.15(B)(1)', '310.15(C)(1)'],
  '/conduit-fill-calculator/': ['Ch9-T5', 'Ch9-T1', 'Ch9-T4-EMT', 'Ch9-T4-RMC', 'Ch9-T4-PVC40'],
  '/motor-circuit-calculator/': ['430.250', '430.248', '430.52', '240.6(A)'],
};

export const TABLE_PAGES = Object.keys(PAGE_REQUIRES);
export const pendingTables = (path: string): TableId[] => (PAGE_REQUIRES[path] ?? []).filter((t) => !TABLE_STATUS[t].verified);
export const pageVerified = (path: string) => pendingTables(path).length === 0;

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

export interface ConduitRow { trade: string; total: number; p53: number; p31: number; p40: number }
export type ConduitType = 'EMT' | 'RMC' | 'PVC40';

/** Chapter 9 Table 4 (Article 358, EMT) internal area in square inches: total, and at 53 %, 31 %, 40 %. */
export const EMT_TABLE_4: ConduitRow[] = [
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

/** Fill columns derived from the total internal area, rounded to three decimals. The printed code table can differ in the last digit. */
const r3 = (x: number) => Math.round(x * 1000) / 1000;
const derive = (trade: string, total: number): ConduitRow => ({ trade, total, p53: r3(total * 0.53), p31: r3(total * 0.31), p40: r3(total * 0.4) });
const TRADES = ['1/2"', '3/4"', '1"', '1-1/4"', '1-1/2"', '2"', '2-1/2"', '3"', '3-1/2"', '4"'];

/** Chapter 9 Table 4 totals (in2) for rigid metal conduit (Article 344). Entered from memory: verify. */
const RMC_TOTALS = [0.314, 0.549, 0.887, 1.526, 2.071, 3.408, 4.866, 7.499, 10.01, 12.882];
/** Chapter 9 Table 4 totals (in2) for rigid PVC Schedule 40 (Article 352). Entered from memory: verify. */
const PVC40_TOTALS = [0.285, 0.508, 0.832, 1.453, 1.986, 3.291, 4.695, 7.268, 9.737, 12.554];

export const CONDUITS: Record<ConduitType, { label: string; short: string; article: string; rows: ConduitRow[] }> = {
  EMT: { label: 'EMT, electrical metallic tubing (Article 358)', short: 'EMT', article: '358', rows: EMT_TABLE_4 },
  RMC: { label: 'RMC, rigid metal conduit (Article 344)', short: 'RMC', article: '344', rows: TRADES.map((t, i) => derive(t, RMC_TOTALS[i])) },
  PVC40: { label: 'PVC Schedule 40 (Article 352)', short: 'PVC-40', article: '352', rows: TRADES.map((t, i) => derive(t, PVC40_TOTALS[i])) },
};

/** Table 430.250: three-phase AC induction motor full-load current (A) by horsepower and voltage. Entered from memory: verify. */
export const MOTOR_HP_3PH = [0.5, 0.75, 1, 1.5, 2, 3, 5, 7.5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100, 125, 150, 200];
export const MOTOR_FLC_3PH: Record<string, number[]> = {
  '208': [2.4, 3.5, 4.6, 6.6, 7.5, 10.6, 16.7, 24.2, 30.8, 46.2, 59.4, 74.8, 88, 114, 143, 169, 211, 273, 343, 396, 528],
  '230': [2.2, 3.2, 4.2, 6.0, 6.8, 9.6, 15.2, 22, 28, 42, 54, 68, 80, 104, 130, 154, 192, 248, 312, 360, 480],
  '460': [1.1, 1.6, 2.1, 3.0, 3.4, 4.8, 7.6, 11, 14, 21, 27, 34, 40, 52, 65, 77, 96, 124, 156, 180, 240],
  '575': [0.9, 1.3, 1.7, 2.4, 2.7, 3.9, 6.1, 9, 11, 17, 22, 27, 32, 41, 52, 62, 77, 99, 125, 144, 192],
};
/** Table 430.248: single-phase motor full-load current (A). Entered from memory: verify. */
export const MOTOR_HP_1PH = [1 / 6, 0.25, 1 / 3, 0.5, 0.75, 1, 1.5, 2, 3, 5, 7.5, 10];
export const MOTOR_FLC_1PH: Record<string, number[]> = {
  '115': [4.4, 5.8, 7.2, 9.8, 13.8, 16, 20, 24, 34, 56, 80, 100],
  '230': [2.2, 2.9, 3.6, 4.9, 6.9, 8, 10, 12, 17, 28, 40, 50],
};
/** Table 430.52: maximum rating of the branch-circuit short-circuit and ground-fault device, percent of full-load current. */
export const MOTOR_DEVICE_MAX: Record<string, { label: string; percent: number }> = {
  inverse: { label: 'Inverse-time circuit breaker', percent: 250 },
  dual: { label: 'Dual-element (time-delay) fuse', percent: 175 },
  fuse: { label: 'Non-time-delay fuse', percent: 300 },
  instantaneous: { label: 'Instantaneous-trip breaker', percent: 800 },
};
