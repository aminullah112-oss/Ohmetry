import { useState } from 'react';
import { neutralFromPhases, neutralFromThirdHarmonic } from '../lib/calc/neutral-current';
import { Form, Num, Out, run } from './ui';

export default function NeutralCurrent() {
  const [a, setA] = useState('100');
  const [b, setB] = useState('60');
  const [c, setC] = useState('30');
  const [ph, setPh] = useState('100');
  const [h3, setH3] = useState('40');
  const u = run(() => neutralFromPhases(Number(a), Number(b), Number(c)));
  const h = run(() => neutralFromThirdHarmonic(Number(ph), Number(h3)));
  return (
    <>
      <Form label="Neutral current from unbalanced phase currents">
        <div className="grid">
          <Num label="Phase L1 current (A)" value={a} set={setA} />
          <Num label="Phase L2 current (A)" value={b} set={setB} />
          <Num label="Phase L3 current (A)" value={c} set={setC} />
        </div>
        <Out error={u.error} items={u.out !== null ? [['Neutral current', `${u.out.toFixed(1)} A`]] : null} />
      </Form>
      <Form label="Neutral current from third-harmonic load">
        <div className="grid">
          <Num label="Phase current, true RMS (A)" value={ph} set={setPh} hint="Measured with a true-RMS meter" />
          <Num label="3rd harmonic (% of fundamental)" value={h3} set={setH3} hint="From a power-quality measurement" />
        </div>
        <Out error={h.error} items={h.out !== null ? [
          ['Neutral current', `${h.out.neutralA.toFixed(1)} A`],
          ['Neutral compared with phase current', `${(h.out.ratioToPhase * 100).toFixed(0)} %`],
          ['Fundamental per phase', `${h.out.fundamentalA.toFixed(1)} A`],
        ] : null} />
      </Form>
    </>
  );
}
