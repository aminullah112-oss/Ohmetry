import { describe, expect, it } from 'vitest';
import { faultAtCableEnd, type FaultInput } from './fault-cable';

// Worked example, hand-calculated separately: 400 V, 500 MVA source (X/R 10), 1000 kVA 5 % transformer (X/R 5),
// 30 m of 25 mm2 copper with 0.08 ohm/km reactance.
//   Zq = 1.05*400^2/500e6 = 0.000336 ohm; Zt = 0.05*400^2/1e6 = 0.008 ohm
//   Cable R = 0.017241/25*30 = 0.020689 ohm, X = 0.0024 ohm
const base: FaultInput = {
  un: 400, cMax: 1.05, cMin: 0.95, sourceMva: 500, sourceXr: 10, trKva: 1000, trZPercent: 5, trXr: 5,
  lengthM: 30, areaMm2: 25, material: 'copper', xOhmPerKm: 0.08, parallel: 1, minTempC: 80,
};

describe('faultAtCableEnd', () => {
  const r = faultAtCableEnd(base);
  it('fault level at the transformer terminals', () => expect(r.ikTransformerKa).toBeCloseTo(29.0945, 3));
  it('fault level at the cable end is far lower', () => expect(r.ikCableEndKa).toBeCloseTo(9.8275, 3));
  it('peak factor and peak current', () => {
    expect(r.kappa).toBeCloseTo(1.0218, 3);
    expect(r.ipKa).toBeCloseTo(14.2006, 3);
  });
  it('minimum fault with a hot cable', () => expect(r.ikMinKa).toBeCloseTo(7.5246, 3));
  it('cable resistance and reactance', () => {
    expect(r.cableR).toBeCloseTo(0.020689, 5);
    expect(r.cableX).toBeCloseTo(0.0024, 6);
  });
  it('infinite bus gives the transformer-only level', () => {
    // Zt only: R = 0.008/sqrt(26), X = 0.008*5/sqrt(26); Ik = 1.05*400/(sqrt3*0.008) = 30.311 kA
    expect(faultAtCableEnd({ ...base, sourceMva: undefined }).ikTransformerKa).toBeCloseTo(30.3109, 3);
  });
  it('two parallel cables halve R and X and raise the fault level', () => {
    const p = faultAtCableEnd({ ...base, parallel: 2 });
    expect(p.cableR).toBeCloseTo(r.cableR / 2, 9);
    expect(p.ikCableEndKa).toBeGreaterThan(r.ikCableEndKa);
  });
  it('aluminium lowers the fault level compared with copper', () => expect(faultAtCableEnd({ ...base, material: 'aluminium' }).ikCableEndKa).toBeLessThan(r.ikCableEndKa));
  it('rejects bad input', () => {
    expect(() => faultAtCableEnd({ ...base, lengthM: 0 })).toThrow();
    expect(() => faultAtCableEnd({ ...base, trZPercent: 120 })).toThrow();
    expect(() => faultAtCableEnd({ ...base, cMax: 0.9 })).toThrow();
    expect(() => faultAtCableEnd({ ...base, minTempC: 10 })).toThrow();
    expect(() => faultAtCableEnd({ ...base, sourceMva: -5 })).toThrow();
  });
});
