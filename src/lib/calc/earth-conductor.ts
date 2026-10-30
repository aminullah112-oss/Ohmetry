/**
 * Minimum cross-section of a protective (earth) conductor by the adiabatic method:
 *   S = sqrt(I^2 * t) / k
 * k is calculated from the material constants of IEC 60949, not copied from a table:
 *   k = sqrt( Qc * (B + 20) / rho20 * ln(1 + (final - initial) / (B + initial)) )
 * Qc volumetric heat capacity (J/degC.mm3), B reciprocal of the resistance temperature coefficient (degC),
 * rho20 resistivity at 20 degC (ohm.mm). The results agree with the rounded k values printed in IEC 60364-5-54
 * (for example 143 for copper PVC and 176 for copper XLPE) to within about 1 %.
 * Valid for clearing times up to 5 s. Not modelled: the minimum sizes for mechanical strength, the phase-conductor
 * rule, and NEC Table 250.122, which sizes equipment grounding conductors from the overcurrent device rating.
 */
export type EarthMaterial = 'copper' | 'aluminium' | 'steel';
export type Insulation = 'pvc' | 'xlpe';
/** separate: not part of a cable, starts at 30 degC. core: a core of a multicore cable, starts at the insulation's rated temperature. */
export type Installation = 'separate' | 'core';

const MATERIAL: Record<EarthMaterial, { name: string; qc: number; beta: number; rho20: number }> = {
  copper: { name: 'Copper', qc: 3.45e-3, beta: 234.5, rho20: 17.241e-6 },
  aluminium: { name: 'Aluminium', qc: 2.5e-3, beta: 228, rho20: 28.264e-6 },
  steel: { name: 'Steel', qc: 3.8e-3, beta: 202, rho20: 138e-6 },
};
const INSULATION: Record<Insulation, { name: string; ratedC: number; finalC: number }> = {
  pvc: { name: 'PVC', ratedC: 70, finalC: 160 },
  xlpe: { name: 'XLPE or EPR', ratedC: 90, finalC: 250 },
};
/** Final temperature for PVC above 300 mm2 (IEC 60364-5-54). */
const PVC_LARGE_FINAL_C = 140;
/** Preferred conductor sizes in mm2 (IEC 60228). */
export const STANDARD_SIZES_MM2 = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400];

export const materialName = (m: EarthMaterial) => MATERIAL[m].name;
export const insulationName = (i: Insulation) => INSULATION[i].name;

export function kFactor(material: EarthMaterial, initialC: number, finalC: number): number {
  const m = MATERIAL[material];
  if (!(finalC > initialC)) throw new Error('Final temperature must be above the initial temperature');
  return Math.sqrt(((m.qc * (m.beta + 20)) / m.rho20) * Math.log(1 + (finalC - initialC) / (m.beta + initialC)));
}

export interface EarthConductorResult {
  k: number; initialC: number; finalC: number; sMinMm2: number; sStandardMm2: number | null; i2t: number; pvcLargeApplied: boolean;
}

export function earthConductor(i: { faultA: number; timeS: number; material: EarthMaterial; insulation: Insulation; installation: Installation }): EarthConductorResult {
  if (!(i.faultA > 0) || !(i.timeS > 0)) throw new Error('Fault current and clearing time must be positive');
  if (i.timeS > 5) throw new Error('The adiabatic formula is valid for clearing times up to 5 s');
  if (i.material === 'steel' && i.installation === 'core') throw new Error('Steel is not used as the core of a cable');
  const ins = INSULATION[i.insulation];
  const initialC = i.installation === 'separate' ? 30 : ins.ratedC;
  const i2t = i.faultA * i.faultA * i.timeS;
  const size = (finalC: number) => { const k = kFactor(i.material, initialC, finalC); return { k, s: Math.sqrt(i2t) / k, finalC }; };
  let r = size(ins.finalC);
  let pvcLargeApplied = false;
  if (i.insulation === 'pvc' && r.s > 300) { r = size(PVC_LARGE_FINAL_C); pvcLargeApplied = true; }
  const sStandard = STANDARD_SIZES_MM2.find((s) => s >= r.s) ?? null;
  return { k: r.k, initialC, finalC: r.finalC, sMinMm2: r.s, sStandardMm2: sStandard, i2t, pvcLargeApplied };
}
