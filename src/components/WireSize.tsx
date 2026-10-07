import { useState } from 'react';
import { wireSize } from '../lib/calc/wire-size';
import { AMBIENT_FACTORS, ADJUSTMENT_FACTORS } from '../data/nec-tables';
import { Form, Num, Out, Sel, run } from './ui';

export default function WireSizeCalc() {
  const [cont, setCont] = useState('40');
  const [non, setNon] = useState('0');
  const [mat, setMat] = useState<'copper' | 'aluminum'>('copper');
  const [term, setTerm] = useState<'60' | '75'>('75');
  const [ins, setIns] = useState<'75' | '90'>('90');
  const [amb, setAmb] = useState('1');
  const [adj, setAdj] = useState('0');
  const [useDrop, setUseDrop] = useState(false);
  const [feet, setFeet] = useState('100');
  const [volts, setVolts] = useState('240');
  const [pct, setPct] = useState('3');
  const [circuit, setCircuit] = useState<'two-wire' | 'three'>('two-wire');
  const { out, error } = run(() => wireSize({
    continuousA: Number(cont), noncontinuousA: Number(non), material: mat, terminalC: Number(term) as 60 | 75, insulationC: Number(ins) as 75 | 90,
    ambientIndex: Number(amb), adjustmentIndex: Number(adj),
    drop: useDrop ? { oneWayFeet: Number(feet), volts: Number(volts), percent: Number(pct), circuit } : undefined,
  }));
  return (
    <Form label="Wire size calculator (NEC)">
      <div className="grid">
        <Num label="Continuous load (A)" value={cont} set={setCont} hint="Runs 3 hours or more" />
        <Num label="Noncontinuous load (A)" value={non} set={setNon} />
        <Sel label="Conductor" value={mat} set={setMat} options={[['copper', 'Copper'], ['aluminum', 'Aluminum or copper-clad']]} />
        <Sel label="Termination rating" value={term} set={setTerm} options={[['75', '75 °C (usual above 100 A)'], ['60', '60 °C (usual up to 100 A)']]} />
        <Sel label="Insulation rating" value={ins} set={setIns} options={[['90', '90 °C (THHN, THWN-2, XHHW-2)'], ['75', '75 °C (THW, THWN)']]} />
        <Sel label="Ambient temperature" value={amb} set={setAmb} options={AMBIENT_FACTORS.map((a, i) => [String(i), a.range] as [string, string])} />
        <Sel label="Current-carrying conductors in the raceway" value={adj} set={setAdj} options={ADJUSTMENT_FACTORS.map((a, i) => [String(i), a.range] as [string, string])} />
        <label>Voltage-drop check
          <select value={useDrop ? 'yes' : 'no'} onChange={(e) => setUseDrop(e.target.value === 'yes')}><option value="no">Off</option><option value="yes">On</option></select>
        </label>
        {useDrop && <>
          <Num label="One-way length (ft)" value={feet} set={setFeet} />
          <Num label="Supply voltage (V)" value={volts} set={setVolts} />
          <Num label="Allowed drop (%)" value={pct} set={setPct} hint="3 % is a common branch-circuit target" />
          <Sel label="Circuit" value={circuit} set={setCircuit} options={[['two-wire', 'Single-phase or DC'], ['three', 'Three-phase']]} />
        </>}
      </div>
      <Out error={error} items={out && [
        ['Conductor size', out.size.label],
        ['Governed by', out.governs],
        ['125 % rule needs', `${out.requiredTerminalA.toFixed(1)} A`],
        ['Ampacity at termination', `${out.terminalAmpacity} A`],
        ['Derated ampacity', `${out.deratedAmpacity.toFixed(1)} A (k = ${out.k.toFixed(3)})`],
        ...(out.bySize.drop ? [['Voltage-drop size', out.bySize.drop.label] as [string, string]] : []),
      ]} />
    </Form>
  );
}
