import { useState } from 'react';
import { motorCircuit, motorHpOptions, motorVoltOptions, type MotorPhase, type DeviceKind } from '../lib/calc/motor-circuit';
import { MOTOR_DEVICE_MAX } from '../data/nec-tables';
import { Form, Num, Out, Sel, run } from './ui';

const hpLabel = (h: number) => (h === 1 / 6 ? '1/6' : h === 1 / 3 ? '1/3' : h === 0.25 ? '1/4' : h === 0.5 ? '1/2' : h === 0.75 ? '3/4' : String(h));

export default function MotorCircuitCalc() {
  const [phase, setPhase] = useState<MotorPhase>('three');
  const [volts, setVolts] = useState('460');
  const [hp, setHp] = useState('10');
  const [device, setDevice] = useState<DeviceKind>('inverse');
  const [plate, setPlate] = useState('');
  const [robust, setRobust] = useState<'yes' | 'no'>('yes');
  const voltOpts = motorVoltOptions(phase);
  const v = voltOpts.includes(volts) ? volts : voltOpts[voltOpts.length - 1];
  const hpOpts = motorHpOptions(phase);
  const h = hpOpts.some((x) => String(x) === hp) ? hp : String(hpOpts[0]);
  const { out, error } = run(() => motorCircuit({ hp: Number(h), volts: Number(v), phase, device, nameplateA: plate.trim() === '' ? undefined : Number(plate), robustMotor: robust === 'yes' }));
  return (
    <Form label="Motor circuit calculator (NEC Article 430)">
      <div className="grid">
        <Sel label="Phase" value={phase} set={setPhase} options={[['three', 'Three-phase'], ['single', 'Single-phase']]} />
        <Sel label="Voltage (V)" value={v} set={setVolts} options={voltOpts.map((x) => [x, x] as [string, string])} />
        <Sel label="Horsepower" value={h} set={setHp} options={hpOpts.map((x) => [String(x), hpLabel(x)] as [string, string])} />
        <Sel label="Short-circuit device" value={device} set={setDevice} options={(Object.keys(MOTOR_DEVICE_MAX) as DeviceKind[]).map((k) => [k, MOTOR_DEVICE_MAX[k].label] as [DeviceKind, string])} />
        <Num label="Nameplate current, optional (A)" value={plate} set={setPlate} hint="For the overload setting" />
        <Sel label="Service factor 1.15+ or temperature rise 40 °C or less" value={robust} set={setRobust} options={[['yes', 'Yes (125 % overload)'], ['no', 'No (115 % overload)']]} />
      </div>
      <Out error={error} items={out && [
        ['Table full-load current', `${out.flc} A`],
        ['Conductor ampacity at least', `${out.minConductorA.toFixed(1)} A`],
        [`Device maximum (${out.devicePercent} %)`, `${out.deviceCalcA.toFixed(1)} A`],
        ['Next standard size', `${out.deviceMaxA} A`],
        ...(out.overloadA !== undefined ? [['Overload setting', `${out.overloadA.toFixed(2)} A`] as [string, string], ['Overload maximum', `${out.overloadMaxA!.toFixed(2)} A`] as [string, string]] : []),
      ]} />
    </Form>
  );
}
