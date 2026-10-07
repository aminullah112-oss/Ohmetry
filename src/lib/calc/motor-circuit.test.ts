import { describe, expect, it } from 'vitest';
import { motorCircuit, motorFlc, motorHpOptions } from './motor-circuit';
import { MOTOR_FLC_3PH, MOTOR_FLC_1PH } from '../../data/nec-tables';

describe('motor table internal consistency', () => {
  // Table 430.250 values at 460 V are exactly half of those at 230 V
  it('460 V column is half the 230 V column', () => {
    MOTOR_FLC_3PH['230'].forEach((v, i) => expect(MOTOR_FLC_3PH['460'][i]).toBeCloseTo(v / 2, 6));
  });
  // The 208 V column follows 1.10 x the 230 V column, and 575 V is about 0.4 x it. The printed columns are rounded on their
  // own, so allow 0.5 A and 0.7 A: this catches typos (which are large) without pretending the table is an exact ratio.
  it('208 V column is 1.10 times the 230 V column within rounding', () => {
    MOTOR_FLC_3PH['230'].forEach((v, i) => expect(Math.abs(MOTOR_FLC_3PH['208'][i] - v * 1.1)).toBeLessThanOrEqual(0.5));
  });
  it('575 V column is about 0.4 times the 230 V column within rounding', () => {
    MOTOR_FLC_3PH['230'].forEach((v, i) => expect(Math.abs(MOTOR_FLC_3PH['575'][i] - v * 0.4)).toBeLessThanOrEqual(0.7));
  });
  it('single-phase 230 V is half of 115 V', () => {
    MOTOR_FLC_1PH['115'].forEach((v, i) => expect(Math.abs(MOTOR_FLC_1PH['230'][i] - v / 2)).toBeLessThanOrEqual(0.05));
  });
  it('every table is monotonic in horsepower', () => {
    for (const col of Object.values(MOTOR_FLC_3PH)) col.forEach((v, i) => { if (i) expect(v).toBeGreaterThan(col[i - 1]); });
  });
  it('column lengths match the horsepower lists', () => {
    for (const c of Object.values(MOTOR_FLC_3PH)) expect(c).toHaveLength(motorHpOptions('three').length);
    for (const c of Object.values(MOTOR_FLC_1PH)) expect(c).toHaveLength(motorHpOptions('single').length);
  });
});

describe('motorCircuit', () => {
  // 10 hp, 460 V, three-phase: FLC 14 A. Conductors 1.25*14 = 17.5 A.
  // Inverse-time breaker 250 % = 35 A (a standard size). Dual-element fuse 175 % = 24.5 -> 25 A.
  // Non-time-delay fuse 300 % = 42 -> 45 A. Instantaneous trip 800 % = 112 -> 125 A.
  const base = { hp: 10, volts: 460, phase: 'three' as const };
  it('10 hp 460 V three-phase', () => {
    expect(motorFlc(10, 460, 'three')).toBe(14);
    const r = motorCircuit({ ...base, device: 'inverse' });
    expect(r.minConductorA).toBeCloseTo(17.5, 9);
    expect(r.deviceCalcA).toBeCloseTo(35, 9);
    expect(r.deviceMaxA).toBe(35);
    expect(motorCircuit({ ...base, device: 'dual' }).deviceMaxA).toBe(25);
    expect(motorCircuit({ ...base, device: 'fuse' }).deviceMaxA).toBe(45);
    expect(motorCircuit({ ...base, device: 'instantaneous' }).deviceMaxA).toBe(125);
  });
  // 5 hp, 230 V, three-phase: 15.2 A -> conductors 19 A, breaker 250 % = 38 -> next standard 40 A
  it('5 hp 230 V rounds the breaker up to a standard size', () => {
    const r = motorCircuit({ hp: 5, volts: 230, phase: 'three', device: 'inverse' });
    expect(r.flc).toBe(15.2);
    expect(r.minConductorA).toBeCloseTo(19, 9);
    expect(r.deviceCalcA).toBeCloseTo(38, 9);
    expect(r.deviceMaxA).toBe(40);
  });
  // Overload from the nameplate: 13 A -> 125 % = 16.25 A, maximum 140 % = 18.2 A; 115 % and 130 % otherwise
  it('overload settings from the nameplate current', () => {
    const r = motorCircuit({ ...base, device: 'inverse', nameplateA: 13 });
    expect(r.overloadA).toBeCloseTo(16.25, 9);
    expect(r.overloadMaxA).toBeCloseTo(18.2, 9);
    const s = motorCircuit({ ...base, device: 'inverse', nameplateA: 13, robustMotor: false });
    expect(s.overloadA).toBeCloseTo(14.95, 9);
    expect(s.overloadMaxA).toBeCloseTo(16.9, 9);
  });
  it('single-phase 1 hp 115 V: 16 A', () => expect(motorFlc(1, 115, 'single')).toBe(16));
  it('rejects unsupported rows and columns', () => {
    expect(() => motorFlc(11, 460, 'three')).toThrow();
    expect(() => motorFlc(10, 480, 'three')).toThrow();
    expect(() => motorFlc(10, 460, 'single')).toThrow();
    expect(() => motorCircuit({ ...base, device: 'inverse', nameplateA: 0 })).toThrow();
  });
});
