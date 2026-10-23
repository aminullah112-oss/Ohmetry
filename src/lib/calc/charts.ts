/**
 * Row builders for the reference chart pages. Every number comes from the same functions the calculators use,
 * so a chart and its calculator cannot disagree. Nothing here is copied from a code table.
 */
import { kwToAmps } from './kw-to-amps';
import { kvaToAmps } from './kva-to-amps';
import { shortCircuit } from './transformer';
import { awgToDiameterMm, awgToMm2, awgLabel } from './awg-to-mm2';
import { resistivity } from './conductor-drop';
import { hpToKw, inputKw } from './kw-hp';
import { STANDARD_RATINGS } from './breaker-size';
import { pfCorrection } from './pf-correction';
import { kvaToKw, kwToKva } from './kva-kw';

export interface Chart { caption: string; headers: string[]; rows: string[][] }

const FT = 0.3048;
const fixed = (n: number, d: number) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
/** Amps and similar: more decimals when small, whole numbers when large. */
const auto = (n: number) => (n < 10 ? fixed(n, 2) : n < 100 ? fixed(n, 1) : fixed(n, 0));
const volts = (v: number) => `${v} V`;

export const KW_ROWS = [1, 1.5, 2, 3, 4, 5, 6, 7.2, 7.5, 7.6, 8, 10, 11, 12, 15, 20, 22, 25, 30, 40, 50, 75, 100];
export const AMP_ROWS = [5, 10, 15, 20, 30, 40, 50, 60, 80, 100, 150, 200];
export const WATT_ROWS = [60, 100, 140, 150, 200, 250, 300, 400, 500, 600, 700, 750, 800, 900, 1000, 1200, 1400, 1440, 1500, 1800, 2000, 2400, 2500, 3000, 3500, 4000, 4500, 5000, 6000, 7500];
export const TRANSFORMER_KVA = [15, 30, 45, 75, 112.5, 150, 225, 300, 500, 750, 1000, 1500, 2000, 2500];
export const HP_ROWS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 5, 7.5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100, 150, 200, 250, 300, 400, 500];

/** kW to amps. Single-phase at power factor 1, three-phase at 0.9. */
export function kwToAmpsChart(phase: 'single' | 'three'): Chart {
  const volt = phase === 'single' ? [120, 208, 230, 240] : [208, 240, 400, 480, 600];
  const pf = phase === 'single' ? 1 : 0.9;
  return {
    caption: phase === 'single' ? 'Single-phase line current in amps, power factor 1.0' : 'Three-phase line current in amps, power factor 0.9',
    headers: ['kW', ...volt.map(volts)],
    rows: KW_ROWS.map((kw) => [String(kw), ...volt.map((v) => auto(kwToAmps(kw, v, pf, phase)))]),
  };
}

/** Amps to kW. Single-phase at power factor 1, three-phase at 0.9. */
export function ampsToKwChart(phase: 'single' | 'three'): Chart {
  const volt = phase === 'single' ? [120, 208, 230, 240] : [208, 240, 400, 480, 600];
  const pf = phase === 'single' ? 1 : 0.9;
  const k = phase === 'three' ? Math.sqrt(3) : 1;
  return {
    caption: phase === 'single' ? 'Single-phase real power in kW, power factor 1.0' : 'Three-phase real power in kW, power factor 0.9',
    headers: ['Amps', ...volt.map(volts)],
    rows: AMP_ROWS.map((a) => [String(a), ...volt.map((v) => fixed((k * v * a * pf) / 1000, 2))]),
  };
}

/** Watts to amps on DC and single-phase AC at power factor 1. */
export function wattsToAmpsChart(): Chart {
  const volt = [12, 24, 48, 120, 230, 240];
  return {
    caption: 'Current in amps for a resistive load (power factor 1.0)',
    headers: ['Watts', ...volt.map(volts)],
    rows: WATT_ROWS.map((w) => [String(w), ...volt.map((v) => auto(w / v))]),
  };
}

/** Three-phase transformer full-load current by kVA, for several line voltages. */
export function transformerFlcChart(voltagesV: number[]): Chart {
  return {
    caption: `Three-phase full-load current in amps at ${voltagesV.map(volts).join(', ')}`,
    headers: ['kVA', ...voltagesV.map(volts)],
    rows: TRANSFORMER_KVA.map((kva) => [String(kva), ...voltagesV.map((v) => auto(kvaToAmps(kva, v, 'three')))]),
  };
}

/** Available fault current at a transformer secondary on an infinite bus, in kA, by %Z. */
export function transformerFaultChart(secondaryV: number, zPercents: number[]): Chart {
  return {
    caption: `Maximum symmetrical fault current in kA at ${secondaryV} V, infinite bus`,
    headers: ['kVA', ...zPercents.map((z) => `${z} % Z`)],
    rows: TRANSFORMER_KVA.filter((k) => k >= 45).map((kva) => [String(kva), ...zPercents.map((z) => fixed(shortCircuit(kva, secondaryV, z).iscA / 1000, 1))]),
  };
}

export const DROP_AWG = [14, 12, 10, 8, 6, 4, 3, 2, 1, 0, -1, -2, -3];
const rhoPerFt = (material: 'copper' | 'aluminium', awg: number) => (resistivity(material, 75) * (FT * 1000)) / awgToMm2(awg) / 1000; // ohm per ft at 75 C

/** Volts dropped per ampere per 100 ft of one-way run, two-wire circuit, conductors at 75 C. */
export function dropPerAmpChart(): Chart {
  return {
    caption: 'Volts dropped per ampere for each 100 ft of one-way run (out and back counted), conductors at 75 °C',
    headers: ['AWG', 'Copper', 'Aluminium'],
    rows: DROP_AWG.map((n) => [awgLabel(n), fixed(2 * 100 * rhoPerFt('copper', n), 3), fixed(2 * 100 * rhoPerFt('aluminium', n), 3)]),
  };
}

/** Longest one-way run in feet for a 3 % drop on a single-phase copper circuit. */
export function maxLengthChart(systemV: number, ampsList: number[]): Chart {
  return {
    caption: `Longest one-way run in feet for a 3 % drop, copper at 75 °C, ${systemV} V single-phase`,
    headers: ['AWG', ...ampsList.map((a) => `${a} A`)],
    rows: DROP_AWG.map((n) => [awgLabel(n), ...ampsList.map((a) => fixed((0.03 * systemV) / (a * 2 * rhoPerFt('copper', n)), 0))]),
  };
}

/** AWG diameter, area and resistance (solid conductor). */
export const RESISTANCE_AWG = [-3, -2, -1, 0, 1, 2, 3, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24];
export function wireResistanceChart(): Chart {
  const per1000ft = (material: 'copper' | 'aluminium', tempC: number, n: number) => (resistivity(material, tempC) * FT * 1000) / awgToMm2(n);
  return {
    caption: 'Solid round conductor: size, area and DC resistance in ohms per 1,000 ft',
    headers: ['AWG', 'Diameter (mm)', 'Area (mm²)', 'Cu 20 °C', 'Cu 75 °C', 'Al 20 °C', 'Al 75 °C'],
    rows: RESISTANCE_AWG.map((n) => [
      awgLabel(n), fixed(awgToDiameterMm(n), 3), fixed(awgToMm2(n), n > 8 ? 3 : 2),
      fixed(per1000ft('copper', 20, n), n > 8 ? 3 : 4), fixed(per1000ft('copper', 75, n), n > 8 ? 3 : 4),
      fixed(per1000ft('aluminium', 20, n), n > 8 ? 3 : 4), fixed(per1000ft('aluminium', 75, n), n > 8 ? 3 : 4),
    ]),
  };
}

/** Horsepower to kW, with the electrical input power at a stated motor efficiency. */
export function hpToKwChart(efficiency = 0.9): Chart {
  return {
    caption: `Horsepower to kilowatts, with motor input power at ${Math.round(efficiency * 100)} % efficiency`,
    headers: ['HP', 'kW (mechanical hp)', 'kW (metric hp)', `Input kW at ${Math.round(efficiency * 100)} %`],
    rows: HP_ROWS.map((hp) => {
      const kw = hpToKw(hp, 'mechanical');
      return [String(hp), fixed(kw, 3), fixed(hpToKw(hp, 'metric'), 3), fixed(inputKw(kw, efficiency), 2)];
    }),
  };
}

export const BREAKER_ROWS = [15, 20, 30, 40, 50, 60, 70, 80, 100, 125, 150, 200];
/** Power available from a breaker rating, at the full rating and at 80 % for continuous load. */
export function breakerWattsChart(): Chart {
  for (const r of BREAKER_ROWS) if (!STANDARD_RATINGS.includes(r)) throw new Error(`${r} A is not a standard rating`);
  return {
    caption: 'Largest continuous load a breaker supports (80 % of its rating), in watts, power factor 1.0',
    headers: ['Breaker', 'Continuous amps', '120 V', '240 V', '208 V three-phase', '480 V three-phase'],
    rows: BREAKER_ROWS.map((r) => {
      const a = 0.8 * r;
      return [`${r} A`, fixed(a, a % 1 ? 1 : 0), fixed(120 * a, 0), fixed(240 * a, 0), fixed(Math.sqrt(3) * 208 * a, 0), fixed(Math.sqrt(3) * 480 * a, 0)];
    }),
  };
}

export const PF_NOW = [0.5, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9];
export const PF_TARGET = [0.9, 0.95, 0.98, 1];
/** kvar of capacitor per kW of load to move from the present power factor to a target. */
export function pfMultiplierChart(): Chart {
  return {
    caption: 'Capacitor kvar needed per kW of load',
    headers: ['Present PF', ...PF_TARGET.map((t) => `Target ${t}`)],
    rows: PF_NOW.map((now) => [String(now), ...PF_TARGET.map((t) => (t > now ? fixed(pfCorrection(1, now, t).kvarNeeded, 3) : '–'))]),
  };
}

export const RUN_LENGTHS_FT = [25, 50, 75, 100, 150, 200, 300];
/** Smallest copper size the NEC allows to be protected by a 15, 20 or 30 A device (240.4(D)): 14, 12 and 10 AWG. Index = AWG number. */
const SMALL_CONDUCTOR_FLOOR: Record<number, number> = { 15: 14, 20: 12, 30: 10 };

/**
 * Smallest copper AWG for a single-phase two-wire run that keeps the drop within 3 %, and is also not smaller than the
 * conductor 240.4(D) allows for a 15, 20 or 30 A device. Only those three currents are charted because above 30 A the
 * ampacity table, not this method, decides the size. Resistance only, conductors at 75 C.
 */
export function wireSizeByDistanceChart(systemV: number, ampsList: number[] = [15, 20, 30]): Chart {
  const smallest = (amps: number, lengthFt: number) => {
    const floor = SMALL_CONDUCTOR_FLOOR[amps];
    if (floor === undefined) throw new Error(`${amps} A has no small-conductor floor`);
    const ok = DROP_AWG.filter((n) => n <= floor).find((n) => (2 * amps * lengthFt * rhoPerFt('copper', n)) / systemV <= 0.03);
    return ok === undefined ? '> 4/0' : awgLabel(ok);
  };
  return {
    caption: `Smallest copper AWG for a 3 % drop, ${systemV} V single-phase, conductors at 75 °C`,
    headers: ['One-way run', ...ampsList.map((a) => `${a} A`)],
    rows: RUN_LENGTHS_FT.map((ft) => [`${ft} ft`, ...ampsList.map((a) => smallest(a, ft))]),
  };
}

export const KVA_ROWS = [1, 2, 3, 5, 7.5, 10, 15, 20, 25, 30, 37.5, 45, 50, 75, 100, 112.5, 150, 200, 225, 250, 300, 400, 500, 750, 1000, 1500, 2000];
export const KW_TO_KVA_ROWS = [1, 2, 5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 80, 100, 150, 200, 250, 300, 400, 500, 800, 1000];
export const KVA_PF = [0.7, 0.8, 0.85, 0.9, 0.95, 1];

/** Real power in kW for a given apparent power, at common power factors. Same for single-phase and three-phase. */
export function kvaToKwChart(): Chart {
  return {
    caption: 'Real power in kW for each kVA rating and power factor',
    headers: ['kVA', ...KVA_PF.map((pf) => `PF ${pf}`)],
    rows: KVA_ROWS.map((kva) => [String(kva), ...KVA_PF.map((pf) => auto(kvaToKw(kva, pf).kw))]),
  };
}

/** Apparent power in kVA a given real load needs, at common power factors. */
export function kwToKvaChart(): Chart {
  return {
    caption: 'Apparent power in kVA needed for each kW load and power factor',
    headers: ['kW', ...KVA_PF.map((pf) => `PF ${pf}`)],
    rows: KW_TO_KVA_ROWS.map((kw) => [String(kw), ...KVA_PF.map((pf) => auto(kwToKva(kw, pf).kva))]),
  };
}
