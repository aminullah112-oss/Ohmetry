import { useState } from 'react';
import { conduitFill } from '../lib/calc/conduit-fill';
import { SIZES, CONDUITS, type ConduitType } from '../data/nec-tables';
import { Form, Out, Sel, run } from './ui';

interface Row { size: string; count: string }

export default function ConduitFillCalc() {
  const [type, setType] = useState<ConduitType>('EMT');
  const [rows, setRows] = useState<Row[]>([{ size: '12', count: '6' }, { size: '10', count: '1' }]);
  const set = (i: number, patch: Partial<Row>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const { out, error } = run(() => conduitFill({ conductors: rows.map((r) => ({ size: r.size, count: Number(r.count) })) }, type));
  return (
    <Form label="Conduit fill calculator (THHN/THWN)">
      <div className="grid" style={{ marginBottom: 14 }}>
        <Sel label="Raceway type" value={type} set={setType} options={(Object.keys(CONDUITS) as ConduitType[]).map((k) => [k, CONDUITS[k].label] as [ConduitType, string])} />
      </div>
      <div className="rows">
        {rows.map((r, i) => (
          <div className="row" key={i}>
            <label>Conductor size
              <select value={r.size} onChange={(e) => set(i, { size: e.target.value })}>
                {SIZES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </label>
            <label>Quantity
              <input inputMode="numeric" value={r.count} onChange={(e) => set(i, { count: e.target.value })} />
            </label>
            <button type="button" className="print" onClick={() => setRows(rows.filter((_, j) => j !== i))} disabled={rows.length === 1} aria-label={`Remove row ${i + 1}`}>Remove</button>
          </div>
        ))}
      </div>
      <button type="button" className="print" onClick={() => setRows([...rows, { size: '12', count: '1' }])}>Add another size</button>
      <p className="hint">Include equipment grounding and bonding conductors.</p>
      <Out error={error} items={out && [
        [`Smallest ${CONDUITS[type].short}`, out.trade],
        ['Conductors', String(out.totalConductors)],
        ['Total conductor area', `${out.totalArea.toFixed(4)} in²`],
        ['Allowed fill', `${out.allowedPercent} % (${out.allowedArea.toFixed(3)} in²)`],
        ['Actual fill', `${out.fillPercent.toFixed(1)} %`],
      ]} />
      {out && (
        <details className="more"><summary>Fill in every trade size</summary>
          <table><thead><tr><th>Trade size</th><th>Fill</th><th>Within limit</th></tr></thead>
            <tbody>{out.options.map((o) => <tr key={o.trade}><td>{o.trade}</td><td>{o.fillPercent.toFixed(1)} %</td><td>{o.ok ? 'Yes' : 'No'}</td></tr>)}</tbody></table>
        </details>
      )}
    </Form>
  );
}
