import { useState } from 'react';
import { faultAtCableEnd } from '../lib/calc/fault-cable';
import type { Material } from '../lib/calc/conductor-drop';
import { Form, Num, Out, Sel, run } from './ui';

export default function CableFault() {
  const [un, setUn] = useState('400');
  const [src, setSrc] = useState('500');
  const [sxr, setSxr] = useState('10');
  const [kva, setKva] = useState('1000');
  const [z, setZ] = useState('5');
  const [txr, setTxr] = useState('5');
  const [len, setLen] = useState('30');
  const [area, setArea] = useState('25');
  const [mat, setMat] = useState<Material>('copper');
  const [x, setX] = useState('0.08');
  const [par, setPar] = useState('1');
  const [temp, setTemp] = useState('80');
  const { out, error } = run(() => faultAtCableEnd({
    un: Number(un), cMax: 1.05, cMin: 0.95, sourceMva: src.trim() === '' ? undefined : Number(src), sourceXr: Number(sxr),
    trKva: Number(kva), trZPercent: Number(z), trXr: Number(txr), lengthM: Number(len), areaMm2: Number(area), material: mat,
    xOhmPerKm: Number(x), parallel: Number(par), minTempC: Number(temp),
  }));
  return (
    <Form label="Fault current at the end of a cable">
      <div className="grid">
        <Num label="System voltage (V, line-to-line)" value={un} set={setUn} />
        <Num label="Source fault level (MVA), optional" value={src} set={setSrc} hint="Empty for an infinite bus" />
        <Num label="Source X/R" value={sxr} set={setSxr} hint="From the utility; 10 is typical" />
        <Num label="Transformer rating (kVA)" value={kva} set={setKva} />
        <Num label="Transformer impedance (%Z)" value={z} set={setZ} />
        <Num label="Transformer X/R" value={txr} set={setTxr} hint="From the test report" />
        <Num label="Cable length (m)" value={len} set={setLen} />
        <Num label="Cable cross-section (mm²)" value={area} set={setArea} />
        <Sel label="Conductor" value={mat} set={setMat} options={[['copper', 'Copper'], ['aluminium', 'Aluminium']]} />
        <Num label="Cable reactance (Ω/km)" value={x} set={setX} hint="From the data sheet" />
        <Num label="Cables in parallel" value={par} set={setPar} />
        <Num label="Conductor temperature, minimum fault (°C)" value={temp} set={setTemp} />
      </div>
      <Out error={error} items={out && [
        ['Fault at the transformer terminals', `${out.ikTransformerKa.toFixed(2)} kA`],
        ['Fault at the end of the cable', `${out.ikCableEndKa.toFixed(2)} kA`],
        ['Peak current at the cable end', `${out.ipKa.toFixed(2)} kA`],
        ['Minimum fault, hot cable', `${out.ikMinKa.toFixed(2)} kA`],
        ['Peak factor (kappa)', out.kappa.toFixed(3)],
      ]} />
    </Form>
  );
}
