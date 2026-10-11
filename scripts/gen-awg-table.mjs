// Prints the AWG tables used on /awg-to-mm2-converter/ from the tested formula (src/lib/calc/awg-to-mm2.ts).
import { awgToDiameterMm, awgToMm2, mm2ToNearestAwg, awgLabel } from '../src/lib/calc/awg-to-mm2.ts';
const IEC = [0.5, 0.75, 1, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300];
const sizes = [-3, -2, -1, 0, ...Array.from({ length: 24 }, (_, i) => i + 1), 26, 28, 30];
const f = (x, d) => x.toFixed(d);
console.log('| AWG | Diameter (mm) | Diameter (in) | Area (mm²) | Smallest standard metric size at or above |\n|---|---|---|---|---|');
for (const n of sizes) {
  const a = awgToMm2(n), d = awgToDiameterMm(n);
  console.log(`| ${awgLabel(n)} | ${f(d, 3)} | ${f(d / 25.4, 4)} | ${f(a, a < 1 ? 3 : 2)} | ${IEC.find((s) => s >= a - 1e-9) ?? 'above 300'} mm² |`);
}
console.log('\n--- metric ---\n| Metric size | Nearest AWG | Area of nearest AWG (mm²) | Smallest AWG with at least this area | Its area (mm²) |\n|---|---|---|---|---|');
for (const m of [0.5, 0.75, 1, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95]) {
  const near = mm2ToNearestAwg(m);
  let big = near; while (awgToMm2(big) < m - 1e-9) big -= 1;
  console.log(`| ${m} mm² | ${awgLabel(near)} | ${f(awgToMm2(near), 2)} | ${awgLabel(big)} | ${f(awgToMm2(big), 2)} |`);
}
