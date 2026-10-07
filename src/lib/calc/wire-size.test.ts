import { describe, expect, it } from 'vitest';
import { wireSize, type WireInput } from './wire-size';

// Indexes: ambient 1 = '26 to 30 C' (factor 1.0), 4 = '41 to 45 C' (0.87); adjustment 0 = 1-3 (1.0), 1 = 4-6 (0.8)
const base: WireInput = { continuousA: 40, noncontinuousA: 0, material: 'copper', terminalC: 75, insulationC: 90, ambientIndex: 1, adjustmentIndex: 0 };

describe('wireSize', () => {
  // 1.25*40 = 50 A -> 75 C column: 8 AWG = 50. Derating check: 40 A at 90 C: 10 AWG = 40. Final 8 AWG.
  it('40 A continuous, 75 C terminals -> 8 AWG', () => {
    const r = wireSize(base);
    expect(r.requiredTerminalA).toBe(50);
    expect(r.bySize.terminal.id).toBe('8');
    expect(r.bySize.derated.id).toBe('10');
    expect(r.size.id).toBe('8');
    expect(r.governs).toBe('termination');
  });
  // 60 C terminals: 50 A needs 6 AWG (55 A)
  it('same load on 60 C terminals -> 6 AWG', () => expect(wireSize({ ...base, terminalC: 60 }).size.id).toBe('6'));
  // k = 0.87*0.8 = 0.696 ; 40/0.696 = 57.5 A needed in 90 C column -> 6 AWG (75*0.696 = 52.2 >= 40); 8 AWG 55*0.696 = 38.3 < 40
  it('derating for 45 C and 4-6 conductors governs -> 6 AWG', () => {
    const r = wireSize({ ...base, ambientIndex: 4, adjustmentIndex: 1 });
    expect(r.k).toBeCloseTo(0.696, 9);
    expect(r.bySize.derated.id).toBe('6');
    expect(r.size.id).toBe('6');
    expect(r.governs).toBe('derating');
    expect(r.deratedAmpacity).toBeCloseTo(52.2, 1);
  });
  // 100 A noncontinuous at 75 C: copper 3 AWG = 100 ; aluminum 1 AWG = 100
  it('100 A noncontinuous: copper 3 AWG, aluminum 1 AWG', () => {
    const nc = { ...base, continuousA: 0, noncontinuousA: 100 };
    expect(wireSize(nc).size.id).toBe('3');
    expect(wireSize({ ...nc, material: 'aluminum' }).size.id).toBe('1');
  });
  // 40 A, 240 V two-wire, 200 ft, 3 %: rho(75C)=0.017241*(1+0.00393*55)=0.020967; 2*60.96*40*0.020967/7.2 = 14.2 mm2
  // AWG areas: 6 = 13.30 (too small), 4 = 21.15 -> 4 AWG
  it('long run: voltage drop governs -> 4 AWG', () => {
    const r = wireSize({ ...base, drop: { oneWayFeet: 200, volts: 240, percent: 3, circuit: 'two-wire' } });
    expect(r.bySize.drop!.id).toBe('4');
    expect(r.size.id).toBe('4');
    expect(r.governs).toBe('voltage drop');
  });
  it('a short run does not change the size', () => {
    expect(wireSize({ ...base, drop: { oneWayFeet: 10, volts: 240, percent: 3, circuit: 'two-wire' } }).size.id).toBe('8');
  });
  it('aluminum has no 14 AWG entry: 15 A load picks 12 AWG', () => expect(wireSize({ ...base, material: 'aluminum', continuousA: 0, noncontinuousA: 15 }).size.id).toBe('12'));
  it('rejects bad input and missing factors', () => {
    expect(() => wireSize({ ...base, continuousA: 0 })).toThrow();
    expect(() => wireSize({ ...base, insulationC: 75, terminalC: 75, ambientIndex: 10 })).toThrow(); // no 75 C factor for 71-75 C
    expect(() => wireSize({ ...base, insulationC: 75, terminalC: 75, ambientIndex: 99 })).toThrow();
    expect(() => wireSize({ ...base, terminalC: 75, insulationC: 60 as 75 })).toThrow();
    expect(() => wireSize({ ...base, continuousA: 900 })).toThrow();
  });
});
