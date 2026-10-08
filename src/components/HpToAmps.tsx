import { useState } from 'react';
import { hpToAmps } from '../lib/calc/hp-to-amps';
import { motorHpOptions, motorVoltOptions, type MotorPhase } from '../lib/calc/motor-circuit';
import { Form, Num, Out, Sel, run } from './ui';

const hpLabel = (h: number) => (h === 1 / 6 ? '1/6' : h === 1 / 3 ? '1/3' : h === 0.25 ? '1/4' : h === 0.5 ? '1/2' : h === 0.75 ? '3/4' : String(h));

export default function HpToAmps() {
  const [phase, setPhase] = useState<MotorPhase>('three');
  const [volts, setVolts] = useState('460');
  const [hp, setHp] = useState('10');
  const [eff, setEff] = useState('90');
  const [pf, setPf] = useState('0.85');
  const voltOpts = motorVoltOptions(phase);
  const v = voltOpts.includes(volts) ? volts : voltOpts[voltOpts.length - 1];
  const hpOpts = motorHpOptions(phase);
  const h = hpOpts.some((x) => String(x) === hp) ? hp : String(hpOpts[0]);
  const { out, error } = run(() => hpToAmps(Number(h), Number(v), phase, Number(eff) / 100, Number(pf)));
  return (
    <Form label="Horsepower to amps calculator">
      <div className="grid">
        <Sel label="Phase" value={phase} set={setPhase} options={[['three', 'Three-phase'], ['single', 'Single-phase']]} />
        <Sel label="Voltage (V)" value={v} set={setVolts} options={voltOpts.map((x) => [x, x] as [string, string])} />
        <Sel label="Horsepower" value={h} set={setHp} options={hpOpts.map((x) => [String(x), hpLabel(x)] as [string, string])} />
        <Num label="Efficiency (%)" value={eff} set={setEff} hint="For the running-current estimate" />
        <Num label="Power factor" value={pf} set={setPf} hint="For the running-current estimate" />
      </div>
      <Out error={error} items={out && [
        ['NEC table full-load current', `${out.tableA} A`],
        ['Estimated running current', `${out.estimatedA.toFixed(1)} A`],
      ]} />
    </Form>
  );
}
