import { describe, expect, it } from 'vitest';
import { SimError, eng, ohmCircuit, rcAt, resistorNetwork, rlAt, rlcSeries, rlcWave, voltageDivider } from './simulator';

const close = (a: number, b: number, rel = 1e-9) => expect(Math.abs(a - b)).toBeLessThanOrEqual(rel * Math.max(1, Math.abs(b)));

describe("Ohm's law circuit", () => {
  it('12 V across 6 ohm is 2 A and 24 W', () => {
    const c = ohmCircuit(12, 6);
    close(c.I, 2); close(c.P, 24);
  });
  it('rejects zero, negative and non-numeric input', () => {
    for (const bad of [0, -1, NaN, Infinity]) expect(() => ohmCircuit(bad, 5)).toThrow(SimError);
    expect(() => ohmCircuit(5, 0)).toThrow(SimError);
  });
});

describe('resistor networks', () => {
  it('series: 100 + 200 + 300 ohm on 12 V carries 20 mA; drops sum to the supply', () => {
    const n = resistorNetwork(12, [100, 200, 300], 'series');
    close(n.Rtotal, 600); close(n.Itotal, 0.02);
    close(n.elements.reduce((a, e) => a + e.V, 0), 12);
    close(n.elements[2].V, 6); close(n.elements[2].P, 0.12);
    close(n.Ptotal, n.elements.reduce((a, e) => a + e.P, 0));
  });
  it('parallel: two 100 ohm resistors are 50 ohm; branch currents sum to the total', () => {
    const n = resistorNetwork(10, [100, 100], 'parallel');
    close(n.Rtotal, 50); close(n.Itotal, 0.2);
    close(n.elements.reduce((a, e) => a + e.I, 0), n.Itotal);
    expect(n.elements.every((e) => e.V === 10)).toBe(true);
  });
  it('parallel total is always below the smallest branch', () => {
    const n = resistorNetwork(5, [10, 1000, 220], 'parallel');
    expect(n.Rtotal).toBeLessThan(10);
  });
  it('conserves power in both modes', () => {
    for (const mode of ['series', 'parallel'] as const) {
      const n = resistorNetwork(24, [47, 68, 150, 330], mode);
      close(n.Ptotal, n.elements.reduce((a, e) => a + e.P, 0), 1e-12);
    }
  });
  it('needs at least one positive resistor', () => {
    expect(() => resistorNetwork(5, [], 'series')).toThrow(SimError);
    expect(() => resistorNetwork(5, [10, -1], 'parallel')).toThrow(SimError);
  });
});

describe('voltage divider', () => {
  it('10 V over 1 k and 1 k is 5 V unloaded', () => {
    const d = voltageDivider(10, 1000, 1000, Infinity);
    close(d.Vout, 5); close(d.sagPercent, 0); close(d.Iload, 0);
  });
  it('a 1 k load on the bottom 1 k leaves 500 ohm and 3.333 V', () => {
    const d = voltageDivider(10, 1000, 1000, 1000);
    close(d.Rbottom, 500); close(d.Vout, 10 / 3); close(d.VoutUnloaded, 5);
    close(d.sagPercent, (100 * (5 - 10 / 3)) / 5);
    close(d.Iin, 10 / 1500);
    close(d.Iin, d.Vout / 1000 + d.Vout / 1000);          // input current splits between R2 and the load
  });
  it('a load much larger than R2 barely disturbs the output', () => {
    expect(voltageDivider(10, 1000, 1000, 1e7).sagPercent).toBeLessThan(0.02);
  });
});

describe('RC transient', () => {
  it('time constant is R times C: 1 k and 1 mF give 1 s', () => {
    close(rcAt(5, 1000, 1e-3, 0, true).tau, 1);
  });
  it('charging reaches 63.2 % after one time constant and 99.3 % after five', () => {
    close(rcAt(5, 1000, 1e-3, 1, true).fraction, 1 - Math.exp(-1));
    expect(rcAt(5, 1000, 1e-3, 5, true).fraction).toBeGreaterThan(0.993);
  });
  it('starts at zero volts with the full V/R current, and the stored energy is half C V squared', () => {
    const s0 = rcAt(5, 1000, 1e-3, 0, true);
    close(s0.vc, 0); close(s0.i, 0.005);
    const s = rcAt(5, 1000, 1e-3, 50, true);
    close(s.energy, 0.5 * 1e-3 * 25, 1e-6);
  });
  it('discharging decays from V and the current reverses', () => {
    const s = rcAt(5, 1000, 1e-3, 1, false);
    close(s.vc, 5 * Math.exp(-1)); expect(s.i).toBeLessThan(0);
  });
  it('vc plus the resistor voltage equals the supply while charging (Kirchhoff)', () => {
    const s = rcAt(12, 470, 2.2e-4, 0.07, true);
    close(s.vc + s.vr, 12, 1e-12);
  });
  it('rejects negative time', () => { expect(() => rcAt(5, 1, 1, -1, true)).toThrow(SimError); });
});

describe('RL transient', () => {
  it('time constant is L over R: 1 H and 10 ohm give 0.1 s; final current is V/R', () => {
    const s = rlAt(10, 10, 1, 0, true);
    close(s.tau, 0.1); close(s.i, 0);
    close(rlAt(10, 10, 1, 1, true).i, 1, 1e-4);
  });
  it('rises to 63.2 % in one time constant; inductor voltage starts at the full supply and falls', () => {
    close(rlAt(10, 10, 1, 0.1, true).fraction, 1 - Math.exp(-1));
    close(rlAt(10, 10, 1, 0, true).vl, 10);
    expect(rlAt(10, 10, 1, 0.5, true).vl).toBeLessThan(0.1);
  });
  it('decay starts at V/R, with a reversed inductor voltage, and stored energy is half L I squared', () => {
    const s = rlAt(10, 10, 1, 0, false);
    close(s.i, 1); close(s.vl, -10); close(s.energy, 0.5);
  });
  it('loop voltages add to the supply while rising (Kirchhoff)', () => {
    const s = rlAt(24, 8, 0.5, 0.03, true);
    close(s.vl + s.vr, 24, 1e-12);
  });
});

describe('series RLC on AC', () => {
  const c = rlcSeries(230, 50, 10, 0.1, 100e-6);
  it('reactances, impedance and current match hand calculation', () => {
    close(c.XL, 2 * Math.PI * 50 * 0.1, 1e-12);
    close(c.XC, 1 / (2 * Math.PI * 50 * 100e-6), 1e-12);
    close(c.Z, Math.hypot(10, c.XL - c.XC), 1e-12);
    close(c.Irms, 230 / c.Z, 1e-12);
    expect(c.XL).toBeCloseTo(31.416, 3); expect(c.XC).toBeCloseTo(31.831, 3);
  });
  it('is slightly capacitive just below resonance (50.33 Hz) and nearly unity power factor', () => {
    expect(c.f0).toBeCloseTo(50.33, 2); expect(c.kind).toBe('capacitive'); expect(c.phaseDeg).toBeLessThan(0); expect(c.pf).toBeGreaterThan(0.999);
  });
  it('at resonance impedance equals R, phase is zero and the reactive voltages are equal', () => {
    const r = rlcSeries(230, c.f0, 10, 0.1, 100e-6);
    close(r.Z, 10, 1e-9); close(r.phaseDeg, 0, 1e-6); close(r.pf, 1, 1e-9); close(r.VL, r.VC, 1e-9);
    expect(r.kind).toBe('resistive');
  });
  it('power triangle: S squared equals P squared plus Q squared, and P is V I cos(phi)', () => {
    const x = rlcSeries(120, 60, 22, 0.05, 220e-6);
    close(x.S * x.S, x.P * x.P + x.Q * x.Q, 1e-9);
    close(x.P, x.Vrms * x.Irms * Math.cos((x.phaseDeg * Math.PI) / 180), 1e-9);
  });
  it('an inductive circuit has current lagging: the phase is positive and i is behind v in the waveform', () => {
    const x = rlcSeries(120, 60, 10, 0.01, 100e-6);          // XL 3.77 ohm, XC 26.5 ohm: capacitive, so the current leads
    expect(x.kind).toBe('capacitive'); expect(x.phaseDeg).toBeLessThan(0);
    const y = rlcSeries(120, 60, 10, 0.5, 1e-3);
    expect(y.kind).toBe('inductive'); expect(y.phaseDeg).toBeGreaterThan(0);
    const T = 1 / 60;
    expect(rlcWave(y, 0.001).v).toBeGreaterThan(0);          // v is positive early in the cycle, i lags so it starts below its first peak
    const peakI = Math.sqrt(2) * y.Irms;
    let tPeakV = 0, tPeakI = 0, bestV = -1, bestI = -1;
    for (let k = 0; k < 1000; k++) { const t = (k / 1000) * T; const w = rlcWave(y, t); if (w.v > bestV) { bestV = w.v; tPeakV = t; } if (w.i > bestI) { bestI = w.i; tPeakI = t; } }
    expect(tPeakI).toBeGreaterThan(tPeakV); expect(bestI).toBeCloseTo(peakI, 2);
  });
  it('rejects non-positive values', () => { expect(() => rlcSeries(230, 0, 10, 1, 1)).toThrow(SimError); });
});

describe('engineering notation', () => {
  it('uses SI prefixes with four significant figures', () => {
    expect(eng(0.0025, 'A')).toBe('2.5 mA');
    expect(eng(4700, 'Ω')).toBe('4.7 kΩ');
    expect(eng(1.5e-6, 'F')).toBe('1.5 µF');
    expect(eng(230, 'V')).toBe('230 V');
    expect(eng(0, 'W')).toBe('0 W');
    expect(eng(-0.012, 'A')).toBe('-12 mA');
    expect(eng(NaN, 'V')).toBe('– V');
  });
});
