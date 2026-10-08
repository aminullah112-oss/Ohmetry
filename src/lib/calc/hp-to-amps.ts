/**
 * Motor current from horsepower, two ways.
 *  - Table: NEC full-load current from Table 430.250 (three-phase) or 430.248 (single-phase). This is the value the code uses
 *    to size conductors and short-circuit protection, whatever the nameplate says.
 *  - Estimate: I = hp * 745.7 / (k * V * efficiency * power factor), k = sqrt(3) for three-phase and 1 for single-phase. An
 *    approximation of the running current at full load; the nameplate is the better source for a real motor.
 */
import { motorFlc, type MotorPhase } from './motor-circuit';
import { hpToKw } from './kw-hp';

export interface HpToAmpsResult { tableA: number; estimatedA: number }

export function hpToAmps(hp: number, volts: number, phase: MotorPhase, efficiency: number, powerFactor: number): HpToAmpsResult {
  if (!(efficiency > 0 && efficiency <= 1)) throw new Error('Efficiency must be in (0, 1]');
  if (!(powerFactor > 0 && powerFactor <= 1)) throw new Error('Power factor must be in (0, 1]');
  const tableA = motorFlc(hp, volts, phase);
  const watts = hpToKw(hp, 'mechanical') * 1000;
  const estimatedA = watts / ((phase === 'three' ? Math.sqrt(3) : 1) * volts * efficiency * powerFactor);
  return { tableA, estimatedA };
}
