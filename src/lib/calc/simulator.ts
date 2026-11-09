/**
 * Ideal-circuit models for the electrical simulator. Every function is a closed-form formula (no numerical integration),
 * so the page can evaluate it at any time t while the simulation runs. All quantities are in SI base units (V, A, ohm, F, H, Hz, s, W).
 * Components are ideal: no wire resistance, no temperature effect, no saturation, no leakage. See the page text for the limits.
 */

export class SimError extends Error {}

function positive(name: string, v: number): number {
  if (!Number.isFinite(v) || v <= 0) throw new SimError(`${name} must be a positive number`);
  return v;
}

// ---------------------------------------------------------------- Ohm's law
export interface OhmCircuit { V: number; R: number; I: number; P: number }
export function ohmCircuit(V: number, R: number): OhmCircuit {
  positive('Voltage', V); positive('Resistance', R);
  return { V, R, I: V / R, P: (V * V) / R };
}

// ---------------------------------------------------------------- series and parallel resistor networks
export interface NetworkElement { R: number; V: number; I: number; P: number }
export interface Network { mode: 'series' | 'parallel'; Vs: number; Rtotal: number; Itotal: number; Ptotal: number; elements: NetworkElement[] }

export function resistorNetwork(Vs: number, resistors: number[], mode: 'series' | 'parallel'): Network {
  positive('Voltage', Vs);
  if (resistors.length < 1) throw new SimError('Add at least one resistor');
  resistors.forEach((r, i) => positive(`R${i + 1}`, r));
  let Rtotal: number;
  let elements: NetworkElement[];
  if (mode === 'series') {
    Rtotal = resistors.reduce((a, b) => a + b, 0);
    const I = Vs / Rtotal;
    elements = resistors.map((R) => ({ R, V: I * R, I, P: I * I * R }));
  } else {
    Rtotal = 1 / resistors.reduce((a, r) => a + 1 / r, 0);
    elements = resistors.map((R) => ({ R, V: Vs, I: Vs / R, P: (Vs * Vs) / R }));
  }
  const Itotal = Vs / Rtotal;
  return { mode, Vs, Rtotal, Itotal, Ptotal: Vs * Itotal, elements };
}

// ---------------------------------------------------------------- voltage divider, unloaded and loaded
export interface Divider { Vin: number; VoutUnloaded: number; Vout: number; Rbottom: number; Iin: number; Iload: number; P1: number; P2: number; Pload: number; sagPercent: number }
/** R1 on top, R2 from the output to ground, optional load RL in parallel with R2 (pass 0 or Infinity for no load). */
export function voltageDivider(Vin: number, R1: number, R2: number, RL: number): Divider {
  positive('Input voltage', Vin); positive('R1', R1); positive('R2', R2);
  const loaded = Number.isFinite(RL) && RL > 0;
  const Rb = loaded ? (R2 * RL) / (R2 + RL) : R2;
  const Vout = (Vin * Rb) / (R1 + Rb);
  const VoutUnloaded = (Vin * R2) / (R1 + R2);
  const Iin = Vin / (R1 + Rb);
  const Iload = loaded ? Vout / RL : 0;
  return { Vin, VoutUnloaded, Vout, Rbottom: Rb, Iin, Iload, P1: Iin * Iin * R1, P2: (Vout * Vout) / R2, Pload: loaded ? (Vout * Vout) / RL : 0, sagPercent: ((VoutUnloaded - Vout) / VoutUnloaded) * 100 };
}

// ---------------------------------------------------------------- RC charging and discharging
export interface RcState { tau: number; vc: number; i: number; vr: number; energy: number; fraction: number }
/** Charging from 0 V towards V, or discharging from V towards 0 V through R. i is the loop current (positive while charging, negative while discharging). */
export function rcAt(V: number, R: number, C: number, t: number, charging: boolean): RcState {
  positive('Voltage', V); positive('Resistance', R); positive('Capacitance', C);
  if (!Number.isFinite(t) || t < 0) throw new SimError('Time cannot be negative');
  const tau = R * C;
  const e = Math.exp(-t / tau);
  const vc = charging ? V * (1 - e) : V * e;
  const i = charging ? (V / R) * e : -(V / R) * e;
  return { tau, vc, i, vr: Math.abs(i) * R, energy: 0.5 * C * vc * vc, fraction: vc / V };
}

// ---------------------------------------------------------------- RL current rise and decay
export interface RlState { tau: number; i: number; vl: number; vr: number; energy: number; fraction: number }
/** Switch closed: current rises from 0 to V/R. Switch opened through a freewheel path: current decays from V/R (inductor voltage reverses). */
export function rlAt(V: number, R: number, L: number, t: number, rising: boolean): RlState {
  positive('Voltage', V); positive('Resistance', R); positive('Inductance', L);
  if (!Number.isFinite(t) || t < 0) throw new SimError('Time cannot be negative');
  const tau = L / R;
  const e = Math.exp(-t / tau);
  const Imax = V / R;
  const i = rising ? Imax * (1 - e) : Imax * e;
  const vl = rising ? V * e : -V * e;
  return { tau, i, vl, vr: i * R, energy: 0.5 * L * i * i, fraction: i / Imax };
}

// ---------------------------------------------------------------- series RLC on AC (steady state, RMS phasors)
export interface Rlc {
  Vrms: number; f: number; R: number; omega: number; XL: number; XC: number; X: number; Z: number;
  Irms: number; phaseDeg: number; pf: number; kind: 'inductive' | 'capacitive' | 'resistive';
  P: number; Q: number; S: number; VR: number; VL: number; VC: number; f0: number; qualityFactor: number;
}
export function rlcSeries(Vrms: number, f: number, R: number, L: number, C: number): Rlc {
  positive('Voltage', Vrms); positive('Frequency', f); positive('Resistance', R); positive('Inductance', L); positive('Capacitance', C);
  const omega = 2 * Math.PI * f;
  const XL = omega * L;
  const XC = 1 / (omega * C);
  const X = XL - XC;
  const Z = Math.hypot(R, X);
  const Irms = Vrms / Z;
  const phi = Math.atan2(X, R);
  const f0 = 1 / (2 * Math.PI * Math.sqrt(L * C));
  const kind = Math.abs(X) < 1e-9 * Math.max(R, XL, XC) ? 'resistive' : X > 0 ? 'inductive' : 'capacitive';
  return {
    Vrms, f, R, omega, XL, XC, X, Z, Irms, phaseDeg: (phi * 180) / Math.PI, pf: R / Z, kind,
    P: Irms * Irms * R, Q: Irms * Irms * X, S: Vrms * Irms, VR: Irms * R, VL: Irms * XL, VC: Irms * XC, f0, qualityFactor: Math.sqrt(L / C) / R,
  };
}
/** Instantaneous source voltage and loop current at time t (current lags the voltage by phi when the circuit is inductive). */
export function rlcWave(c: Rlc, t: number): { v: number; i: number } {
  const phi = (c.phaseDeg * Math.PI) / 180;
  return { v: Math.SQRT2 * c.Vrms * Math.sin(c.omega * t), i: Math.SQRT2 * c.Irms * Math.sin(c.omega * t - phi) };
}

// ---------------------------------------------------------------- display helper
const PREFIXES: [number, string][] = [[1e9, 'G'], [1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'], [1e-6, 'µ'], [1e-9, 'n'], [1e-12, 'p']];
/** Engineering notation with an SI prefix and four significant figures, e.g. eng(0.0025, 'A') is "2.5 mA". */
export function eng(x: number, unit: string): string {
  if (!Number.isFinite(x)) return `– ${unit}`;
  if (x === 0) return `0 ${unit}`;
  const a = Math.abs(x);
  const [f, p] = PREFIXES.find(([k]) => a >= k * 0.9995) ?? PREFIXES[PREFIXES.length - 1];
  return `${Number((x / f).toPrecision(4))} ${p}${unit}`;
}
