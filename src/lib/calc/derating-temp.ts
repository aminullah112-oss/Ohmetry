/**
 * Ambient temperature correction factor for a cable, from the thermal relationship behind the IEC 60364-5-52 and NEC tables:
 *   k = sqrt( (Tmax - Tambient) / (Tmax - Treference) )
 * Tmax is the conductor's maximum operating temperature, Treference the ambient the rating table assumes
 * (30 degC in air, 20 degC in ground). The factors printed in the standards are this value rounded to two decimals.
 * It covers ambient temperature only: grouping, soil thermal resistivity, depth and harmonics are separate factors
 * that come from the standard's own tables.
 */
export function tempCorrection(maxC: number, referenceC: number, ambientC: number): number {
  if (![maxC, referenceC, ambientC].every(Number.isFinite)) throw new Error('Enter numbers for every temperature');
  if (!(maxC > referenceC)) throw new Error('The conductor maximum temperature must be above the reference temperature');
  if (!(ambientC < maxC)) throw new Error('The ambient temperature must be below the conductor maximum temperature');
  return Math.sqrt((maxC - ambientC) / (maxC - referenceC));
}

export const AIR_REFERENCE_C = 30;
export const GROUND_REFERENCE_C = 20;
