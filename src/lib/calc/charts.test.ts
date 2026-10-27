import { describe, it, expect } from 'vitest';
import {
  kwToAmpsChart, ampsToKwChart, wattsToAmpsChart, transformerFlcChart, transformerFaultChart,
  dropPerAmpChart, maxLengthChart, wireSizeByDistanceChart, wireResistanceChart, hpToKwChart, breakerWattsChart, pfMultiplierChart, kvaToKwChart, kwToKvaChart, type Chart,
} from './charts';

const cell = (c: Chart, row: string, col: string) => c.rows.find((r) => r[0] === row)![c.headers.indexOf(col)];

describe('reference charts', () => {
  it('kW to amps: 25 kW three-phase at 480 V and PF 0.9 is 33.4 A; 10 kW at 240 V single-phase is 41.7 A', () => {
    expect(cell(kwToAmpsChart('three'), '25', '480 V')).toBe('33.4');
    expect(cell(kwToAmpsChart('single'), '10', '240 V')).toBe('41.7');
  });

  it('amps to kW: 40 A at 240 V is 9.60 kW; 60 A three-phase at 480 V, PF 0.9 is 44.89 kW', () => {
    expect(cell(ampsToKwChart('single'), '40', '240 V')).toBe('9.60');
    expect(cell(ampsToKwChart('three'), '60', '480 V')).toBe('44.89');
  });

  it('watts to amps: 1,500 W is 12.5 A at 120 V and 125 A at 12 V', () => {
    expect(cell(wattsToAmpsChart(), '1500', '120 V')).toBe('12.5');
    expect(cell(wattsToAmpsChart(), '1500', '12 V')).toBe('125');
  });

  it('transformer full-load current: 500 kVA is 601 A at 480 V and 20.9 A at 13,800 V', () => {
    expect(cell(transformerFlcChart([208, 480]), '500', '480 V')).toBe('601');
    expect(cell(transformerFlcChart([13800]), '500', '13800 V')).toBe('20.9');
  });

  it('transformer fault current: 1,000 kVA, 5.75 % at 480 V is 20.9 kA; 5 % is 24.1 kA', () => {
    const c = transformerFaultChart(480, [5, 5.75]);
    expect(cell(c, '1000', '5.75 % Z')).toBe('20.9');
    expect(cell(c, '1000', '5 % Z')).toBe('24.1');
  });

  it('voltage drop per amp: 10 AWG copper at 75 C is 0.243 V per A per 100 ft; aluminium is higher', () => {
    const c = dropPerAmpChart();
    expect(cell(c, '10', 'Copper')).toBe('0.243');
    expect(Number(cell(c, '10', 'Aluminium'))).toBeGreaterThan(0.243);
  });

  it('longest run for a 3 % drop: 10 AWG at 20 A on 240 V is 148 ft, half that on 120 V', () => {
    expect(cell(maxLengthChart(240, [20]), '10', '20 A')).toBe('148');
    expect(cell(maxLengthChart(120, [20]), '10', '20 A')).toBe('74');
  });

  it('wire resistance: 12 AWG copper is 1.588 ohm per 1,000 ft at 20 C and 1.932 at 75 C', () => {
    const c = wireResistanceChart();
    expect(cell(c, '12', 'Cu 20 °C')).toBe('1.588');
    expect(cell(c, '12', 'Cu 75 °C')).toBe('1.932');
    expect(cell(c, '14', 'Cu 20 °C')).toBe('2.525');
  });

  it('HP to kW: 30 HP is 22.371 kW at the shaft and 24.86 kW input at 90 %', () => {
    const c = hpToKwChart(0.9);
    expect(cell(c, '30', 'kW (mechanical hp)')).toBe('22.371');
    expect(cell(c, '30', 'Input kW at 90 %')).toBe('24.86');
  });

  it('breaker chart: a 20 A breaker supports 1,920 W continuous at 120 V and 3,840 W at 240 V', () => {
    const c = breakerWattsChart();
    expect(cell(c, '20 A', '120 V')).toBe('1,920');
    expect(cell(c, '20 A', '240 V')).toBe('3,840');
  });

  it('power factor chart: 0.75 to 0.95 needs 0.553 kvar per kW; no correction below the present value', () => {
    const c = pfMultiplierChart();
    expect(cell(c, '0.75', 'Target 0.95')).toBe('0.553');
    expect(cell(c, '0.9', 'Target 0.9')).toBe('–');
  });

  it('wire size by distance: 20 A over 100 ft is 10 AWG on 240 V and 8 AWG on 120 V', () => {
    expect(cell(wireSizeByDistanceChart(240), '100 ft', '20 A')).toBe('10');
    expect(cell(wireSizeByDistanceChart(120), '100 ft', '20 A')).toBe('8');
  });

  it('wire size by distance: the 240.4(D) floor holds on short runs (20 A at 25 ft is 12 AWG, 15 A is 14 AWG, 30 A is 10 AWG)', () => {
    const c = wireSizeByDistanceChart(120);
    expect(cell(c, '25 ft', '15 A')).toBe('14');
    expect(cell(c, '25 ft', '20 A')).toBe('12');
    expect(cell(c, '25 ft', '30 A')).toBe('10');
  });

  it('wire size by distance: sizes never shrink as the run gets longer', () => {
    const c = wireSizeByDistanceChart(240);
    const num = (s: string) => (s.includes('/') ? -Number(s.split('/')[0]) : s === '> 4/0' ? -99 : Number(s));
    for (let col = 1; col < c.headers.length; col++) {
      const sizes = c.rows.map((r) => num(r[col]));
      for (let i = 1; i < sizes.length; i++) expect(sizes[i]).toBeLessThanOrEqual(sizes[i - 1]);
    }
  });

  it('new rows: 22 kW at 400 V three-phase is 35.3 A; 7.6 kW at 240 V single-phase is 31.7 A; 1,440 W at 120 V is 12.0 A; 4,500 W at 240 V is 18.8 A', () => {
    expect(cell(kwToAmpsChart('three'), '22', '400 V')).toBe('35.3');
    expect(cell(kwToAmpsChart('single'), '7.6', '240 V')).toBe('31.7');
    expect(cell(wattsToAmpsChart(), '1440', '120 V')).toBe('12.0');
    expect(cell(wattsToAmpsChart(), '4500', '240 V')).toBe('18.8');
  });

  it('long-tail rows: 5.9 kW at 240 V is 24.6 A; 150 kW at 400 V three-phase is 241 A; 1,200 W at 120 V is 10.0 A; 10,000 W at 240 V is 41.7 A', () => {
    expect(cell(kwToAmpsChart('single'), '5.9', '240 V')).toBe('24.6');
    expect(cell(kwToAmpsChart('three'), '150', '400 V')).toBe('241');
    expect(cell(wattsToAmpsChart(), '1200', '120 V')).toBe('10.0');
    expect(cell(wattsToAmpsChart(), '10000', '240 V')).toBe('41.7');
  });

  it('every chart row has one cell per header', () => {
    for (const c of [kwToAmpsChart('three'), ampsToKwChart('single'), wattsToAmpsChart(), transformerFlcChart([480]), dropPerAmpChart(), wireResistanceChart(), hpToKwChart(), breakerWattsChart(), pfMultiplierChart(), wireSizeByDistanceChart(120)]) {
      for (const r of c.rows) expect(r.length).toBe(c.headers.length);
    }
  });

  it('kVA to kW: 100 kVA is 80.0 kW at PF 0.8 and 90.0 kW at 0.9; 1 kVA is 0.80 kW at 0.8; 500 kVA at 0.9 is 450 kW', () => {
    const c = kvaToKwChart();
    expect(cell(c, '100', 'PF 0.8')).toBe('80.0');
    expect(cell(c, '100', 'PF 0.9')).toBe('90.0');
    expect(cell(c, '1', 'PF 0.8')).toBe('0.80');
    expect(cell(c, '500', 'PF 0.9')).toBe('450');
    expect(cell(c, '1000', 'PF 1')).toBe('1,000');
  });

  it('kW to kVA: 80 kW at PF 0.8 is 100 kVA; 50 kW at 0.85 is 58.8 kVA; 250 kW at 0.9 is 278 kVA', () => {
    const c = kwToKvaChart();
    expect(cell(c, '80', 'PF 0.8')).toBe('100');
    expect(cell(c, '50', 'PF 0.85')).toBe('58.8');
    expect(cell(c, '250', 'PF 0.9')).toBe('278');
    expect(cell(c, '10', 'PF 1')).toBe('10.0');
  });
});
