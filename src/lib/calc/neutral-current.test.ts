import { describe, expect, it } from 'vitest';
import { neutralFromPhases, neutralFromThirdHarmonic } from './neutral-current';

describe('neutralFromPhases (unbalanced load, 120 degree phasors)', () => {
  it('is zero when the phases are balanced', () => {
    expect(neutralFromPhases(100, 100, 100)).toBeCloseTo(0, 9);
  });
  it('equals the phase current when only one phase is loaded', () => {
    expect(neutralFromPhases(100, 0, 0)).toBeCloseTo(100, 9);
  });
  it('equals the phase current when two equal phases are loaded', () => {
    expect(neutralFromPhases(100, 100, 0)).toBeCloseTo(100, 9);
  });
  it('matches the phasor sum for 100, 50, 0 A: sqrt(7500) = 86.60 A', () => {
    // 100 at 0 deg plus 50 at -120 deg = 75 - j43.30, magnitude 86.60
    expect(neutralFromPhases(100, 50, 0)).toBeCloseTo(86.6025, 4);
  });
  it('does not depend on which phase carries which current', () => {
    expect(neutralFromPhases(30, 80, 55)).toBeCloseTo(neutralFromPhases(80, 55, 30), 9);
  });
  it('rejects negative and non-numeric input', () => {
    expect(() => neutralFromPhases(-1, 0, 0)).toThrow();
    expect(() => neutralFromPhases(NaN, 0, 0)).toThrow();
  });
});

describe('neutralFromThirdHarmonic (balanced circuit)', () => {
  it('is zero with no 3rd harmonic', () => {
    const r = neutralFromThirdHarmonic(100, 0);
    expect(r.neutralA).toBe(0);
    expect(r.fundamentalA).toBeCloseTo(100, 9);
  });
  it('gives 94.87 A in the neutral for 100 A per phase with a 33.3 % third harmonic', () => {
    // I1 = 100 / sqrt(1 + 1/9) = 94.868; neutral = 3 * (1/3) * 94.868
    const r = neutralFromThirdHarmonic(100, 100 / 3);
    expect(r.fundamentalA).toBeCloseTo(94.8683, 3);
    expect(r.neutralA).toBeCloseTo(94.8683, 3);
    expect(r.ratioToPhase).toBeCloseTo(0.9487, 4);
  });
  it('gives a neutral larger than the phase current for a 50 % third harmonic: 134.16 A from 100 A', () => {
    // I1 = 100 / sqrt(1.25) = 89.443; neutral = 3 * 0.5 * 89.443 = 134.16
    const r = neutralFromThirdHarmonic(100, 50);
    expect(r.neutralA).toBeCloseTo(134.164, 2);
    expect(r.ratioToPhase).toBeCloseTo(1.3416, 4);
  });
  it('rejects invalid input', () => {
    expect(() => neutralFromThirdHarmonic(0, 10)).toThrow();
    expect(() => neutralFromThirdHarmonic(100, -5)).toThrow();
  });
});
