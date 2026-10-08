import { describe, expect, it } from 'vitest';
import { hpToAmps } from './hp-to-amps';

describe('hpToAmps', () => {
  // Table 430.250: 10 hp at 460 V is 14 A. Estimate: 7456.99872 / (1.73205 * 460 * 0.9 * 0.85) = 12.234 A
  it('10 hp, 460 V, three-phase', () => {
    const r = hpToAmps(10, 460, 'three', 0.9, 0.85);
    expect(r.tableA).toBe(14);
    expect(r.estimatedA).toBeCloseTo(12.2344, 3);
  });
  // Table 430.250: 5 hp at 230 V is 15.2 A
  it('5 hp, 230 V, three-phase table value', () => expect(hpToAmps(5, 230, 'three', 0.9, 0.85).tableA).toBe(15.2));
  // Table 430.248: 1 hp at 115 V is 16 A. Estimate: 745.699872 / (115 * 0.9 * 0.85) = 8.476 A
  it('1 hp, 115 V, single-phase', () => {
    const r = hpToAmps(1, 115, 'single', 0.9, 0.85);
    expect(r.tableA).toBe(16);
    expect(r.estimatedA).toBeCloseTo(8.4763, 3);
  });
  it('the table value is higher than the running estimate for typical motors', () => {
    const r = hpToAmps(25, 460, 'three', 0.92, 0.86);
    expect(r.tableA).toBeGreaterThan(r.estimatedA);
  });
  it('rejects a voltage or horsepower the table does not list', () => {
    expect(() => hpToAmps(10, 480, 'three', 0.9, 0.85)).toThrow();
    expect(() => hpToAmps(12, 460, 'three', 0.9, 0.85)).toThrow();
  });
  it('rejects bad efficiency and power factor', () => {
    expect(() => hpToAmps(10, 460, 'three', 0, 0.85)).toThrow();
    expect(() => hpToAmps(10, 460, 'three', 0.9, 1.2)).toThrow();
  });
});
