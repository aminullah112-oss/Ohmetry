/**
 * Minimum overcurrent device for a branch circuit or feeder:
 * 125% of continuous load + 100% of noncontinuous load (NEC 210.20(A), 215.3),
 * rounded up to the next standard rating in NEC 240.6(A). The list follows the 2023 edition, which
 * adds a 10 A circuit breaker rating (the 2020 list starts at 15 A). Fuses also have 1, 3, 6 and 601 A.
 * Does not model 100%-rated assemblies, motor circuits (Art. 430) or conductor
 * ampacity checks (240.4, 310.16).
 */
export const STANDARD_RATINGS = [
  10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 110, 125, 150, 175, 200, 225, 250, 300, 350,
  400, 450, 500, 600, 700, 800, 1000, 1200, 1600, 2000, 2500, 3000, 4000, 5000, 6000,
];

/** Standard fuse ratings: the list above plus the additional fuse ratings in 240.6(A). */
export const FUSE_RATINGS = [...STANDARD_RATINGS, 1, 3, 6, 601].sort((a, b) => a - b);

export interface BreakerResult { minAmps: number; breaker: number }

export function breakerSize(continuousAmps: number, noncontinuousAmps = 0): BreakerResult {
  if (!(continuousAmps >= 0) || !(noncontinuousAmps >= 0) || continuousAmps + noncontinuousAmps <= 0)
    throw new Error('Enter a load greater than zero');
  const minAmps = 1.25 * continuousAmps + noncontinuousAmps;
  const breaker = STANDARD_RATINGS.find((r) => r >= minAmps - 1e-9);
  if (breaker === undefined) throw new Error('Load exceeds the largest standard rating (6000 A)');
  return { minAmps, breaker };
}
