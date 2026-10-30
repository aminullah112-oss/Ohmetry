import { describe, expect, it } from 'vitest';
import { earthConductor, kFactor } from './earth-conductor';

// Published k values (IEC 60364-5-54), rounded in the standard. The calculated values must agree to within 1.
const close = (a: number, b: number) => expect(Math.abs(a - b)).toBeLessThan(1);

describe('kFactor from the IEC 60949 material constants', () => {
  it('separate conductor from 30 degC: copper PVC 143, copper XLPE 176, aluminium PVC 95, aluminium XLPE 116, steel PVC 52', () => {
    close(kFactor('copper', 30, 160), 143);
    close(kFactor('copper', 30, 250), 176);
    close(kFactor('aluminium', 30, 160), 95);
    close(kFactor('aluminium', 30, 250), 116);
    close(kFactor('steel', 30, 160), 52);
  });
  it('core of a cable: copper PVC 115, copper XLPE 143, aluminium PVC 76, aluminium XLPE 94', () => {
    close(kFactor('copper', 70, 160), 115);
    close(kFactor('copper', 90, 250), 143);
    close(kFactor('aluminium', 70, 160), 76);
    close(kFactor('aluminium', 90, 250), 94);
  });
  it('rejects a final temperature at or below the initial one', () => expect(() => kFactor('copper', 90, 90)).toThrow());
});

describe('earthConductor', () => {
  it('10 kA for 0.5 s, separate copper XLPE: 40.3 mm2, next size 50', () => {
    const r = earthConductor({ faultA: 10000, timeS: 0.5, material: 'copper', insulation: 'xlpe', installation: 'separate' });
    expect(r.sMinMm2).toBeCloseTo(Math.sqrt(5e7) / r.k, 9);
    expect(r.sMinMm2).toBeGreaterThan(40.0);
    expect(r.sMinMm2).toBeLessThan(40.6);
    expect(r.sStandardMm2).toBe(50);
    expect(r.i2t).toBeCloseTo(5e7, 0);
  });
  it('25 kA for 1 s, separate copper PVC: about 175 mm2, next size 185', () => {
    const r = earthConductor({ faultA: 25000, timeS: 1, material: 'copper', insulation: 'pvc', installation: 'separate' });
    expect(r.sMinMm2).toBeGreaterThan(174);
    expect(r.sMinMm2).toBeLessThan(177);
    expect(r.sStandardMm2).toBe(185);
    expect(r.pvcLargeApplied).toBe(false);
  });
  it('a core needs more copper than a separate conductor for the same fault', () => {
    const a = earthConductor({ faultA: 5000, timeS: 1, material: 'copper', insulation: 'pvc', installation: 'separate' });
    const b = earthConductor({ faultA: 5000, timeS: 1, material: 'copper', insulation: 'pvc', installation: 'core' });
    expect(b.sMinMm2).toBeGreaterThan(a.sMinMm2);
  });
  it('aluminium needs more area than copper', () => {
    const cu = earthConductor({ faultA: 8000, timeS: 0.4, material: 'copper', insulation: 'xlpe', installation: 'separate' });
    const al = earthConductor({ faultA: 8000, timeS: 0.4, material: 'aluminium', insulation: 'xlpe', installation: 'separate' });
    expect(al.sMinMm2 / cu.sMinMm2).toBeCloseTo(cu.k / al.k, 9);
    expect(al.sMinMm2).toBeGreaterThan(cu.sMinMm2);
  });
  it('PVC above 300 mm2 uses the 140 degC final temperature', () => {
    const r = earthConductor({ faultA: 60000, timeS: 1, material: 'copper', insulation: 'pvc', installation: 'separate' });
    expect(r.pvcLargeApplied).toBe(true);
    expect(r.finalC).toBe(140);
    expect(r.k).toBeLessThan(143);
    expect(r.sStandardMm2).toBe(null);
  });
  it('rejects bad input, long times and a steel core', () => {
    expect(() => earthConductor({ faultA: 0, timeS: 1, material: 'copper', insulation: 'pvc', installation: 'separate' })).toThrow();
    expect(() => earthConductor({ faultA: 1000, timeS: 6, material: 'copper', insulation: 'pvc', installation: 'separate' })).toThrow();
    expect(() => earthConductor({ faultA: 1000, timeS: 1, material: 'steel', insulation: 'pvc', installation: 'core' })).toThrow();
  });
});
