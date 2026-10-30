import { pageVerified } from './nec-tables';
const necTag = (slug: string) => (pageVerified(`/${slug}/`) ? 'NEC' : 'NEC · DRAFT');

/** One list drives the home page, the hub pages and the search box. Add new calculators here. */
export type HubId = 'electrical' | 'solar-ev' | 'protection';

export const hubs: Record<HubId, { name: string; href: string; icon: 'bolt' | 'sun' | 'relay'; blurb: string }> = {
  electrical: { name: 'Electrical', href: '/electrical/', icon: 'bolt', blurb: 'Power, current, breaker and cable basics for single-phase and three-phase circuits.' },
  'solar-ev': { name: 'Solar and EV', href: '/solar-ev/', icon: 'sun', blurb: 'Panels, batteries, inverters, DC cable and home EV charging, with every assumption editable.' },
  protection: { name: 'Protection and MV', href: '/protection/', icon: 'relay', blurb: 'Transformers, fault levels, CTs, relay curves, earthing and power factor, from a protection engineer.' },
};

export interface Calc { slug: string; name: string; blurb: string; hub: HubId; tag?: string }

export const calculators: Calc[] = [
  { slug: 'ohms-law-calculator', name: "Ohm's law", blurb: 'Solve voltage, current, resistance or power from any two.', hub: 'electrical' },
  { slug: 'amps-to-watts-calculator', name: 'Amps to watts', blurb: 'DC, single-phase and three-phase, with power factor.', hub: 'electrical' },
  { slug: 'kw-to-amps-calculator', name: 'kW to amps', blurb: 'Line current for a known load, single or three-phase.', hub: 'electrical' },
  { slug: 'kva-to-amps-calculator', name: 'kVA to amps', blurb: 'Full-load current of transformers and generators.', hub: 'electrical' },
  { slug: 'watts-to-amps-calculator', name: 'Watts to amps', blurb: 'Current for a known load on DC, single-phase or three-phase.', hub: 'electrical' },
  { slug: 'kva-to-kw-calculator', name: 'kVA to kW', blurb: 'Real, apparent and reactive power from the power factor.', hub: 'electrical' },
  { slug: 'kw-to-hp-calculator', name: 'kW to HP', blurb: 'Kilowatts and horsepower, mechanical or metric, with motor input power.', hub: 'electrical' },
  { slug: 'three-phase-power-calculator', name: 'Three-phase power', blurb: 'kVA, kW and kvar from voltage, current and power factor.', hub: 'electrical' },
  { slug: 'voltage-drop-calculator', name: 'Voltage drop', blurb: 'Volts and percent lost in a cable, with optional reactance.', hub: 'electrical' },
  { slug: 'breaker-size-calculator', name: 'Breaker size', blurb: 'Minimum breaker for continuous loads using the 125 % rule.', hub: 'electrical', tag: 'NEC' },
  { slug: 'awg-to-mm2-converter', name: 'AWG to mm²', blurb: 'Wire gauge to area and diameter, and back.', hub: 'electrical' },
  { slug: 'wire-size-calculator', name: 'Wire size', blurb: 'Conductor size from load, derating and voltage drop.', hub: 'electrical', tag: necTag('wire-size-calculator') },
  { slug: 'conduit-fill-calculator', name: 'Conduit fill', blurb: 'Smallest EMT for a mix of conductors.', hub: 'electrical', tag: necTag('conduit-fill-calculator') },
  { slug: 'motor-circuit-calculator', name: 'Motor circuit', blurb: 'Table full-load current, conductor, overload and device maximum.', hub: 'electrical', tag: necTag('motor-circuit-calculator') },
  { slug: 'hp-to-amps-calculator', name: 'HP to amps', blurb: 'NEC table full-load current for a motor, plus a running-current estimate.', hub: 'electrical', tag: necTag('hp-to-amps-calculator') },
  { slug: 'generator-size-calculator', name: 'Generator size', blurb: 'kW and kVA from a load list, with motor starting.', hub: 'electrical' },

  { slug: 'solar-panel-calculator', name: 'Solar panel size', blurb: 'How many panels for your daily energy use.', hub: 'solar-ev' },
  { slug: 'battery-bank-calculator', name: 'Battery bank', blurb: 'Capacity in Ah and kWh, or runtime of a battery.', hub: 'solar-ev' },
  { slug: 'off-grid-solar-calculator', name: 'Off-grid system', blurb: 'Panels, battery, inverter and controller together.', hub: 'solar-ev' },
  { slug: 'inverter-size-calculator', name: 'Inverter size', blurb: 'Continuous and surge rating, including motor starts.', hub: 'solar-ev' },
  { slug: 'solar-wire-size-calculator', name: 'DC cable size', blurb: 'Smallest cable for a voltage-drop limit.', hub: 'solar-ev' },
  { slug: 'ev-charger-wire-size-calculator', name: 'EV charger circuit', blurb: 'Breaker, ampacity and cable for a home charger.', hub: 'solar-ev', tag: 'NEC' },

  { slug: 'transformer-full-load-current-calculator', name: 'Transformer full-load current', blurb: 'Primary and secondary current from kVA and voltage.', hub: 'protection' },
  { slug: 'short-circuit-current-calculator', name: 'Short-circuit current', blurb: 'Fault level at a transformer secondary from %Z.', hub: 'protection' },
  { slug: 'cable-fault-current-calculator', name: 'Fault current at cable end', blurb: 'Source, transformer and cable impedance, with peak and minimum values.', hub: 'protection', tag: 'IEC' },
  { slug: 'cable-size-calculator', name: 'Cable size with derating', blurb: 'Tabulated rating needed after IEC derating factors.', hub: 'protection', tag: 'IEC' },
  { slug: 'ct-burden-calculator', name: 'CT burden', blurb: 'Connected burden and effective accuracy limit factor.', hub: 'protection', tag: 'IEC' },
  { slug: 'idmt-relay-calculator', name: 'IDMT relay time', blurb: 'Operating time on the four IEC 60255 curves.', hub: 'protection', tag: 'IEC' },
  { slug: 'earth-conductor-size-calculator', name: 'Earth conductor size', blurb: 'Minimum earth cable from fault current and clearing time, adiabatic method.', hub: 'protection', tag: 'IEC' },
  { slug: 'earth-resistance-calculator', name: 'Earth rod resistance', blurb: 'One driven rod from soil resistivity and length.', hub: 'protection' },
  { slug: 'power-factor-correction-calculator', name: 'Power factor correction', blurb: 'Capacitor kvar to reach a target power factor.', hub: 'protection' },
];

export const guides = [
  { slug: 'voltage-drop-formula', name: 'Voltage drop formula', blurb: 'DC, single-phase and three-phase, worked in mm² and AWG.', hub: 'electrical' as HubId },
  { slug: 'relay-setting-checklist', name: 'Relay setting checklist', blurb: 'Seven stages for a transformer-feeder overcurrent relay, with a worked example.', hub: 'protection' as HubId },
  { slug: 'how-to-size-a-circuit-breaker', name: 'How to size a circuit breaker', blurb: 'Six steps under the NEC, with EV, mixed-load and water-heater examples.', hub: 'electrical' as HubId },
  { slug: 'how-to-size-a-cable', name: 'How to size a cable', blurb: 'Five checks, one worked example: current, derating, voltage drop and fault withstand.', hub: 'electrical' as HubId },
  { slug: 'what-happens-when-lightning-strikes-a-building', name: 'What happens when lightning strikes', blurb: 'The path a strike takes through a building, why bonding matters, and what surge protection does.', hub: 'protection' as HubId },
  { slug: 'nec-voltage-drop-guide', name: 'NEC voltage drop: 3 % and 5 %', blurb: 'What the NEC recommends and how to size AWG wire for it, with examples.', hub: 'electrical' as HubId },
];

export const charts = [
  { slug: 'kw-to-amps-chart', name: 'kW to amps chart', blurb: 'Line current for 0.5 to 200 kW, single-phase and three-phase, 120 to 600 V including 230 and 400 V.', hub: 'electrical' as HubId },
  { slug: 'amps-to-kw-chart', name: 'Amps to kW chart', blurb: 'Real power for 5 to 200 A at the common voltages.', hub: 'electrical' as HubId },
  { slug: 'watts-to-amps-chart', name: 'Watts to amps chart', blurb: 'Current for 10 to 10,000 W from 12 V DC to 240 V AC.', hub: 'electrical' as HubId },
  { slug: 'breaker-amps-to-watts-chart', name: 'Breaker amps to watts', blurb: 'Continuous load that 15 to 200 A breakers support.', hub: 'electrical' as HubId },
  { slug: 'voltage-drop-chart', name: 'Voltage drop chart', blurb: 'Drop per amp and longest run for AWG copper and aluminum.', hub: 'electrical' as HubId },
  { slug: 'wire-size-by-distance-chart', name: 'Wire size by distance', blurb: 'Smallest copper wire for a 3 % drop over 25 to 300 ft at 120 V and 240 V.', hub: 'electrical' as HubId },
  { slug: 'wire-resistance-chart', name: 'Wire resistance chart', blurb: 'AWG diameter, area and ohms per 1,000 ft, copper and aluminum.', hub: 'electrical' as HubId },
  { slug: 'hp-to-kw-chart', name: 'HP to kW chart', blurb: 'Mechanical and metric horsepower, with motor input power.', hub: 'electrical' as HubId },
  { slug: 'transformer-full-load-current-chart', name: 'Transformer full-load current', blurb: 'Amps for 15 to 2,500 kVA at secondary and primary voltages.', hub: 'protection' as HubId },
  { slug: 'transformer-short-circuit-current-chart', name: 'Transformer fault current', blurb: 'Fault level in kA by kVA and impedance at 208 and 480 V.', hub: 'protection' as HubId },
  { slug: 'power-factor-correction-chart', name: 'Power factor correction chart', blurb: 'Capacitor kvar per kW from the present to the target power factor.', hub: 'protection' as HubId },
];

export const calcsIn = (hub: HubId) => calculators.filter((c) => c.hub === hub);
