import { describe, expect, it } from 'vitest';
import { wattsToAmps } from './watts-to-amps';

describe('wattsToAmps', () => {
  // Hand check: 1200 / 120 = 10 A
  it('DC ignores power factor', () => expect(wattsToAmps(1200, 120, 0.5, 'dc')).toBeCloseTo(10, 6));
  // Hand check: 3000 / (240 * 0.9) = 13.8889 A
  it('single-phase with power factor', () => expect(wattsToAmps(3000, 240, 0.9, 'single')).toBeCloseTo(13.8889, 3));
  // Hand check: 10000 / (1.73205 * 400 * 0.8) = 18.0422 A
  it('three-phase, 400 V, 0.8 PF', () => expect(wattsToAmps(10000, 400, 0.8, 'three')).toBeCloseTo(18.0422, 3));
  // Inverse of amps-to-watts: 15 A at 120 V, PF 0.9 is 1620 W
  it('round-trips with amps to watts', () => expect(wattsToAmps(1620, 120, 0.9, 'single')).toBeCloseTo(15, 6));
  it('rejects bad input', () => {
    expect(() => wattsToAmps(0, 120, 1, 'single')).toThrow();
    expect(() => wattsToAmps(100, 0, 1, 'dc')).toThrow();
    expect(() => wattsToAmps(100, 120, 1.1, 'single')).toThrow();
    expect(() => wattsToAmps(100, 120, 0, 'three')).toThrow();
  });
});
