/**
 * Motor branch circuit under NEC Article 430 (design aid).
 *  - Full-load current comes from Table 430.248 (single-phase) or 430.250 (three-phase), not the nameplate (430.6(A)(1)).
 *  - Conductors: at least 125 % of that current (430.22).
 *  - Overload protection from the nameplate current: 125 % (service factor 1.15 or more, or marked temperature rise 40 C or less)
 *    or 115 % otherwise, with a maximum setting of 140 % or 130 % (430.32).
 *  - Short-circuit and ground-fault device: no more than the Table 430.52 percentage of the table current; if that is not a
 *    standard size, the next higher standard size is permitted (430.52(C)(1) Exception 1).
 * Not modelled: several motors on one circuit, soft starters and drives, the higher ratings allowed when the first choice cannot
 * carry the starting current, disconnect sizing, and high-efficiency or Design E exceptions.
 */
import { MOTOR_HP_3PH, MOTOR_FLC_3PH, MOTOR_HP_1PH, MOTOR_FLC_1PH, MOTOR_DEVICE_MAX } from '../../data/nec-tables';
import { STANDARD_RATINGS } from './breaker-size';

export type MotorPhase = 'single' | 'three';
export type DeviceKind = 'inverse' | 'dual' | 'fuse' | 'instantaneous';

export interface MotorInput { hp: number; volts: number; phase: MotorPhase; device: DeviceKind; nameplateA?: number; robustMotor?: boolean }
export interface MotorResult {
  flc: number; minConductorA: number; deviceCalcA: number; deviceMaxA: number; devicePercent: number;
  overloadA?: number; overloadMaxA?: number;
}

export function motorHpOptions(phase: MotorPhase): number[] { return phase === 'three' ? MOTOR_HP_3PH : MOTOR_HP_1PH; }
export function motorVoltOptions(phase: MotorPhase): string[] { return Object.keys(phase === 'three' ? MOTOR_FLC_3PH : MOTOR_FLC_1PH); }

export function motorFlc(hp: number, volts: number, phase: MotorPhase): number {
  const hps = motorHpOptions(phase);
  const table = (phase === 'three' ? MOTOR_FLC_3PH : MOTOR_FLC_1PH)[String(volts)];
  if (!table) throw new Error(`No ${phase}-phase table column for ${volts} V. Choose one of: ${motorVoltOptions(phase).join(', ')}`);
  const i = hps.findIndex((h) => Math.abs(h - hp) < 1e-6);
  if (i < 0) throw new Error(`No table row for ${hp} hp`);
  return table[i];
}

export function motorCircuit(m: MotorInput): MotorResult {
  const flc = motorFlc(m.hp, m.volts, m.phase);
  const d = MOTOR_DEVICE_MAX[m.device];
  if (!d) throw new Error('Unknown device type');
  const deviceCalcA = (flc * d.percent) / 100;
  const deviceMaxA = STANDARD_RATINGS.find((r) => r >= deviceCalcA - 1e-9);
  if (deviceMaxA === undefined) throw new Error('Device rating is above the largest standard size');
  let overloadA: number | undefined, overloadMaxA: number | undefined;
  if (m.nameplateA !== undefined) {
    if (!(m.nameplateA > 0)) throw new Error('Nameplate current must be positive');
    const robust = m.robustMotor !== false;
    overloadA = m.nameplateA * (robust ? 1.25 : 1.15);
    overloadMaxA = m.nameplateA * (robust ? 1.4 : 1.3);
  }
  return { flc, minConductorA: flc * 1.25, deviceCalcA, deviceMaxA, devicePercent: d.percent, overloadA, overloadMaxA };
}
