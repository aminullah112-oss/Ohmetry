import { useState } from 'react';
import { hpToKw, inputKw, kwToHp, type HpKind } from '../lib/calc/kw-hp';
import { Form, Num, Out, Sel, run } from './ui';

type Mode = 'kw' | 'hp';

export default function KwToHp() {
  const [mode, setMode] = useState<Mode>('kw');
  const [value, setValue] = useState('7.5');
  const [kind, setKind] = useState<HpKind>('mechanical');
  const [eff, setEff] = useState('90');
  const { out, error } = run(() => {
    const kw = mode === 'kw' ? Number(value) : hpToKw(Number(value), kind);
    const hp = mode === 'kw' ? kwToHp(Number(value), kind) : Number(value);
    return { kw, hp, input: inputKw(kw, Number(eff) / 100) };
  });

  return (
    <Form label="kW to horsepower calculator">
      <div className="grid">
        <Sel label="Convert" value={mode} set={setMode} options={[['kw', 'kW to hp'], ['hp', 'hp to kW']]} />
        <Num label={mode === 'kw' ? 'Power (kW)' : 'Power (hp)'} value={value} set={setValue} />
        <Sel label="Horsepower type" value={kind} set={setKind} options={[['mechanical', 'Mechanical (745.7 W)'], ['metric', 'Metric PS / CV (735.5 W)']]} />
        <Num label="Motor efficiency (%)" value={eff} set={setEff} hint="Only for the input-power line" />
      </div>
      <Out
        items={out === null ? null : [
          ['Kilowatts', `${out.kw.toFixed(3)} kW`],
          ['Horsepower', `${out.hp.toFixed(3)} hp`],
          ['Electrical input at that efficiency', `${out.input.toFixed(3)} kW`],
        ]}
        error={error}
      />
    </Form>
  );
}
