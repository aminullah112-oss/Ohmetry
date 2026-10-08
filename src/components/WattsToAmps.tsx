import { useState } from 'react';
import { wattsToAmps, type Supply } from '../lib/calc/watts-to-amps';
import { Form, Num, Out, Sel, run } from './ui';

export default function WattsToAmps() {
  const [watts, setWatts] = useState('1500');
  const [volts, setVolts] = useState('120');
  const [pf, setPf] = useState('1');
  const [supply, setSupply] = useState<Supply>('single');
  const { out, error } = run(() => wattsToAmps(Number(watts), Number(volts), Number(pf), supply));

  return (
    <Form label="Watts to amps calculator">
      <div className="grid">
        <Num label="Power (W)" value={watts} set={setWatts} />
        <Num label={supply === 'three' ? 'Voltage (V, line-to-line)' : 'Voltage (V)'} value={volts} set={setVolts} />
        <Sel label="Supply" value={supply} set={setSupply} options={[['dc', 'DC'], ['single', 'AC single-phase'], ['three', 'AC three-phase']]} />
        {supply !== 'dc' && <Num label="Power factor" value={pf} set={setPf} hint="1 for heaters and lamps" />}
      </div>
      <Out items={out === null ? null : [['Current', `${out.toFixed(2)} A`]]} error={error} />
    </Form>
  );
}
