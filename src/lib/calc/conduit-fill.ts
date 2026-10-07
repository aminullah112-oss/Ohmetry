/**
 * Conduit fill (NEC Chapter 9). Sum the conductor areas (Table 5), compare with the allowed
 * fraction of the conduit's internal area (Table 1: 53 % for one, 31 % for two, 40 % for more than two),
 * using the Table 4 values for the chosen raceway. All conductors count, including equipment grounding
 * and bonding conductors (Chapter 9 Note 3 to Tables). The nipple exception (Note 4) is not modelled.
 */
import { THHN_AREA_IN2, EMT_TABLE_4, FILL_PERCENT } from '../../data/nec-tables';

export interface ConduitInput { conductors: { size: string; count: number }[] }
export interface ConduitResult {
  totalConductors: number; totalArea: number; allowedPercent: number;
  trade: string; allowedArea: number; fillPercent: number; internalArea: number;
  options: { trade: string; fillPercent: number; ok: boolean }[];
}

export function conduitFill(input: ConduitInput): ConduitResult {
  let n = 0, area = 0;
  for (const c of input.conductors) {
    if (!(c.count >= 0) || !Number.isInteger(c.count)) throw new Error('Conductor counts must be whole numbers');
    if (c.count === 0) continue;
    const a = THHN_AREA_IN2[c.size];
    if (a === undefined) throw new Error(`Unknown conductor size ${c.size}`);
    n += c.count; area += c.count * a;
  }
  if (n === 0) throw new Error('Add at least one conductor');
  const allowedPercent = n === 1 ? FILL_PERCENT.one : n === 2 ? FILL_PERCENT.two : FILL_PERCENT.over;
  const key = n === 1 ? 'p53' : n === 2 ? 'p31' : 'p40';
  const options = EMT_TABLE_4.map((e) => ({ trade: e.trade, fillPercent: (area / e.total) * 100, ok: area <= e[key] + 1e-9 }));
  const chosen = EMT_TABLE_4.find((e) => area <= e[key] + 1e-9);
  if (!chosen) throw new Error('These conductors do not fit in the largest EMT size (4 inch). Split them across raceways.');
  return {
    totalConductors: n, totalArea: area, allowedPercent, trade: chosen.trade, allowedArea: chosen[key],
    fillPercent: (area / chosen.total) * 100, internalArea: chosen.total, options,
  };
}
