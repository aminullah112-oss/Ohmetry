/**
 * Neutral current in a three-phase four-wire circuit, from two situations that can be derived directly.
 *
 * 1. Unbalanced load. With phase currents Ia, Ib, Ic that are 120 degrees apart (the same power factor on each phase)
 *    and no triplen harmonics, the neutral carries the phasor sum:
 *      In = sqrt( Ia^2 + Ib^2 + Ic^2 - Ia*Ib - Ib*Ic - Ic*Ia )
 *
 * 2. Third-harmonic load on a balanced circuit. Triplen harmonics (3rd, 9th, ...) are in phase on all three phases, so
 *    they add in the neutral instead of cancelling. For a 3rd harmonic of k times the fundamental on each phase:
 *      phase RMS  = I1 * sqrt(1 + k^2)
 *      neutral    = 3 * k * I1
 *    Harmonics that are not triplen (5th, 7th, ...) cancel in the neutral on a balanced circuit.
 *
 * These give the current to size the neutral for. The conductor size, the derating that harmonic currents trigger and
 * whether the neutral may be smaller than the phase conductors come from the standard in force (IEC 60364, NEC, BS 7671).
 */
export function neutralFromPhases(ia: number, ib: number, ic: number): number {
  if (![ia, ib, ic].every(Number.isFinite)) throw new Error('Enter a number for every phase current');
  if (ia < 0 || ib < 0 || ic < 0) throw new Error('Phase currents cannot be negative');
  const v = ia * ia + ib * ib + ic * ic - ia * ib - ib * ic - ic * ia;
  return Math.sqrt(Math.max(0, v));
}

export interface HarmonicNeutral { fundamentalA: number; neutralA: number; ratioToPhase: number }

/** phaseRmsA is the measured true-RMS current per phase; thirdPct is the 3rd harmonic as a percentage of the fundamental. */
export function neutralFromThirdHarmonic(phaseRmsA: number, thirdPct: number): HarmonicNeutral {
  if (![phaseRmsA, thirdPct].every(Number.isFinite)) throw new Error('Enter numbers for the phase current and the 3rd harmonic');
  if (!(phaseRmsA > 0)) throw new Error('The phase current must be above zero');
  if (thirdPct < 0) throw new Error('The 3rd harmonic cannot be negative');
  const k = thirdPct / 100;
  const fundamentalA = phaseRmsA / Math.sqrt(1 + k * k);
  const neutralA = 3 * k * fundamentalA;
  return { fundamentalA, neutralA, ratioToPhase: neutralA / phaseRmsA };
}
