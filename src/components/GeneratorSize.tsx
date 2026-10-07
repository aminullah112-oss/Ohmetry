import { useState } from 'react';
import { generatorSize, type GenLoad } from '../lib/calc/generator-size';
import type { Phase } from '../lib/calc/kva-to-amps';
import { Form, Num, Out, Sel, run } from './ui';

interface Row { name: string; watts: string; qty: string; mult: string }
const START: Row[] = [
  { name: 'Lighting and outlets', watts: '2000', qty: '1', mult: '1' },
  { name: 'Refrigerator', watts: '150', qty: '2', mult: '3' },
  { name: 'Well pump', watts: '1000', qty: '1', mult: '3' },
];

export default function GeneratorSizeCalc() {
  const [rows, setRows] = useState<Row[]>(START);
  const [margin, setMargin] = useState('0.25');
  const [cap, setCap] = useState('1');
  const [derate, setDerate] = useState('1');
  const [pf, setPf] = useState('0.8');
  const [volts, setVolts] = useState('240');
  const [phase, setPhase] = useState<Phase>('single');
  const set = (i: number, patch: Partial<Row>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const { out, error } = run(() => generatorSize({
    loads: rows.map((r): GenLoad => ({ name: r.name, watts: Number(r.watts), qty: Number(r.qty), startMultiplier: Number(r.mult) })),
    margin: Number(margin), startingCapability: Number(cap), derate: Number(derate), powerFactor: Number(pf), volts: Number(volts), phase,
  }));
  return (
    <Form label="Generator size calculator">
      <div className="rows">
        {rows.map((r, i) => (
          <div className="row load" key={i}>
            <label>Load<input value={r.name} onChange={(e) => set(i, { name: e.target.value })} /></label>
            <label>Running watts (each)<input inputMode="decimal" value={r.watts} onChange={(e) => set(i, { watts: e.target.value })} /></label>
            <label>Qty<input inputMode="numeric" value={r.qty} onChange={(e) => set(i, { qty: e.target.value })} /></label>
            <label>Start multiplier<input inputMode="decimal" value={r.mult} onChange={(e) => set(i, { mult: e.target.value })} /></label>
            <button type="button" className="print" onClick={() => setRows(rows.filter((_, j) => j !== i))} disabled={rows.length === 1} aria-label={`Remove ${r.name || 'row'}`}>Remove</button>
          </div>
        ))}
      </div>
      <button type="button" className="print" onClick={() => setRows([...rows, { name: 'New load', watts: '500', qty: '1', mult: '1' }])}>Add a load</button>
      <div className="grid" style={{ marginTop: 18 }}>
        <Num label="Margin on running load" value={margin} set={setMargin} hint="0.25 keeps the set at 80 % load" />
        <Num label="Starting capability" value={cap} set={setCap} hint="1 = rated kW must cover the starting peak" />
        <Num label="Site derating factor" value={derate} set={setDerate} hint="Altitude, heat: take it from the data sheet" />
        <Num label="Generator power factor" value={pf} set={setPf} hint="0.8 is typical for a standby set" />
        <Num label="Voltage (V)" value={volts} set={setVolts} />
        <Sel label="Phase" value={phase} set={setPhase} options={[['single', 'Single-phase'], ['three', 'Three-phase']]} />
      </div>
      <Out error={error} items={out && [
        ['Required rating', `${out.requiredKw.toFixed(1)} kW`],
        ['Apparent power', `${out.requiredKva.toFixed(1)} kVA`],
        ['Rated current', `${out.ratedAmps.toFixed(1)} A`],
        ['Running load', `${(out.runningW / 1000).toFixed(2)} kW`],
        ['Starting peak', `${(out.peakW / 1000).toFixed(2)} kW`],
        ['Sized by', out.governs],
      ]} />
    </Form>
  );
}
