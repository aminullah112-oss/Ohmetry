import { useState } from 'react';
import { kvaToKw, kwToKva } from '../lib/calc/kva-kw';
import { Form, Num, Out, Sel, run } from './ui';

type Mode = 'kva' | 'kw';

export default function KvaToKw() {
  const [mode, setMode] = useState<Mode>('kva');
  const [value, setValue] = useState('100');
  const [pf, setPf] = useState('0.8');
  const { out, error } = run(() => (mode === 'kva' ? kvaToKw(Number(value), Number(pf)) : kwToKva(Number(value), Number(pf))));

  return (
    <Form label="kVA to kW calculator">
      <div className="grid">
        <Sel label="Convert" value={mode} set={setMode} options={[['kva', 'kVA to kW'], ['kw', 'kW to kVA']]} />
        <Num label={mode === 'kva' ? 'Apparent power (kVA)' : 'Real power (kW)'} value={value} set={setValue} />
        <Num label="Power factor" value={pf} set={setPf} hint="Between 0 and 1" />
      </div>
      <Out
        items={out === null ? null : [
          ['Real power', `${out.kw.toFixed(2)} kW`],
          ['Apparent power', `${out.kva.toFixed(2)} kVA`],
          ['Reactive power', `${out.kvar.toFixed(2)} kvar`],
        ]}
        error={error}
      />
    </Form>
  );
}
