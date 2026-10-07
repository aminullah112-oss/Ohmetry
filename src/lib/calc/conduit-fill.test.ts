import { describe, expect, it } from 'vitest';
import { conduitFill } from './conduit-fill';

const run = (size: string, count: number) => conduitFill({ conductors: [{ size, count }] });

describe('conduitFill (EMT, THHN)', () => {
  // Same-size counts that match the code's Annex C counts for EMT and THHN:
  // 1/2": 9 x 12 AWG = 0.1197 <= 0.122 ; 10 x 12 AWG = 0.133 > 0.122
  it('1/2 inch EMT holds nine 12 AWG, not ten', () => {
    expect(run('12', 9).trade).toBe('1/2"');
    expect(run('12', 10).trade).toBe('3/4"');
  });
  // 3/4": 16 x 12 AWG = 0.2128 <= 0.213 ; 17 x = 0.2261 > 0.213
  it('3/4 inch EMT holds sixteen 12 AWG, not seventeen', () => {
    expect(run('12', 16).trade).toBe('3/4"');
    expect(run('12', 17).trade).toBe('1"');
  });
  // 1": 26 x 12 AWG = 0.3458 <= 0.346 ; 27 x = 0.3591 > 0.346
  it('1 inch EMT holds twenty-six 12 AWG, not twenty-seven', () => {
    expect(run('12', 26).trade).toBe('1"');
    expect(run('12', 27).trade).toBe('1-1/4"');
  });
  // 1/2": 12 x 14 AWG = 0.1164 <= 0.122 ; 13 x = 0.1261 > 0.122
  it('1/2 inch EMT holds twelve 14 AWG, not thirteen', () => {
    expect(run('14', 12).trade).toBe('1/2"');
    expect(run('14', 13).trade).toBe('3/4"');
  });
  // Three 12 AWG: 0.0399 area ; allowed 40 % ; 1/2" total 0.304 -> 13.1 % of the internal area
  it('three 12 AWG: area, allowed percent and actual fill', () => {
    const r = run('12', 3);
    expect(r.totalArea).toBeCloseTo(0.0399, 6);
    expect(r.allowedPercent).toBe(40);
    expect(r.fillPercent).toBeCloseTo(13.125, 2);
  });
  // Two 4 AWG: 0.1648 <= 31 % of 3/4" (0.165): fits, barely
  it('two conductors use the 31 % column', () => {
    const r = run('4', 2);
    expect(r.allowedPercent).toBe(31);
    expect(r.trade).toBe('3/4"');
  });
  // One 4/0: 0.3237 ; 53 % of 3/4" = 0.283 (no), of 1" = 0.458 (yes)
  it('one conductor uses the 53 % column', () => {
    const r = run('4/0', 1);
    expect(r.allowedPercent).toBe(53);
    expect(r.trade).toBe('1"');
  });
  // Mixed: 4 x 10 AWG (0.0844) + 3 x 12 AWG (0.0399) + 1 x 8 AWG (0.0366) = 0.1609 -> over 2 conductors, 40 %: 3/4" (0.213)
  it('mixed sizes are summed', () => {
    const r = conduitFill({ conductors: [{ size: '10', count: 4 }, { size: '12', count: 3 }, { size: '8', count: 1 }] });
    expect(r.totalConductors).toBe(8);
    expect(r.totalArea).toBeCloseTo(0.1609, 6);
    expect(r.trade).toBe('3/4"');
  });
  it('lists the fill in every size', () => expect(run('12', 9).options).toHaveLength(10));
  it('rejects empty, fractional, unknown and oversize', () => {
    expect(() => conduitFill({ conductors: [] })).toThrow();
    expect(() => conduitFill({ conductors: [{ size: '12', count: 1.5 }] })).toThrow();
    expect(() => conduitFill({ conductors: [{ size: '99', count: 1 }] })).toThrow();
    expect(() => run('500', 40)).toThrow();
  });
});
