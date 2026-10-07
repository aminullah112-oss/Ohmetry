import { describe, expect, it } from 'vitest';
import { CONDUITS, type ConduitType } from '../../data/nec-tables';

/**
 * Consistency evidence, not verification. Table 4 areas are the area of a circle of the conduit's internal diameter,
 * A = pi/4 * d^2. These internal diameters (inches) were recalled separately from the areas, so agreement to three
 * decimals across every row is strong evidence that neither list contains a typo. EMT is the control: its table has
 * already been compared with the code by the site owner, so agreement there shows the method and the recall work.
 */
const INTERNAL_DIAMETER_IN: Record<ConduitType, number[]> = {
  EMT: [0.622, 0.824, 1.049, 1.38, 1.61, 2.067, 2.731, 3.356, 3.834, 4.334],
  RMC: [0.632, 0.836, 1.063, 1.394, 1.624, 2.083, 2.489, 3.09, 3.57, 4.05],
  PVC40: [0.602, 0.804, 1.029, 1.36, 1.59, 2.047, 2.445, 3.042, 3.521, 3.998],
};

describe('Table 4 areas follow from internal diameters', () => {
  for (const type of Object.keys(INTERNAL_DIAMETER_IN) as ConduitType[]) {
    it(`${type}: every row's total area equals pi/4 * d^2 within rounding`, () => {
      CONDUITS[type].rows.forEach((row, i) => {
        const d = INTERNAL_DIAMETER_IN[type][i];
        const area = (Math.PI / 4) * d * d;
        expect(Math.abs(area - row.total), `${type} ${row.trade}: ${area.toFixed(4)} vs ${row.total}`).toBeLessThanOrEqual(0.0006);
      });
    });
  }
  it('areas increase with trade size in every type', () => {
    for (const t of Object.keys(CONDUITS) as ConduitType[]) CONDUITS[t].rows.forEach((r, i, a) => { if (i) expect(r.total).toBeGreaterThan(a[i - 1].total); });
  });
});
