// Prints every NEC value used by the site as markdown, so it can be compared with a copy of the code.
import * as T from '../src/data/nec-tables.ts';
const out = [];
out.push(`# NEC table values to verify\n\nSite follows: ${T.NEC_TABLES.edition}\nVerified against: ${T.NEC_TABLES.verifiedAgainst}\n\n## Verification status\n\n| Table | Status |\n|---|---|`);
for (const [id, t] of Object.entries(T.TABLE_STATUS)) out.push(`| ${t.label} (${id}) | ${t.verified ? 'VERIFIED: ' + t.by + ', ' + t.date : 'not verified' + (t.evidence ? '. Evidence so far: ' + t.evidence : '')} |`);
out.push('');
out.push('## Table 310.16 allowable ampacity (60 / 75 / 90 C)\n\n| Size | Copper | Aluminum |\n|---|---|---|');
for (const s of T.SIZES) { const r = T.AMPACITY_310_16[s.id]; out.push(`| ${s.label} | ${r.cu.join(' / ')} | ${r.al ? r.al.join(' / ') : '-'} |`); }
out.push('\n## 310.15(B)(1) ambient correction (base 30 C)\n\n| Ambient | 75 C | 90 C |\n|---|---|---|');
for (const a of T.AMBIENT_FACTORS) out.push(`| ${a.range} | ${a.f75 ?? '-'} | ${a.f90 ?? '-'} |`);
out.push('\n## 310.15(C)(1) adjustment factors\n\n| Conductors | Factor |\n|---|---|');
for (const a of T.ADJUSTMENT_FACTORS) out.push(`| ${a.range} | ${a.factor} |`);
out.push('\n## Chapter 9 Table 5, THHN/THWN area (in2)\n\n| Size | Area |\n|---|---|');
for (const s of T.SIZES) out.push(`| ${s.label} | ${T.THHN_AREA_IN2[s.id]} |`);
out.push(`\n## Chapter 9 Table 1 fill: 1 conductor ${T.FILL_PERCENT.one} %, 2 conductors ${T.FILL_PERCENT.two} %, over 2 ${T.FILL_PERCENT.over} %`);
for (const [key, c] of Object.entries(T.CONDUITS)) {
  out.push(`\n## Chapter 9 Table 4, ${c.label} (in2)${key === 'EMT' ? '' : '. Totals entered from memory; 53/31/40 % derived by rounding'}\n\n| Trade size | Total | 53 % | 31 % | 40 % |\n|---|---|---|---|---|`);
  for (const e of c.rows) out.push(`| ${e.trade} | ${e.total} | ${e.p53} | ${e.p31} | ${e.p40} |`);
}
out.push('\n## Table 430.250, three-phase motor full-load current (A)\n\n| hp | ' + Object.keys(T.MOTOR_FLC_3PH).join(' V | ') + ' V |\n|---|' + '---|'.repeat(Object.keys(T.MOTOR_FLC_3PH).length));
T.MOTOR_HP_3PH.forEach((hp, i) => out.push(`| ${hp} | ` + Object.values(T.MOTOR_FLC_3PH).map((a) => a[i]).join(' | ') + ' |'));
out.push('\n## Table 430.248, single-phase motor full-load current (A)\n\n| hp | ' + Object.keys(T.MOTOR_FLC_1PH).join(' V | ') + ' V |\n|---|' + '---|'.repeat(Object.keys(T.MOTOR_FLC_1PH).length));
T.MOTOR_HP_1PH.forEach((hp, i) => out.push(`| ${+hp.toFixed(3)} | ` + Object.values(T.MOTOR_FLC_1PH).map((a) => a[i]).join(' | ') + ' |'));
out.push('\n## Table 430.52, maximum branch-circuit device (percent of full-load current)\n\n| Device | Percent |\n|---|---|');
for (const d of Object.values(T.MOTOR_DEVICE_MAX)) out.push(`| ${d.label} | ${d.percent} |`);
console.log(out.join('\n'));
