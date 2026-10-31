import { describe, expect, it } from 'vitest';
import { tempCorrection, AIR_REFERENCE_C, GROUND_REFERENCE_C } from './derating-temp';

const r2 = (x: number) => Math.round(x * 100) / 100;

describe('tempCorrection', () => {
  it('is 1 at the reference temperature', () => {
    expect(tempCorrection(70, 30, 30)).toBe(1);
    expect(tempCorrection(90, 20, 20)).toBe(1);
  });
  it('matches the IEC 60364-5-52 air factors: PVC 0.94 at 35, 0.87 at 40, 0.71 at 50, 0.50 at 60', () => {
    expect(r2(tempCorrection(70, AIR_REFERENCE_C, 35))).toBe(0.94);
    expect(r2(tempCorrection(70, AIR_REFERENCE_C, 40))).toBe(0.87);
    expect(r2(tempCorrection(70, AIR_REFERENCE_C, 50))).toBe(0.71);
    expect(r2(tempCorrection(70, AIR_REFERENCE_C, 60))).toBe(0.5);
  });
  it('matches the IEC air factors for XLPE: 0.91 at 40, 0.82 at 50, 0.71 at 60', () => {
    expect(r2(tempCorrection(90, AIR_REFERENCE_C, 40))).toBe(0.91);
    expect(r2(tempCorrection(90, AIR_REFERENCE_C, 50))).toBe(0.82);
    expect(r2(tempCorrection(90, AIR_REFERENCE_C, 60))).toBe(0.71);
  });
  it('matches the IEC ground factors: PVC 0.95 at 25, XLPE 0.93 at 30', () => {
    expect(r2(tempCorrection(70, GROUND_REFERENCE_C, 25))).toBe(0.95);
    expect(r2(tempCorrection(90, GROUND_REFERENCE_C, 30))).toBe(0.93);
  });
  it('gives the same factors as the NEC table for 60, 75 and 90 degC conductors at 40 degC: 0.82, 0.88, 0.91', () => {
    expect(r2(tempCorrection(60, 30, 40))).toBe(0.82);
    expect(r2(tempCorrection(75, 30, 40))).toBe(0.88);
    expect(r2(tempCorrection(90, 30, 40))).toBe(0.91);
  });
  it('is above 1 for a cool ambient', () => expect(tempCorrection(70, 30, 10)).toBeGreaterThan(1));
  it('rejects an ambient at or above the maximum, and bad input', () => {
    expect(() => tempCorrection(70, 30, 70)).toThrow();
    expect(() => tempCorrection(70, 30, 80)).toThrow();
    expect(() => tempCorrection(30, 30, 20)).toThrow();
    expect(() => tempCorrection(70, 30, NaN)).toThrow();
  });
});
