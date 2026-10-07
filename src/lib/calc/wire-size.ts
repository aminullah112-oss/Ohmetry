/**
 * NEC conductor selection (design aid). Uses table data from src/data/nec-tables.ts.
 *
 *  (a) 125 % of continuous + 100 % of noncontinuous load must not exceed the ampacity in the
 *      termination-temperature column (60 or 75 C) of Table 310.16 (110.14(C), 210.19(A)(1)(a)).
 *  (b) Using the insulation-temperature column (75 or 90 C), the ampacity after ambient correction
 *      and adjustment must be at least the load (continuous + noncontinuous, no 125 %) (210.19(A)(1)(b)).
 *  (c) Optional voltage-drop limit, sized from conductor resistance.
 * The result is the largest of the sizes each check calls for.
 * Not modelled: 240.4(D) small-conductor OCPD limits, motor circuits (Art. 430), parallel conductors,
 * grounding conductor sizing, and 110.14(C) rules for equipment not marked for 75 C.
 */
import { SIZES, AMPACITY_310_16, AMBIENT_FACTORS, ADJUSTMENT_FACTORS, type WireSize } from '../../data/nec-tables';
import { awgToMm2 } from './awg-to-mm2';
import { minAreaMm2 } from './conductor-drop';

export type Material = 'copper' | 'aluminum';

export interface WireInput {
  continuousA: number; noncontinuousA: number; material: Material;
  terminalC: 60 | 75; insulationC: 75 | 90;
  ambientIndex: number; adjustmentIndex: number;
  /** Optional voltage-drop check. */
  drop?: { oneWayFeet: number; volts: number; percent: number; circuit: 'two-wire' | 'three' };
}
export interface WireResult {
  requiredTerminalA: number; requiredDeratedA: number; k: number;
  bySize: { terminal: WireSize; derated: WireSize; drop: WireSize | null };
  size: WireSize; terminalAmpacity: number; insulationAmpacity: number; deratedAmpacity: number;
  governs: 'termination' | 'derating' | 'voltage drop';
}

const col = (id: string, m: Material, c: 60 | 75 | 90): number | null => {
  const row = AMPACITY_310_16[id];
  const arr = m === 'copper' ? row.cu : row.al;
  return arr ? arr[c === 60 ? 0 : c === 75 ? 1 : 2] : null;
};

const sizeAreaMm2 = (s: WireSize) => (s.kcmil !== undefined ? s.kcmil * 0.5067 : awgToMm2(s.awg!));

export function wireSize(i: WireInput): WireResult {
  if (!(i.continuousA >= 0) || !(i.noncontinuousA >= 0) || i.continuousA + i.noncontinuousA <= 0) throw new Error('Enter a load greater than zero');
  if (i.insulationC < i.terminalC) throw new Error('Insulation rating must be at least the termination rating');
  const amb = AMBIENT_FACTORS[i.ambientIndex];
  const adj = ADJUSTMENT_FACTORS[i.adjustmentIndex];
  if (!amb || !adj) throw new Error('Choose an ambient temperature and conductor count');
  const kTemp = i.insulationC === 75 ? amb.f75 : amb.f90;
  if (kTemp === null) throw new Error(`No correction factor is listed for ${amb.range} with ${i.insulationC} C insulation`);
  const k = kTemp * adj.factor;

  const requiredTerminalA = 1.25 * i.continuousA + i.noncontinuousA;
  const requiredDeratedA = i.continuousA + i.noncontinuousA;
  const candidates = SIZES.filter((s) => col(s.id, i.material, i.terminalC) !== null);
  const pick = (ok: (s: WireSize) => boolean) => candidates.find(ok) ?? null;
  const eps = 1e-9;

  const terminal = pick((s) => col(s.id, i.material, i.terminalC)! >= requiredTerminalA - eps);
  const derated = pick((s) => col(s.id, i.material, i.insulationC)! * k >= requiredDeratedA - eps);
  if (!terminal || !derated) throw new Error('Load exceeds the largest size in this calculator (500 kcmil). Use parallel conductors and the full code tables.');

  let drop: WireSize | null = null;
  if (i.drop) {
    const d = i.drop;
    if (!(d.oneWayFeet > 0) || !(d.volts > 0) || !(d.percent > 0 && d.percent < 100)) throw new Error('Check the voltage-drop inputs');
    const area = minAreaMm2({ amps: requiredDeratedA, oneWayMetres: d.oneWayFeet * 0.3048, volts: d.volts, maxDropPercent: d.percent, material: i.material === 'copper' ? 'copper' : 'aluminium', tempC: 75, circuit: d.circuit });
    drop = pick((s) => sizeAreaMm2(s) >= area - eps);
    if (!drop) throw new Error('Voltage drop needs more than 500 kcmil: use parallel conductors or a higher voltage.');
  }

  const order = (s: WireSize) => SIZES.findIndex((x) => x.id === s.id);
  const final = [terminal, derated, drop].filter((s): s is WireSize => s !== null).reduce((a, b) => (order(b) > order(a) ? b : a));
  const [iT, iD, iV] = [order(terminal), order(derated), drop ? order(drop) : -1];
  const governs: WireResult['governs'] = iV > Math.max(iT, iD) ? 'voltage drop' : iD > iT ? 'derating' : 'termination';
  return {
    requiredTerminalA, requiredDeratedA, k,
    bySize: { terminal, derated, drop },
    size: final,
    terminalAmpacity: col(final.id, i.material, i.terminalC)!,
    insulationAmpacity: col(final.id, i.material, i.insulationC)!,
    deratedAmpacity: col(final.id, i.material, i.insulationC)! * k,
    governs,
  };
}
