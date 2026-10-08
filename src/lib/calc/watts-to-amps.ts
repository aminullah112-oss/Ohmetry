/** Current from real power. DC: I = P/V. AC single: P/(V*PF). AC three-phase: P/(sqrt3*V_LL*PF). */
export type Supply = 'dc' | 'single' | 'three';

export function wattsToAmps(watts: number, volts: number, powerFactor: number, supply: Supply): number {
  if (!(watts > 0) || !(volts > 0)) throw new Error('Watts and volts must be positive');
  if (supply === 'dc') return watts / volts;
  if (!(powerFactor > 0 && powerFactor <= 1)) throw new Error('Power factor must be in (0, 1]');
  return watts / ((supply === 'three' ? Math.sqrt(3) : 1) * volts * powerFactor);
}
