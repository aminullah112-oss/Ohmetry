import { describe, it, expect } from 'vitest';
import { kwToAmps } from './kw-to-amps';
import { requiredTabulated } from './cable-derating';
import { dropVolts } from './conductor-drop';

/** The worked example in /how-to-size-a-cable/. If these change, change the page. */
describe('how to size a cable: worked example', () => {
  it('step 1: 30 kW, 400 V three-phase, PF 0.9 is 48.1 A', () => {
    expect(kwToAmps(30, 400, 0.9, 'three')).toBeCloseTo(48.11, 2);
  });

  it('step 3: a 50 A device with factors 0.94 and 0.70 needs a tabulated rating of 76.0 A', () => {
    const r = requiredTabulated(48.1, 50, [0.94, 0.7]);
    expect(r.k).toBeCloseTo(0.658, 3);
    expect(r.requiredTabulatedA).toBeCloseTo(75.99, 2);
  });

  it('step 4: 60 m of 16 mm² copper at 70 °C drops 6.4 V (1.6 % of 400 V); 10 mm² would drop 2.6 %', () => {
    const d16 = dropVolts({ amps: 48.11, oneWayMetres: 60, material: 'copper', tempC: 70, circuit: 'three' }, 16);
    expect(d16).toBeCloseTo(6.45, 2);
    expect((d16 / 400) * 100).toBeCloseTo(1.61, 2);
    const d10 = dropVolts({ amps: 48.11, oneWayMetres: 60, material: 'copper', tempC: 70, circuit: 'three' }, 10);
    expect((d10 / 400) * 100).toBeCloseTo(2.58, 2);
  });

  it('step 5: 5 kA cleared in 0.1 s with k = 115 needs 13.7 mm²', () => {
    expect(Math.sqrt(5000 ** 2 * 0.1) / 115).toBeCloseTo(13.75, 2);
  });
});
