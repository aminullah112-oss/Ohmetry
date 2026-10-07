import { describe, expect, it } from 'vitest';
import { breakerSize, FUSE_RATINGS, STANDARD_RATINGS } from './breaker-size';

describe('breakerSize', () => {
  // 1.25 * 32 = 40 exactly -> 40 A (typical 32 A EV charger)
  it('32 A continuous -> 40 A', () => expect(breakerSize(32)).toEqual({ minAmps: 40, breaker: 40 }));
  // 1.25 * 40 = 50 -> 50 A (40 A EVSE)
  it('40 A continuous -> 50 A', () => expect(breakerSize(40).breaker).toBe(50));
  // 1.25 * 24 = 30 -> 30 A
  it('24 A continuous -> 30 A', () => expect(breakerSize(24).breaker).toBe(30));
  // 1.25 * 25 = 31.25 -> next size up is 35 A
  it('25 A continuous -> 35 A', () => expect(breakerSize(25).breaker).toBe(35));
  // 1.25 * 16 + 10 = 30 -> 30 A
  it('mixed load 16 A + 10 A -> 30 A', () => expect(breakerSize(16, 10).breaker).toBe(30));
  it('noncontinuous only is not derated', () => expect(breakerSize(0, 20).breaker).toBe(20));
  // 1.25 * 160 = 200 -> 200 A
  it('160 A continuous -> 200 A', () => expect(breakerSize(160).breaker).toBe(200));
  it('rejects zero and oversize', () => {
    expect(() => breakerSize(0, 0)).toThrow();
    expect(() => breakerSize(5000)).toThrow();
  });
  // 2023 NEC 240.6(A) adds a 10 A circuit breaker rating
  it('an 8 A noncontinuous load can use the 10 A breaker rating', () => expect(breakerSize(0, 8).breaker).toBe(10));
  // 1.25 * 8 = 10 A exactly
  it('8 A continuous -> 10 A', () => expect(breakerSize(8).breaker).toBe(10));
  it('11 A noncontinuous -> 15 A', () => expect(breakerSize(0, 11).breaker).toBe(15));
});
describe('fuse ratings', () => {
  it('include the small fuse ratings and 601 A', () => {
    for (const r of [1, 3, 6, 10, 601]) expect(FUSE_RATINGS).toContain(r);
  });
  it('are ascending with no duplicates', () => {
    FUSE_RATINGS.forEach((r, i) => { if (i) expect(r).toBeGreaterThan(FUSE_RATINGS[i - 1]); });
  });
  it('601 A is a fuse rating only', () => expect(STANDARD_RATINGS).not.toContain(601));
});
