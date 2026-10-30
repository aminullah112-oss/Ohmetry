import { useState } from 'react';
import { earthConductor, type EarthMaterial, type Insulation, type Installation } from '../lib/calc/earth-conductor';
import { Form, Num, Out, Sel, run } from './ui';

export default function EarthConductor() {
  const [ka, setKa] = useState('10');
  const [t, setT] = useState('0.5');
  const [mat, setMat] = useState<EarthMaterial>('copper');
  const [ins, setIns] = useState<Insulation>('xlpe');
  const [inst, setInst] = useState<Installation>('separate');
  const { out, error } = run(() => earthConductor({ faultA: Number(ka) * 1000, timeS: Number(t), material: mat, insulation: ins, installation: inst }));
  return (
    <Form label="Earth conductor size calculator">
      <div className="grid">
        <Num label="Earth fault current (kA)" value={ka} set={setKa} hint="The highest fault the conductor must carry" />
        <Num label="Clearing time (s)" value={t} set={setT} hint="Device operating time at that current, up to 5 s" />
        <Sel label="Conductor material" value={mat} set={setMat} options={[['copper', 'Copper'], ['aluminium', 'Aluminium'], ['steel', 'Steel']]} />
        <Sel label="Insulation" value={ins} set={setIns} options={[['pvc', 'PVC'], ['xlpe', 'XLPE or EPR']]} />
        <Sel label="Installation" value={inst} set={setInst} options={[['separate', 'Separate conductor'], ['core', 'Core of a multicore cable']]} />
      </div>
      <Out error={error} items={out && [
        ['Minimum cross-section', `${out.sMinMm2.toFixed(1)} mm²`],
        ['Next standard size', out.sStandardMm2 === null ? 'Above 400 mm²: use parallel conductors' : `${out.sStandardMm2} mm²`],
        ['k used', `${out.k.toFixed(1)} A·√s/mm² (${out.initialC} to ${out.finalC} °C)`],
        ['I²t', `${out.i2t.toExponential(2)} A²s`],
      ]} />
    </Form>
  );
}
