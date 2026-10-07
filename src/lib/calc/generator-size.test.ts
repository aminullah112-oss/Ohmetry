import { describe, expect, it } from 'vitest';
import { generatorSize, type GenInput } from './generator-size';

const base: GenInput = {
  loads: [
    { name: 'Lighting', watts: 2000, qty: 1, startMultiplier: 1 },
    { name: 'Fridge', watts: 150, qty: 2, startMultiplier: 3 },
    { name: 'Well pump', watts: 1000, qty: 1, startMultiplier: 3 },
  ],
  margin: 0.25, startingCapability: 1, derate: 1, powerFactor: 0.8, volts: 240, phase: 'single',
};

describe('generatorSize', () => {
  // running = 2000 + 300 + 1000 = 3300 ; extra start = max(0, 150*2, 1000*2) = 2000 ; peak 5300
  // kW running = 3300*1.25/1000 = 4.125 ; kW starting = 5.3 -> required 5.3 kW ; kVA = 5.3/0.8 = 6.625 ; A = 6625/240 = 27.6
  it('household example: starting governs', () => {
    const r = generatorSize(base);
    expect(r.runningW).toBe(3300);
    expect(r.extraStartW).toBe(2000);
    expect(r.peakW).toBe(5300);
    expect(r.kwForRunning).toBeCloseTo(4.125, 9);
    expect(r.requiredKw).toBeCloseTo(5.3, 9);
    expect(r.requiredKva).toBeCloseTo(6.625, 9);
    expect(r.ratedAmps).toBeCloseTo(27.604, 3);
    expect(r.governs).toBe('motor starting');
  });
  // derate 0.9: 5.3/0.9 = 5.889 kW
  it('derating raises the size', () => expect(generatorSize({ ...base, derate: 0.9 }).requiredKw).toBeCloseTo(5.8889, 4));
  // a starting-capable set (1.5): kW starting = 5.3/1.5 = 3.533 < running 4.125 -> running governs
  it('a higher starting capability lets running load govern', () => {
    const r = generatorSize({ ...base, startingCapability: 1.5 });
    expect(r.governs).toBe('running load');
    expect(r.requiredKw).toBeCloseTo(4.125, 9);
  });
  it('no surging loads: peak equals running load', () => {
    const r = generatorSize({ ...base, loads: [{ name: 'Heater', watts: 3000, qty: 1, startMultiplier: 1 }] });
    expect(r.extraStartW).toBe(0);
    expect(r.requiredKw).toBeCloseTo(3.75, 9);
  });
  it('three-phase rated current', () => {
    // 6.625 kVA at 400 V three-phase = 6625/(1.73205*400) = 9.562 A
    expect(generatorSize({ ...base, volts: 400, phase: 'three' }).ratedAmps).toBeCloseTo(9.5624, 3);
  });
  it('rejects bad input', () => {
    expect(() => generatorSize({ ...base, loads: [] })).toThrow();
    expect(() => generatorSize({ ...base, derate: 0 })).toThrow();
    expect(() => generatorSize({ ...base, loads: [{ name: 'x', watts: 100, qty: 1, startMultiplier: 0.5 }] })).toThrow();
    expect(() => generatorSize({ ...base, startingCapability: 0.5 })).toThrow();
  });
});
