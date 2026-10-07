/**
 * Generator sizing from a load list. Formulas only, no code tables.
 *   running   = sum(W * qty)
 *   extraStart = largest single-unit increase on starting = max(W * (multiplier - 1))
 *   kW for running load = running * (1 + margin)
 *   kW for starting     = (running + extraStart) / startingCapability
 *   required kW = max of the two / derate;  kVA = kW / power factor
 * Assumes motors start one at a time. startingCapability is 1 for a conservative design, where the
 * rated kW must cover the starting peak; a set with a motor-starting alternator option can be higher.
 */
import { kvaToAmps, type Phase } from './kva-to-amps';

export interface GenLoad { name: string; watts: number; qty: number; startMultiplier: number }
export interface GenInput {
  loads: GenLoad[]; margin: number; startingCapability: number; derate: number; powerFactor: number;
  volts: number; phase: Phase;
}
export interface GenResult {
  runningW: number; extraStartW: number; peakW: number; kwForRunning: number; kwForStarting: number;
  requiredKw: number; requiredKva: number; ratedAmps: number; governs: 'running load' | 'motor starting';
}

export function generatorSize(g: GenInput): GenResult {
  const loads = g.loads.filter((l) => l.qty > 0 && l.watts > 0);
  if (loads.length === 0) throw new Error('Add at least one load');
  for (const l of loads) {
    if (!Number.isInteger(l.qty)) throw new Error('Quantities must be whole numbers');
    if (!(l.startMultiplier >= 1)) throw new Error('Starting multiplier must be 1 or more (1 for loads that do not surge)');
  }
  if (!(g.margin >= 0 && g.margin <= 1)) throw new Error('Margin must be between 0 and 1');
  if (!(g.startingCapability >= 1 && g.startingCapability <= 3)) throw new Error('Starting capability must be between 1 and 3');
  if (!(g.derate > 0 && g.derate <= 1)) throw new Error('Derating factor must be in (0, 1]');
  if (!(g.powerFactor > 0 && g.powerFactor <= 1)) throw new Error('Power factor must be in (0, 1]');
  const runningW = loads.reduce((s, l) => s + l.watts * l.qty, 0);
  const extraStartW = Math.max(...loads.map((l) => l.watts * (l.startMultiplier - 1)));
  const peakW = runningW + extraStartW;
  const kwForRunning = (runningW * (1 + g.margin)) / 1000;
  const kwForStarting = peakW / g.startingCapability / 1000;
  const requiredKw = Math.max(kwForRunning, kwForStarting) / g.derate;
  const requiredKva = requiredKw / g.powerFactor;
  return {
    runningW, extraStartW, peakW, kwForRunning, kwForStarting, requiredKw, requiredKva,
    ratedAmps: kvaToAmps(requiredKva, g.volts, g.phase),
    governs: kwForStarting > kwForRunning ? 'motor starting' : 'running load',
  };
}
