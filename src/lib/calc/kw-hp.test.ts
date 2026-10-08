import { describe, expect, it } from 'vitest';
import { hpToKw, inputKw, kwToHp } from './kw-hp';

describe('kW and horsepower', () => {
  // Hand check: 10 hp * 745.699872 W = 7.45699872 kW
  it('10 mechanical hp', () => expect(hpToKw(10, 'mechanical')).toBeCloseTo(7.457, 3));
  // Hand check: 7500 / 745.699872 = 10.0580 hp
  it('7.5 kW in mechanical hp', () => expect(kwToHp(7.5, 'mechanical')).toBeCloseTo(10.058, 3));
  // Hand check: 10 PS * 735.49875 W = 7.3549875 kW
  it('10 metric hp', () => expect(hpToKw(10, 'metric')).toBeCloseTo(7.35499, 4));
  it('round-trips', () => expect(hpToKw(kwToHp(22, 'metric'), 'metric')).toBeCloseTo(22, 9));
  it('metric hp is slightly smaller than mechanical', () => expect(hpToKw(1, 'metric')).toBeLessThan(hpToKw(1, 'mechanical')));
  // Hand check: 7.457 kW shaft / 0.9 = 8.2855 kW input
  it('input power at 90 % efficiency', () => expect(inputKw(hpToKw(10, 'mechanical'), 0.9)).toBeCloseTo(8.2856, 3));
  it('rejects bad input', () => {
    expect(() => kwToHp(0, 'mechanical')).toThrow();
    expect(() => hpToKw(-1, 'metric')).toThrow();
    expect(() => inputKw(5, 0)).toThrow();
    expect(() => inputKw(5, 1.1)).toThrow();
  });
});
