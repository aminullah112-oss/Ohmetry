/**
 * Three-phase fault level at the end of a cable, by the simplified IEC 60909 method.
 *   Source:       Z = c * Un^2 / Sk''  (X/R given), omitted for an infinite bus
 *   Transformer:  Z = (zt% / 100) * Un^2 / S_tr  (X/R given), no correction factor KT
 *   Cable:        R from the conductor resistivity at 20 C (maximum fault) or at the stated temperature (minimum fault), X from the data sheet
 *   Fault:        Ik'' = c * Un / (sqrt3 * |Z|), with the R and X of every impedance in series added separately
 *   Peak:         ip = kappa * sqrt2 * Ik'',  kappa = 1.02 + 0.98 * exp(-3 R / X)
 * Not modelled: motor contribution, the transformer correction factor, unbalanced faults and parallel sources.
 * The source impedance is held at its maximum-case value in the minimum case, which errs towards a lower minimum.
 */
import { resistivity, type Material } from './conductor-drop';

export interface FaultInput {
  un: number;             // system voltage, V line-to-line
  cMax: number;           // voltage factor, maximum fault
  cMin: number;           // voltage factor, minimum fault
  sourceMva?: number;     // source fault level; undefined for an infinite bus
  sourceXr: number;
  trKva: number;
  trZPercent: number;
  trXr: number;
  lengthM: number;
  areaMm2: number;
  material: Material;
  xOhmPerKm: number;
  parallel: number;
  minTempC: number;       // conductor temperature for the minimum fault
}

export interface FaultResult {
  ikTransformerKa: number;  // at the transformer terminals
  ikCableEndKa: number;     // at the end of the cable
  kappa: number;
  ipKa: number;             // peak at the cable end
  ikMinKa: number;          // minimum, at the cable end, hot cable
  cableR: number;           // ohm, at 20 C
  cableX: number;           // ohm
  zTotalOhm: number;        // at the cable end, maximum case
}

const S3 = Math.sqrt(3);
const split = (z: number, xr: number) => ({ r: z / Math.sqrt(1 + xr * xr), x: (z * xr) / Math.sqrt(1 + xr * xr) });

export function faultAtCableEnd(f: FaultInput): FaultResult {
  for (const [v, n] of [[f.un, 'Voltage'], [f.trKva, 'Transformer rating'], [f.lengthM, 'Cable length'], [f.areaMm2, 'Cable cross-section'], [f.parallel, 'Parallel cables']] as [number, string][])
    if (!(v > 0)) throw new Error(`${n} must be positive`);
  if (!(f.trZPercent > 0 && f.trZPercent < 100)) throw new Error('Transformer impedance must be between 0 and 100 %');
  if (f.sourceMva !== undefined && !(f.sourceMva > 0)) throw new Error('Source fault level must be positive');
  for (const [v, n] of [[f.sourceXr, 'Source X/R'], [f.trXr, 'Transformer X/R']] as [number, string][]) if (!(v > 0)) throw new Error(`${n} must be positive`);
  if (!(f.cMax >= 1 && f.cMax <= 1.2)) throw new Error('Maximum voltage factor c is normally 1.05 or 1.10');
  if (!(f.cMin > 0 && f.cMin <= 1)) throw new Error('Minimum voltage factor c must be between 0 and 1');
  if (!(f.xOhmPerKm >= 0)) throw new Error('Reactance cannot be negative');
  if (!(f.minTempC >= 20 && f.minTempC <= 150)) throw new Error('Conductor temperature must be between 20 and 150 C');

  const zq = f.sourceMva === undefined ? { r: 0, x: 0 } : split((f.cMax * f.un * f.un) / (f.sourceMva * 1e6), f.sourceXr);
  const zt = split(((f.trZPercent / 100) * f.un * f.un) / (f.trKva * 1000), f.trXr);
  const r1 = zq.r + zt.r, x1 = zq.x + zt.x;
  const cableR = (resistivity(f.material, 20) / f.areaMm2) * f.lengthM / f.parallel;
  const cableRHot = (resistivity(f.material, f.minTempC) / f.areaMm2) * f.lengthM / f.parallel;
  const cableX = (f.xOhmPerKm * f.lengthM) / 1000 / f.parallel;

  const ik = (c: number, r: number, x: number) => (c * f.un) / (S3 * Math.hypot(r, x)) / 1000;
  const r2 = r1 + cableR, x2 = x1 + cableX;
  const ikCableEndKa = ik(f.cMax, r2, x2);
  const kappa = 1.02 + 0.98 * Math.exp((-3 * r2) / x2);
  return {
    ikTransformerKa: ik(f.cMax, r1, x1),
    ikCableEndKa,
    kappa,
    ipKa: kappa * Math.SQRT2 * ikCableEndKa,
    ikMinKa: ik(f.cMin, r1 + cableRHot, x2),
    cableR, cableX,
    zTotalOhm: Math.hypot(r2, x2),
  };
}
