import { useState } from 'react';
import { voltageDrop } from '../lib/calc/voltage-drop';
import { COMMON_AWG, type Material } from '../lib/calc/conductor-drop';
import { awgLabel, awgToMm2 } from '../lib/calc/awg-to-mm2';
import { Form, Num, Out, Sel, run } from './ui';

export default function VoltageDrop() {
  const [circuit, setCircuit] = useState<'two-wire' | 'three'>('two-wire');
  const [amps, setAmps] = useState('20');
  const [units, setUnits] = useState<'metric' | 'us'>('metric');
  const [len, setLen] = useState('30');
  const [lenFt, setLenFt] = useState('100');
  const [awg, setAwg] = useState('12');
  const [area, setArea] = useState('4');
  const [volts, setVolts] = useState('230');
  const [mat, setMat] = useState<Material>('copper');
  const [temp, setTemp] = useState('70');
  const [x, setX] = useState('');
  const [pf, setPf] = useState('0.9');
  const { out, error } = run(() => voltageDrop({
    amps: Number(amps), oneWayMetres: units === 'us' ? Number(lenFt) * 0.3048 : Number(len), areaMm2: units === 'us' ? awgToMm2(Number(awg)) : Number(area), volts: Number(volts), material: mat, tempC: Number(temp), circuit,
    xOhmPerKm: x.trim() === '' ? undefined : Number(x), powerFactor: Number(pf),
  }));
  return (
    <Form label="Voltage drop calculator">
      <div className="grid">
        <Sel label="Circuit" value={circuit} set={setCircuit} options={[['two-wire', 'Single-phase or DC (two wires)'], ['three', 'Three-phase']]} />
        <Num label="Load current (A)" value={amps} set={setAmps} />
        <Sel label="Units" value={units} set={setUnits} options={[['metric', 'Metric (m, mm²)'], ['us', 'US (ft, AWG)']]} />
        {units === 'us'
          ? <Num label="One-way cable length (ft)" value={lenFt} set={setLenFt} />
          : <Num label="One-way cable length (m)" value={len} set={setLen} />}
        {units === 'us'
          ? <Sel label="Conductor size (AWG)" value={awg} set={setAwg} options={COMMON_AWG.map((n) => [String(n), `${awgLabel(n)} AWG`] as [string, string])} />
          : <Num label="Conductor cross-section (mm²)" value={area} set={setArea} hint="Use the AWG to mm² converter if you only have AWG" />}
        <Num label="Supply voltage (V)" value={volts} set={setVolts} hint="Line-to-line for three-phase" />
        <Sel label="Conductor" value={mat} set={setMat} options={[['copper', 'Copper'], ['aluminium', 'Aluminium']]} />
        <Num label="Conductor temperature (°C)" value={temp} set={setTemp} hint="70 for PVC at full load, 90 for XLPE" />
        <Num label="Cable reactance (Ω/km), optional" value={x} set={setX} hint="From the data sheet. Leave empty for resistance only" />
        {x.trim() !== '' && <Num label="Load power factor" value={pf} set={setPf} />}
      </div>
      <Out error={error} items={out && [
        ['Voltage drop', `${out.dropV.toFixed(2)} V`],
        ['Drop', `${out.dropPercent.toFixed(2)} %`],
        ['Voltage at the load', `${out.loadVolts.toFixed(1)} V`],
        ['Conductor resistance', `${out.rOhmPerKm.toFixed(3)} Ω/km`],
      ]} />
    </Form>
  );
}
