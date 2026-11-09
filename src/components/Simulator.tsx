import { useEffect, useRef, useState, type ReactNode } from 'react';
import { SimError, eng, ohmCircuit, rcAt, resistorNetwork, rlAt, rlcSeries, rlcWave, voltageDivider } from '../lib/calc/simulator';

type ConceptId = 'ohm' | 'network' | 'divider' | 'rc' | 'rl' | 'rlc';
type Unit = { u: string; f: number };
type Vals = Record<string, number>;

const OHM: Unit[] = [{ u: 'Ω', f: 1 }, { u: 'kΩ', f: 1e3 }, { u: 'MΩ', f: 1e6 }];
const VOLT: Unit[] = [{ u: 'mV', f: 1e-3 }, { u: 'V', f: 1 }, { u: 'kV', f: 1e3 }];
const FARAD: Unit[] = [{ u: 'pF', f: 1e-12 }, { u: 'nF', f: 1e-9 }, { u: 'µF', f: 1e-6 }, { u: 'mF', f: 1e-3 }];
const HENRY: Unit[] = [{ u: 'µH', f: 1e-6 }, { u: 'mH', f: 1e-3 }, { u: 'H', f: 1 }];
const HERTZ: Unit[] = [{ u: 'Hz', f: 1 }, { u: 'kHz', f: 1e3 }];

interface Field { key: string; label: string; units: Unit[]; min: number; max: number; optional?: boolean }

interface Concept {
  id: ConceptId; name: string; blurb: string; transient: boolean; fields: Field[]; defaults: Vals;
  modes?: { key: string; label: string; options: [string, string][]; def: string }[];
  activities: string[]; how: string;
}

const CONCEPTS: Concept[] = [
  { id: 'ohm', name: "Ohm's law", transient: false, blurb: 'One source, one resistor. Set the voltage and the resistance and watch the current and power that result.',
    fields: [{ key: 'V', label: 'Source voltage', units: VOLT, min: 0.1, max: 1000 }, { key: 'R', label: 'Resistance', units: OHM, min: 0.1, max: 1e6 }],
    defaults: { V: 12, R: 6 },
    how: 'I = V / R and P = V × I = V² / R. The line on the chart is every (V, I) pair this resistor allows; the dot is where the circuit is now.',
    activities: ['Double the resistance and note what happens to the current and the power.', 'Keep 12 V and find the resistance that dissipates exactly 1 W (hint: R = V² / P).', 'Raise the voltage to 24 V on the same resistor. By what factor does the power change, and why is it not 2?'] },
  { id: 'network', name: 'Series and parallel', transient: false, blurb: 'Up to four resistors on one source, in series or in parallel. See which carries the most current and which dissipates the most power.',
    fields: [{ key: 'V', label: 'Source voltage', units: VOLT, min: 0.1, max: 1000 }, { key: 'R1', label: 'R1', units: OHM, min: 1, max: 1e6 }, { key: 'R2', label: 'R2', units: OHM, min: 1, max: 1e6 },
      { key: 'R3', label: 'R3', units: OHM, min: 1, max: 1e6 }, { key: 'R4', label: 'R4', units: OHM, min: 1, max: 1e6 }],
    defaults: { V: 12, R1: 100, R2: 220, R3: 330, R4: 470 },
    modes: [{ key: 'layout', label: 'Connection', options: [['series', 'In series'], ['parallel', 'In parallel']], def: 'series' }, { key: 'count', label: 'Resistors', options: [['2', '2'], ['3', '3'], ['4', '4']], def: '3' }],
    how: 'Series: the same current flows through every resistor, and the voltage divides in proportion to resistance. Parallel: every resistor sees the full source voltage, and the current divides in inverse proportion to resistance.',
    activities: ['In series, make R1 ten times larger than the others. Where does most of the voltage appear?', 'In parallel, add a fourth resistor. Does the total resistance go up or down? Check that it is always below the smallest branch.', 'Compare the total power in series and in parallel for the same four resistors.'] },
  { id: 'divider', name: 'Voltage divider', transient: false, blurb: 'Two resistors divide a voltage. Add a load and see the output sag, which is the main practical limit of a divider.',
    fields: [{ key: 'Vin', label: 'Input voltage', units: VOLT, min: 0.1, max: 1000 }, { key: 'R1', label: 'R1 (top)', units: OHM, min: 1, max: 1e6 }, { key: 'R2', label: 'R2 (bottom)', units: OHM, min: 1, max: 1e6 },
      { key: 'RL', label: 'Load resistance', units: OHM, min: 1, max: 1e7, optional: true }],
    defaults: { Vin: 10, R1: 1000, R2: 1000, RL: 1000 },
    modes: [{ key: 'load', label: 'Load', options: [['on', 'Load connected'], ['off', 'No load']], def: 'on' }],
    how: 'Unloaded, Vout = Vin × R2 / (R1 + R2). A load RL in parallel with R2 lowers the bottom resistance to R2 × RL / (R2 + RL), so the output falls. A load at least ten times R2 keeps the error small.',
    activities: ['With the load connected, find how large the load must be for the output to stay within 2 % of the unloaded value.', 'Lower both R1 and R2 by a factor of ten. What happens to the sag and to the current drawn from the source?', 'Set R2 to 100 Ω with R1 at 1 kΩ. Predict the output, then run it.'] },
  { id: 'rc', name: 'RC charging', transient: true, blurb: 'A resistor charges or discharges a capacitor. The time constant τ = R × C sets how fast.',
    fields: [{ key: 'V', label: 'Source voltage', units: VOLT, min: 0.1, max: 1000 }, { key: 'R', label: 'Resistance', units: OHM, min: 1, max: 1e7 }, { key: 'C', label: 'Capacitance', units: FARAD, min: 1e-9, max: 1e-1 }],
    defaults: { V: 5, R: 1000, C: 1e-3 },
    modes: [{ key: 'dir', label: 'Action', options: [['charge', 'Charge from 0 V'], ['discharge', 'Discharge from V']], def: 'charge' }],
    how: 'Charging: vC = V (1 − e^(−t/τ)) and i = (V/R) e^(−t/τ). After one τ the capacitor is at 63.2 % of the supply, and after five τ it is above 99 %. The energy stored is ½ C v².',
    activities: ['Predict the time to reach 63 % for 1 kΩ and 1 mF, then run it and read the cursor time.', 'Double R and keep C. What happens to τ and to the starting current?', 'Switch to discharge. Why does the current have the opposite sign?'] },
  { id: 'rl', name: 'RL current rise', transient: true, blurb: 'Current in an inductor cannot change instantly. The time constant τ = L / R sets how fast it rises or decays.',
    fields: [{ key: 'V', label: 'Source voltage', units: VOLT, min: 0.1, max: 1000 }, { key: 'R', label: 'Resistance', units: OHM, min: 0.1, max: 1e5 }, { key: 'L', label: 'Inductance', units: HENRY, min: 1e-6, max: 100 }],
    defaults: { V: 10, R: 10, L: 1 },
    modes: [{ key: 'dir', label: 'Action', options: [['rise', 'Close the switch (rise)'], ['decay', 'Open into a freewheel path (decay)']], def: 'rise' }],
    how: 'Rising: i = (V/R)(1 − e^(−t/τ)) and vL = V e^(−t/τ). The inductor voltage starts at the full supply and falls to zero. The energy stored is ½ L i². Decay: the current falls as e^(−t/τ) and the inductor voltage reverses.',
    activities: ['Raise L tenfold. What happens to the final current and to the time it takes to get there?', 'Watch the inductor voltage at the instant the switch closes. Why is it equal to the supply?', 'Switch to decay and explain the sign of the inductor voltage.'] },
  { id: 'rlc', name: 'AC series RLC', transient: true, blurb: 'A resistor, an inductor and a capacitor in series on an AC supply. See reactance, impedance, phase angle and power factor, and find the resonant frequency.',
    fields: [{ key: 'V', label: 'Supply voltage (RMS)', units: VOLT, min: 1, max: 1000 }, { key: 'f', label: 'Frequency', units: HERTZ, min: 1, max: 5000 }, { key: 'R', label: 'Resistance', units: OHM, min: 0.1, max: 1e5 },
      { key: 'L', label: 'Inductance', units: HENRY, min: 1e-4, max: 10 }, { key: 'C', label: 'Capacitance', units: FARAD, min: 1e-9, max: 1e-1 }],
    defaults: { V: 230, f: 50, R: 10, L: 0.1, C: 1e-4 },
    how: 'XL = 2πfL, XC = 1 / (2πfC), Z = √(R² + (XL − XC)²), I = V / Z, power factor = R / Z. Resonance is at f₀ = 1 / (2π√(LC)), where XL = XC, the impedance is just R and the current is in phase with the voltage.',
    activities: ['Set the frequency to the resonant frequency shown in the results. What happens to the impedance, the phase angle and the power factor?', 'At resonance, compare the voltage across the inductor with the supply voltage. Is it larger?', 'Move the frequency well above resonance. Does the circuit behave as inductive or capacitive, and does the current lead or lag?'] },
];

// ------------------------------------------------------------------ small helpers
const pickUnit = (si: number, units: Unit[]) => { let k = 0; units.forEach((u, i) => { if (Math.abs(si) >= u.f * 0.9995) k = i; }); return k; };
const fmtNum = (n: number) => String(Number(n.toPrecision(4)));
const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const TICKS = 4;

function NumField({ id, field, si, onChange }: { id: string; field: Field; si: number; onChange: (v: number) => void }) {
  const [unitIdx, setUnitIdx] = useState(() => pickUnit(si, field.units));
  const [text, setText] = useState(() => fmtNum(si / field.units[unitIdx].f));
  const [bad, setBad] = useState(false);
  const focused = useRef(false);
  useEffect(() => { if (!focused.current) { setText(fmtNum(si / field.units[unitIdx].f)); setBad(false); } }, [si, unitIdx, field.units]);
  const pos = clamp((Math.log(si / field.min) / Math.log(field.max / field.min)) * 1000, 0, 1000);
  return (
    <div className="sim-field">
      <label htmlFor={id}>{field.label}</label>
      <div className="sim-numrow">
        <input id={id} inputMode="decimal" value={text} aria-invalid={bad}
          onFocus={() => { focused.current = true; }}
          onBlur={() => { focused.current = false; setText(fmtNum(si / field.units[unitIdx].f)); setBad(false); }}
          onChange={(e) => {
            setText(e.target.value);
            const n = Number(e.target.value.replace(',', '.'));
            if (Number.isFinite(n) && n > 0) { setBad(false); onChange(n * field.units[unitIdx].f); } else setBad(true);
          }} />
        {field.units.length > 1
          ? <select aria-label={`${field.label} unit`} value={unitIdx} onChange={(e) => setUnitIdx(Number(e.target.value))}>{field.units.map((u, i) => <option key={u.u} value={i}>{u.u}</option>)}</select>
          : <span className="sim-unit">{field.units[0].u}</span>}
      </div>
      <input className="sim-range" type="range" min={0} max={1000} value={pos} aria-label={`${field.label} slider`}
        onChange={(e) => { const v = field.min * Math.pow(field.max / field.min, Number(e.target.value) / 1000); onChange(Number(v.toPrecision(3))); }} />
      {bad && <small role="alert">Enter a number above zero.</small>}
    </div>
  );
}

// ------------------------------------------------------------------ schematic parts (drawn horizontally, then placed and rotated)
const Part = ({ x, y, rot = 0, children }: { x: number; y: number; rot?: number; children: ReactNode }) => <g transform={`translate(${x},${y}) rotate(${rot})`}>{children}</g>;
const Resistor = ({ x, y, rot, label }: { x: number; y: number; rot?: number; label?: string }) => (
  <Part x={x} y={y} rot={rot}><rect x={-34} y={-12} width={68} height={24} className="sim-mask" />
    <polyline className="sim-part" points="-34,0 -26,0 -20,-10 -10,10 0,-10 10,10 20,-10 26,0 34,0" />{label && <text className="sim-label" y={-18} textAnchor="middle" transform={rot ? `rotate(${-rot})` : undefined}>{label}</text>}</Part>);
const Capacitor = ({ x, y, rot, label }: { x: number; y: number; rot?: number; label?: string }) => (
  <Part x={x} y={y} rot={rot}><rect x={-14} y={-22} width={28} height={44} className="sim-mask" /><line className="sim-part" x1={-6} y1={-18} x2={-6} y2={18} /><line className="sim-part" x1={6} y1={-18} x2={6} y2={18} />
    {label && <text className="sim-label" y={-28} textAnchor="middle" transform={rot ? `rotate(${-rot})` : undefined}>{label}</text>}</Part>);
const Inductor = ({ x, y, rot, label }: { x: number; y: number; rot?: number; label?: string }) => (
  <Part x={x} y={y} rot={rot}><rect x={-34} y={-14} width={68} height={22} className="sim-mask" /><path className="sim-part" d="M-32,0 a8,9 0 0 1 16,0 a8,9 0 0 1 16,0 a8,9 0 0 1 16,0 a8,9 0 0 1 16,0" />
    {label && <text className="sim-label" y={-20} textAnchor="middle" transform={rot ? `rotate(${-rot})` : undefined}>{label}</text>}</Part>);
const Battery = ({ x, y, label }: { x: number; y: number; label?: string }) => (
  <Part x={x} y={y}><rect x={-22} y={-10} width={44} height={20} className="sim-mask" /><line className="sim-part" x1={-20} y1={-6} x2={20} y2={-6} /><line className="sim-part" x1={-11} y1={6} x2={11} y2={6} />
    <text className="sim-label" x={26} y={-3}>+</text>{label && <text className="sim-label" x={-26} y={4} textAnchor="end">{label}</text>}</Part>);
const AcSource = ({ x, y, label }: { x: number; y: number; label?: string }) => (
  <Part x={x} y={y}><circle r={20} className="sim-mask sim-part" /><path className="sim-part" d="M-11,0 q5.5,-12 11,0 t11,0" />{label && <text className="sim-label" x={-26} y={4} textAnchor="end">{label}</text>}</Part>);

const Wire = ({ d, phase, share = 1, active }: { d: string; phase: number; share?: number; active: boolean }) => (
  <>
    <path d={d} className="sim-wire" />
    {active && <path d={d} className="sim-flow" strokeDasharray="1 15" strokeDashoffset={-phase * share} />}
  </>);

// ------------------------------------------------------------------ plots
interface Series { pts: [number, number][]; cls: string; label: string; faint?: boolean }
function Plot({ series, xMax, xUnit, yMin, yMax, yUnit, cursor, marks, point, xLabel, yLabel }: { series: Series[]; xMax: number; xUnit: string; yMin: number; yMax: number; yUnit?: string; cursor?: number; marks?: { x: number; label: string }[]; point?: [number, number]; xLabel: string; yLabel: string }) {
  const W = 520, H = 252, L = yUnit ? 58 : 46, R = 12, T = 14, B = 62;
  const sx = (x: number) => L + (x / xMax) * (W - L - R);
  const sy = (y: number) => T + (1 - (y - yMin) / (yMax - yMin)) * (H - T - B);
  const path = (pts: [number, number][]) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`).join(' ');
  const xt = Array.from({ length: TICKS + 1 }, (_, i) => (xMax * i) / TICKS);
  const yt = [yMin, (yMin + yMax) / 2, yMax];
  return (
    <svg className="sim-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${yLabel} against ${xLabel}`}>
      {yt.map((v) => <g key={v}><line x1={L} x2={W - R} y1={sy(v)} y2={sy(v)} className="sim-grid" /><text x={L - 6} y={sy(v) + 4} textAnchor="end" className="sim-tick">{yUnit ? eng(v, yUnit) : Number(v.toFixed(2))}</text></g>)}
      {xt.map((v) => <text key={v} x={sx(v)} y={H - B + 16} textAnchor="middle" className="sim-tick">{eng(v, xUnit)}</text>)}
      <line x1={L} x2={L} y1={T} y2={H - B} className="sim-axis" /><line x1={L} x2={W - R} y1={sy(0)} y2={sy(0)} className="sim-axis" />
      {marks?.map((m) => <g key={m.label}><line x1={sx(m.x)} x2={sx(m.x)} y1={T} y2={H - B} className="sim-mark" /><text x={sx(m.x) + 4} y={T + 10} className="sim-tick">{m.label}</text></g>)}
      {series.map((s, k) => <path key={`${s.label}${k}`} d={path(s.pts)} className={`sim-curve ${s.cls}${s.faint ? ' faint' : ''}`} />)}
      {point && <circle cx={sx(point[0])} cy={sy(point[1])} r={6} className="sim-dot" />}
      {cursor !== undefined && <line x1={sx(cursor)} x2={sx(cursor)} y1={T} y2={H - B} className="sim-cursor" />}
      <text x={(L + W - R) / 2} y={H - B + 32} textAnchor="middle" className="sim-tick">{xLabel}</text>
      {series.filter((s) => !s.faint).map((s, i) => <g key={s.label}><rect x={L + 4 + i * 230} y={H - 16} width={10} height={10} className={`sim-key ${s.cls}`} /><text x={L + 19 + i * 230} y={H - 7} className="sim-tick">{s.label}</text></g>)}
    </svg>);
}
const sample = (f: (x: number) => number, xMax: number, n = 160): [number, number][] => Array.from({ length: n + 1 }, (_, i) => { const x = (xMax * i) / n; return [x, f(x)]; });
const upTo = (pts: [number, number][], x: number) => pts.filter((p) => p[0] <= x);

function Bars({ items, unit }: { items: { label: string; v: number; cls?: string }[]; unit: string }) {
  const W = 520, H = 252, L = 46, B = 62, T = 24;
  const max = Math.max(...items.map((i) => Math.abs(i.v)), 1e-12);
  const bw = Math.min(70, (W - L - 20) / items.length - 14);
  return (
    <svg className="sim-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Bar chart in ${unit}`}>
      <line x1={L} x2={W - 8} y1={H - B} y2={H - B} className="sim-axis" />
      {items.map((it, k) => {
        const x = L + 10 + k * ((W - L - 20) / items.length) + ((W - L - 20) / items.length - bw) / 2;
        const h = (Math.abs(it.v) / max) * (H - B - T - 16);
        return <g key={it.label}><rect x={x} y={H - B - h} width={bw} height={h} className={`sim-bar ${it.cls ?? 'c1'}`} /><text x={x + bw / 2} y={H - B - h - 6} textAnchor="middle" className="sim-tick">{eng(it.v, unit)}</text><text x={x + bw / 2} y={H - B + 16} textAnchor="middle" className="sim-tick">{it.label}</text></g>;
      })}
    </svg>);
}

// ------------------------------------------------------------------ the simulator
const PLAYBACK_SECONDS = 10;

interface View { rows: [string, string][]; schematic: ReactNode; plot: ReactNode; flow: number; summary: string; tEnd?: number; error?: string; extra?: ReactNode }

export default function Simulator() {
  const [id, setId] = useState<ConceptId>('ohm');
  const concept = CONCEPTS.find((c) => c.id === id)!;
  const [store, setStore] = useState<Record<string, Vals>>(() => Object.fromEntries(CONCEPTS.map((c) => [c.id, { ...c.defaults }])));
  const [modeStore, setModeStore] = useState<Record<string, Record<string, string>>>(() => Object.fromEntries(CONCEPTS.map((c) => [c.id, Object.fromEntries((c.modes ?? []).map((m) => [m.key, m.def]))])));
  const vals = store[id];
  const modes = modeStore[id];
  const [elapsed, setElapsed] = useState(0);
  const [phase, setPhase] = useState(0);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const duration = PLAYBACK_SECONDS / speed;
  const frac = concept.transient ? clamp(elapsed / duration, 0, 1) : 0;
  const view = build(concept, vals, modes, frac, elapsed > 0 || running, phase);

  const latest = useRef(view); latest.current = view;
  const durRef = useRef(duration); durRef.current = duration;
  const transientRef = useRef(concept.transient); transientRef.current = concept.transient;
  useEffect(() => {
    if (!running) return;
    let raf = 0, last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      setElapsed((e) => { const n = e + dt; return transientRef.current ? Math.min(n, durRef.current) : n; });
      setPhase((p) => p + (reduced ? 0 : latest.current.flow * dt * 70));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, reduced]);
  useEffect(() => { if (concept.transient && running && elapsed >= duration) setRunning(false); }, [elapsed, duration, running, concept.transient]);

  const reset = () => { setRunning(false); setElapsed(0); setPhase(0); };
  const choose = (c: ConceptId) => { setId(c); reset(); };
  const finished = concept.transient && elapsed >= duration;
  const started = elapsed > 0 || running;
  const set = (k: string, v: number) => setStore((s) => ({ ...s, [id]: { ...s[id], [k]: v } }));
  const setMode = (k: string, v: string) => setModeStore((s) => ({ ...s, [id]: { ...s[id], [k]: v } }));
  const nShown = id === 'network' ? Number(modes.count) : 99;
  const fields = concept.fields.filter((f) => {
    if (id === 'network' && /^R(\d)$/.test(f.key)) return Number(f.key[1]) <= nShown;
    if (id === 'divider' && f.key === 'RL') return modes.load === 'on';
    return true;
  });

  return (
    <div className="calc sim" aria-label="Electrical circuit simulator">
      <div className="sim-tabs" role="tablist" aria-label="Choose a concept">
        {CONCEPTS.map((c) => <button key={c.id} role="tab" type="button" aria-selected={c.id === id} className={c.id === id ? 'on' : ''} onClick={() => choose(c.id)}>{c.name}</button>)}
      </div>
      <p className="sim-lead">{concept.blurb}</p>

      <div className="grid sim-inputs">
        {(concept.modes ?? []).map((m) => (
          <div className="sim-field" key={m.key}><label htmlFor={`sim-${id}-${m.key}`}>{m.label}</label>
            <select id={`sim-${id}-${m.key}`} value={modes[m.key]} onChange={(e) => setMode(m.key, e.target.value)}>{m.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>))}
        {fields.map((f) => <NumField key={`${id}-${f.key}`} id={`sim-${id}-${f.key}`} field={f} si={vals[f.key]} onChange={(v) => set(f.key, v)} />)}
      </div>

      <div className="sim-controls">
        <button type="button" className="sim-run" onClick={() => { if (finished) { setElapsed(0); setPhase(0); } setRunning(true); }} disabled={running}>{running ? 'Running…' : finished ? 'Run again' : elapsed > 0 ? 'Resume' : 'Run simulation'}</button>
        <button type="button" className="print" onClick={() => setRunning(false)} disabled={!running}>{concept.transient ? 'Pause' : 'Stop'}</button>
        <button type="button" className="print" onClick={reset} disabled={!started}>Reset</button>
        {concept.transient && <label className="sim-speed">Playback speed
          <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}><option value={0.5}>0.5×</option><option value={1}>1×</option><option value={2}>2×</option><option value={4}>4×</option></select></label>}
        <span className="sim-status" role="status">{view.error ? '' : !started ? 'Ready. Press Run simulation.' : running ? (concept.transient ? `Running: simulated time ${eng(view.tEnd! * frac, 's')} of ${eng(view.tEnd!, 's')}` : 'Circuit energised. Change any input to see the result update.') : finished ? 'Finished. Press Run again or change an input.' : concept.transient ? 'Paused.' : 'Stopped.'}</span>
      </div>

      {view.error ? <p className="hint" role="alert">{view.error}</p> : (
        <>
          <div className="sim-stage">
            <svg className="sim-svg" viewBox="0 0 520 220" role="img" aria-label={`Schematic: ${concept.name}`}>{view.schematic}</svg>
            {view.plot}
          </div>
          {view.extra}
          <div className="result" aria-live="off">{view.rows.map(([k, v]) => <div key={k}><span>{k}</span><strong>{started || concept.transient ? v : '–'}</strong></div>)}</div>
          <p className="sim-summary">{started ? view.summary : 'Results appear here when you run the simulation.'}</p>
        </>)}

      <details className="more" open>
        <summary>How this works</summary><p>{concept.how}</p>
        <p className="hint">Ideal components: no wire resistance, no heating, no saturation. Real parts differ. Playback of a transient is compressed to about {PLAYBACK_SECONDS} seconds; the clock shows simulated time.</p>
      </details>
      <details className="more">
        <summary>Try these activities</summary>
        <ol className="sim-activities">{concept.activities.map((a) => <li key={a}>{a}</li>)}</ol>
      </details>
    </div>
  );
}

// ------------------------------------------------------------------ one model per concept: numbers, schematic, plot
/** Dot speed for a DC current on a log scale, so 1 mA, 10 mA, 100 mA and 1 A are all visibly different. */
const speedOf = (I: number) => clamp(0.25 + 0.25 * Math.log10(Math.max(Math.abs(I), 1e-9) / 1e-3), 0.08, 1.3);
const T = (x: number, y: number, t: string, anchor: 'start' | 'middle' | 'end' = 'middle') => <text className="sim-label" x={x} y={y} textAnchor={anchor}>{t}</text>;

function build(c: Concept, v: Vals, m: Record<string, string>, frac: number, on: boolean, phase: number): View {
  try {
    if (c.id === 'ohm') {
      const r = ohmCircuit(v.V, v.R);
      const Vmax = v.V * 1.5;
      const d = 'M50,119 V40 H470 V180 H50 V131';
      return {
        flow: on ? speedOf(r.I) : 0,
        rows: [['Current', eng(r.I, 'A')], ['Power (heat)', eng(r.P, 'W')], ['Voltage across R', eng(r.V, 'V')], ['Resistance', eng(r.R, 'Ω')]],
        summary: `${eng(v.V, 'V')} across ${eng(v.R, 'Ω')} drives ${eng(r.I, 'A')} and dissipates ${eng(r.P, 'W')} as heat.`,
        schematic: <><Wire d={d} phase={phase} active={on} /><Battery x={50} y={125} /><Resistor x={260} y={40} />{T(260, 66, eng(v.R, 'Ω'))}{T(62, 152, eng(v.V, 'V'), 'start')}{on && T(260, 205, `I = ${eng(r.I, 'A')}`)}</>,
        plot: <Plot series={[{ pts: sample((x) => x / v.R, Vmax, 2), cls: 'c1', label: 'Current this resistor allows' }]} xMax={Vmax} xUnit="V" yMin={0} yMax={Vmax / v.R} yUnit="A" point={on ? [v.V, r.I] : undefined} xLabel="Voltage" yLabel="Current" />,
      };
    }
    if (c.id === 'network') {
      const n = Number(m.count), mode = m.layout as 'series' | 'parallel';
      const Rs = ['R1', 'R2', 'R3', 'R4'].slice(0, n).map((k) => v[k]);
      const net = resistorNetwork(v.V, Rs, mode);
      const rows: [string, string][] = [['Total resistance', eng(net.Rtotal, 'Ω')], ['Total current', eng(net.Itotal, 'A')], ['Total power', eng(net.Ptotal, 'W')],
        ...net.elements.map((e, k): [string, string] => [`R${k + 1}`, `${eng(e.V, 'V')} · ${eng(e.I, 'A')} · ${eng(e.P, 'W')}`])];
      let schematic: ReactNode;
      if (mode === 'series') {
        const d = 'M50,119 V40 H470 V180 H50 V131';
        const xs = Rs.map((_, k) => 50 + ((k + 0.5) * 420) / n);
        schematic = <><Wire d={d} phase={phase} active={on} /><Battery x={50} y={125} />{xs.map((x, k) => <g key={k}><Resistor x={x} y={40} />{T(x, 66, `R${k + 1} ${eng(Rs[k], 'Ω')}`)}</g>)}{T(62, 152, eng(v.V, 'V'), 'start')}</>;
      } else {
        const xs = n === 2 ? [200, 400] : n === 3 ? [150, 290, 430] : [140, 240, 340, 440];
        const last = xs[xs.length - 1];
        schematic = <><Wire d={`M50,119 V40 H${last}`} phase={phase} active={on} /><Wire d={`M${last},180 H50 V131`} phase={phase} active={on} />
          {xs.map((x, k) => <g key={k}><Wire d={`M${x},40 V180`} phase={phase} share={net.elements[k].I / net.Itotal} active={on} /><Resistor x={x} y={110} rot={90} />{T(x + 12, 160, `R${k + 1}`, 'start')}{T(x + 12, 174, eng(Rs[k], 'Ω'), 'start')}</g>)}
          <Battery x={50} y={125} />{T(62, 152, eng(v.V, 'V'), 'start')}</>;
      }
      const bars = mode === 'series'
        ? [{ label: 'Supply', v: v.V, cls: 'c3' }, ...net.elements.map((e, k) => ({ label: `R${k + 1}`, v: e.V, cls: 'c1' }))]
        : net.elements.map((e, k) => ({ label: `R${k + 1}`, v: e.I, cls: 'c2' }));
      const big = net.elements.reduce((a, e, k) => (e.P > net.elements[a].P ? k : a), 0);
      return {
        flow: on ? speedOf(net.Itotal) : 0, rows,
        summary: mode === 'series'
          ? `Series: one current, ${eng(net.Itotal, 'A')}, flows through all ${n}. The voltages add up to the supply, and R${big + 1} dissipates the most power (${eng(net.elements[big].P, 'W')}).`
          : `Parallel: every resistor sees ${eng(v.V, 'V')}. The branch currents add up to ${eng(net.Itotal, 'A')}, and the total resistance, ${eng(net.Rtotal, 'Ω')}, is below the smallest branch. R${big + 1} dissipates the most power.`,
        schematic, plot: <Bars items={bars} unit={mode === 'series' ? 'V' : 'A'} />,
      };
    }
    if (c.id === 'divider') {
      const loaded = m.load === 'on';
      const d = voltageDivider(v.Vin, v.R1, v.R2, loaded ? v.RL : Infinity);
      const trunk = 'M50,119 V40 H300 V180 H50 V131';
      return {
        flow: on ? speedOf(d.Iin) : 0,
        rows: [['Output voltage', eng(d.Vout, 'V')], ['Unloaded output', eng(d.VoutUnloaded, 'V')], ['Output sag', `${Number(d.sagPercent.toPrecision(3))} %`], ['Source current', eng(d.Iin, 'A')], ['Load current', eng(d.Iload, 'A')], ['Power in R1 / R2', `${eng(d.P1, 'W')} / ${eng(d.P2, 'W')}`]],
        summary: loaded ? `With a ${eng(v.RL, 'Ω')} load the output is ${eng(d.Vout, 'V')} instead of ${eng(d.VoutUnloaded, 'V')}, a sag of ${Number(d.sagPercent.toPrecision(3))} %. The load sits in parallel with R2, leaving ${eng(d.Rbottom, 'Ω')}.` : `Unloaded, the output is ${eng(d.Vout, 'V')}, set only by the ratio R2 / (R1 + R2).`,
        schematic: <><Wire d={trunk} phase={phase} active={on} />{loaded && <Wire d="M300,40 H420 V180 H300" phase={phase} share={d.Iload / d.Iin} active={on} />}<Battery x={50} y={125} /><Resistor x={175} y={40} />{T(175, 66, `R1 ${eng(v.R1, 'Ω')}`)}
          <Resistor x={300} y={110} rot={90} />{T(312, 112, `R2 ${eng(v.R2, 'Ω')}`, 'start')}{loaded && <Resistor x={420} y={110} rot={90} />}{loaded && T(432, 112, `RL ${eng(v.RL, 'Ω')}`, 'start')}
          <circle cx={300} cy={40} r={5} className="sim-dot" />{T(300, 28, `Vout ${eng(d.Vout, 'V')}`)}{T(62, 152, eng(v.Vin, 'V'), 'start')}</>,
        plot: <Bars items={[{ label: 'Vin', v: v.Vin, cls: 'c3' }, { label: 'Vout unloaded', v: d.VoutUnloaded, cls: 'c1' }, ...(loaded ? [{ label: 'Vout loaded', v: d.Vout, cls: 'c2' }] : [])]} unit="V" />,
      };
    }
    if (c.id === 'rc') {
      const charging = m.dir === 'charge';
      const tau = v.R * v.C, tEnd = 5 * tau, t = frac * tEnd;
      const s = rcAt(v.V, v.R, v.C, t, charging);
      const Imax = v.V / v.R;
      const vcF = (x: number) => rcAt(v.V, v.R, v.C, x, charging).vc / v.V;
      const iF = (x: number) => rcAt(v.V, v.R, v.C, x, charging).i / Imax;
      const full = [sample(vcF, tEnd), sample(iF, tEnd)];
      const d = 'M50,142 V40 H470 V180 H50 Z';
      return {
        tEnd, flow: Math.sign(s.i) * (Math.abs(s.i) > 1e-12 ? speedOf(s.i) : 0), rows: [['Simulated time', eng(t, 's')], ['Time constant τ = RC', eng(tau, 's')], ['Capacitor voltage', eng(s.vc, 'V')], ['Charge level', `${Number((s.fraction * 100).toPrecision(3))} %`], ['Loop current', eng(s.i, 'A')], ['Resistor voltage', eng(s.vr, 'V')], ['Energy stored', eng(s.energy, 'J')]],
        summary: charging ? `After ${(t / tau).toFixed(2)} τ the capacitor is at ${Number((s.fraction * 100).toPrecision(3))} % of the supply. One τ gives 63.2 %, five τ more than 99 %.` : `After ${(t / tau).toFixed(2)} τ the capacitor has fallen to ${Number((s.fraction * 100).toPrecision(3))} % of its starting voltage. The current is negative because it now flows out of the capacitor.`,
        schematic: <><Wire d={d} phase={phase} active={true} />{charging ? <Battery x={50} y={125} /> : T(50, 134, 'source removed', 'middle')}<Resistor x={260} y={40} />{T(260, 66, eng(v.R, 'Ω'))}<Capacitor x={470} y={110} rot={90} />{T(452, 112, eng(v.C, 'F'), 'end')}{T(452, 128, `vC ${eng(s.vc, 'V')}`, 'end')}{charging && T(62, 152, eng(v.V, 'V'), 'start')}</>,
        plot: <Plot series={[{ pts: full[0], cls: 'c1', label: '', faint: true }, { pts: full[1], cls: 'c2', label: '', faint: true }, { pts: upTo(full[0], t), cls: 'c1', label: 'Capacitor voltage ÷ V' }, { pts: upTo(full[1], t), cls: 'c2', label: `Current ÷ ${eng(Imax, 'A')}` }]}
          xMax={tEnd} xUnit="s" yMin={charging ? 0 : -1} yMax={1} cursor={t} marks={[{ x: tau, label: 'τ' }]} xLabel="Time" yLabel="Fraction" />,
      };
    }
    if (c.id === 'rl') {
      const rising = m.dir === 'rise';
      const tau = v.L / v.R, tEnd = 5 * tau, t = frac * tEnd;
      const s = rlAt(v.V, v.R, v.L, t, rising);
      const Imax = v.V / v.R;
      const iF = (x: number) => rlAt(v.V, v.R, v.L, x, rising).i / Imax;
      const vF = (x: number) => rlAt(v.V, v.R, v.L, x, rising).vl / v.V;
      const full = [sample(iF, tEnd), sample(vF, tEnd)];
      const d = 'M50,142 V40 H470 V180 H50 Z';
      return {
        tEnd, flow: s.i > 1e-12 ? speedOf(s.i) : 0,
        rows: [['Simulated time', eng(t, 's')], ['Time constant τ = L/R', eng(tau, 's')], ['Current', eng(s.i, 'A')], ['Final current V/R', eng(Imax, 'A')], ['Inductor voltage', eng(s.vl, 'V')], ['Resistor voltage', eng(s.vr, 'V')], ['Energy stored', eng(s.energy, 'J')]],
        summary: rising ? `After ${(t / tau).toFixed(2)} τ the current has reached ${Number((s.fraction * 100).toPrecision(3))} % of V/R. The inductor opposes the change: its voltage began at the full supply and is now ${eng(s.vl, 'V')}.` : `The stored energy keeps the current flowing through the freewheel path. After ${(t / tau).toFixed(2)} τ it has fallen to ${Number((s.fraction * 100).toPrecision(3))} % of its starting value, and the inductor voltage is reversed.`,
        schematic: <><Wire d={d} phase={phase} active={on || frac > 0} />{rising ? <Battery x={50} y={125} /> : T(50, 134, 'source removed')}<Resistor x={260} y={40} />{T(260, 66, eng(v.R, 'Ω'))}<Inductor x={470} y={110} rot={90} />{T(452, 112, eng(v.L, 'H'), 'end')}{T(452, 128, `i ${eng(s.i, 'A')}`, 'end')}{rising && T(62, 152, eng(v.V, 'V'), 'start')}</>,
        plot: <Plot series={[{ pts: full[0], cls: 'c1', label: '', faint: true }, { pts: full[1], cls: 'c2', label: '', faint: true }, { pts: upTo(full[0], t), cls: 'c1', label: `Current ÷ ${eng(Imax, 'A')}` }, { pts: upTo(full[1], t), cls: 'c2', label: 'Inductor voltage ÷ V' }]}
          xMax={tEnd} xUnit="s" yMin={rising ? 0 : -1} yMax={1} cursor={t} marks={[{ x: tau, label: 'τ' }]} xLabel="Time" yLabel="Fraction" />,
      };
    }
    // AC series RLC
    const a = rlcSeries(v.V, v.f, v.R, v.L, v.C);
    const tEnd = 3 / v.f, t = frac * tEnd;
    const w = rlcWave(a, t);
    const vpk = Math.SQRT2 * a.Vrms, ipk = Math.SQRT2 * a.Irms;
    const vF = (x: number) => rlcWave(a, x).v / vpk;
    const iF = (x: number) => rlcWave(a, x).i / ipk;
    const full = [sample(vF, tEnd, 240), sample(iF, tEnd, 240)];
    const d = 'M50,90 V40 H470 V180 H50 V130';
    const kind = a.kind === 'resistive' ? 'purely resistive: current in phase with voltage' : a.kind === 'inductive' ? `inductive: current lags the voltage by ${Number(a.phaseDeg.toPrecision(3))}°` : `capacitive: current leads the voltage by ${Number(Math.abs(a.phaseDeg).toPrecision(3))}°`;
    return {
      tEnd, flow: (w.i / ipk) * 1.1,
      rows: [['Impedance Z', eng(a.Z, 'Ω')], ['Current (RMS)', eng(a.Irms, 'A')], ['Phase angle', `${Number(a.phaseDeg.toPrecision(3))}°`], ['Power factor', Number(a.pf.toPrecision(4)).toString()], ['Real power P', eng(a.P, 'W')], ['Reactive power Q', eng(a.Q, 'var')], ['Apparent power S', eng(a.S, 'VA')],
        ['XL / XC', `${eng(a.XL, 'Ω')} / ${eng(a.XC, 'Ω')}`], ['Resonant frequency', eng(a.f0, 'Hz')], ['Quality factor Q', Number(a.qualityFactor.toPrecision(3)).toString()], ['v now / i now', `${eng(w.v, 'V')} / ${eng(w.i, 'A')}`]],
      summary: `At ${eng(v.f, 'Hz')} the circuit is ${kind}. Resonance is at ${eng(a.f0, 'Hz')}. The voltages across L and C are ${eng(a.VL, 'V')} and ${eng(a.VC, 'V')} (supply ${eng(v.V, 'V')}): at or near resonance they can exceed the supply, because they are 180° apart and cancel.`,
      schematic: <><Wire d={d} phase={phase} active={true} /><AcSource x={50} y={110} />{T(62, 152, `${eng(v.V, 'V')} rms`, 'start')}<Resistor x={140} y={40} />{T(140, 66, eng(v.R, 'Ω'))}<Inductor x={260} y={40} />{T(260, 66, eng(v.L, 'H'))}<Capacitor x={380} y={40} />{T(380, 72, eng(v.C, 'F'))}</>,
      plot: <Plot series={[{ pts: full[0], cls: 'c1', label: '', faint: true }, { pts: full[1], cls: 'c2', label: '', faint: true }, { pts: upTo(full[0], t), cls: 'c1', label: `Voltage (peak ${eng(vpk, 'V')})` }, { pts: upTo(full[1], t), cls: 'c2', label: `Current (peak ${eng(ipk, 'A')})` }]}
        xMax={tEnd} xUnit="s" yMin={-1} yMax={1} cursor={t} xLabel="Time (three cycles)" yLabel="Per unit of peak" />,
      extra: <div className="sim-extra"><p className="sim-cap">Resistance, reactances and impedance</p><Bars items={[{ label: 'R', v: a.R, cls: 'c3' }, { label: 'XL', v: a.XL, cls: 'c1' }, { label: 'XC', v: a.XC, cls: 'c2' }, { label: 'Z', v: a.Z, cls: 'c3' }]} unit="Ω" /></div>,
    };
  } catch (e) {
    return { rows: [], schematic: null, plot: null, flow: 0, summary: '', error: e instanceof SimError ? e.message : 'Check the inputs.' };
  }
}
