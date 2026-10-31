import { useState } from 'react';
import { tempCorrection, AIR_REFERENCE_C, GROUND_REFERENCE_C } from '../lib/calc/derating-temp';
import { requiredTabulated } from '../lib/calc/cable-derating';
import { Form, Num, Out, Sel, run } from './ui';

type Medium = 'air' | 'ground';

export default function DeratingTemp() {
  const [amb, setAmb] = useState('40');
  const [medium, setMedium] = useState<Medium>('air');
  const [max, setMax] = useState('70');
  const [other, setOther] = useState('1');
  const [dev, setDev] = useState('63');
  const t = run(() => tempCorrection(Number(max), medium === 'air' ? AIR_REFERENCE_C : GROUND_REFERENCE_C, Number(amb)));
  const need = run(() => requiredTabulated(Number(dev), Number(dev), [t.out ?? NaN, Number(other)]));
  return (
    <Form label="Cable derating factor calculator">
      <div className="grid">
        <Num label="Ambient temperature (°C)" value={amb} set={setAmb} />
        <Sel label="Cable in" value={medium} set={setMedium} options={[['air', 'Air (reference 30 °C)'], ['ground', 'Ground (reference 20 °C)']]} />
        <Sel label="Conductor maximum temperature" value={max} set={setMax} options={[['60', '60 °C'], ['70', '70 °C (PVC)'], ['75', '75 °C'], ['90', '90 °C (XLPE or EPR)']]} />
        <Num label="Other factors, multiplied (optional)" value={other} set={setOther} hint="Grouping and others, from the standard's tables. 1 if none" />
        <Num label="Protective device rating (A)" value={dev} set={setDev} />
      </div>
      <Out error={t.error || need.error} items={t.out !== null && need.out !== null ? [
        ['Temperature factor', t.out.toFixed(2)],
        ['Combined factor', need.out.k.toFixed(2)],
        ['Tabulated rating needed', `${need.out.requiredTabulatedA.toFixed(1)} A`],
      ] : null} />
    </Form>
  );
}
