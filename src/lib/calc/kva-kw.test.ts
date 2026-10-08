import { describe, expect, it } from 'vitest';
import { kvaToKw, kwToKva } from './kva-kw';

describe('kvaToKw', () => {
  // Hand check: 100 * 0.8 = 80 kW; kvar = sqrt(10000 - 6400) = 60
  it('100 kVA at 0.8 PF', () => {
    const r = kvaToKw(100, 0.8);
    expect(r.kw).toBeCloseTo(80, 6);
    expect(r.kvar).toBeCloseTo(60, 6);
  });
  it('unity power factor has no reactive power', () => expect(kvaToKw(50, 1).kvar).toBeCloseTo(0, 6));
  it('rejects bad input', () => {
    expect(() => kvaToKw(0, 0.8)).toThrow();
    expect(() => kvaToKw(10, 1.2)).toThrow();
    expect(() => kvaToKw(10, 0)).toThrow();
  });
});

describe('kwToKva', () => {
  // Hand check: 80 / 0.8 = 100 kVA; kvar = 60
  it('80 kW at 0.8 PF', () => {
    const r = kwToKva(80, 0.8);
    expect(r.kva).toBeCloseTo(100, 6);
    expect(r.kvar).toBeCloseTo(60, 6);
  });
  // Hand check: 45 / 0.9 = 50 kVA; kvar = sqrt(2500 - 2025) = 21.794
  it('45 kW at 0.9 PF', () => {
    const r = kwToKva(45, 0.9);
    expect(r.kva).toBeCloseTo(50, 6);
    expect(r.kvar).toBeCloseTo(21.7945, 3);
  });
  it('round-trips with kVA to kW', () => expect(kvaToKw(kwToKva(37, 0.85).kva, 0.85).kw).toBeCloseTo(37, 9));
});
