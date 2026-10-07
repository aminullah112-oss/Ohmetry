// Prints every NEC value used by the site as markdown, so it can be compared with a copy of the code.
import * as T from '../src/data/nec-tables.ts';
const out = [];
out.push(`# NEC table values to verify\n\nStatus: ${T.NEC_TABLES.verified ? 'VERIFIED by ' + T.NEC_TABLES.verifiedBy : 'NOT VERIFIED'}. Edition: ${T.NEC_TABLES.edition}\n`);
out.push('## Table 310.16 allowable ampacity (60 / 75 / 90 C)\n\n| Size | Copper | Aluminum |\n|---|---|---|');
for (const s of T.SIZES) { const r = T.AMPACITY_310_16[s.id]; out.push(`| ${s.label} | ${r.cu.join(' / ')} | ${r.al ? r.al.join(' / ') : '-'} |`); }
out.push('\n## 310.15(B)(1) ambient correction (base 30 C)\n\n| Ambient | 75 C | 90 C |\n|---|---|---|');
for (const a of T.AMBIENT_FACTORS) out.push(`| ${a.range} | ${a.f75 ?? '-'} | ${a.f90 ?? '-'} |`);
out.push('\n## 310.15(C)(1) adjustment factors\n\n| Conductors | Factor |\n|---|---|');
for (const a of T.ADJUSTMENT_FACTORS) out.push(`| ${a.range} | ${a.factor} |`);
out.push('\n## Chapter 9 Table 5, THHN/THWN area (in2)\n\n| Size | Area |\n|---|---|');
for (const s of T.SIZES) out.push(`| ${s.label} | ${T.THHN_AREA_IN2[s.id]} |`);
out.push(`\n## Chapter 9 Table 1 fill: 1 conductor ${T.FILL_PERCENT.one} %, 2 conductors ${T.FILL_PERCENT.two} %, over 2 ${T.FILL_PERCENT.over} %`);
out.push('\n## Chapter 9 Table 4, EMT (in2)\n\n| Trade size | Total | 53 % | 31 % | 40 % |\n|---|---|---|---|---|');
for (const e of T.EMT_TABLE_4) out.push(`| ${e.trade} | ${e.total} | ${e.p53} | ${e.p31} | ${e.p40} |`);
console.log(out.join('\n'));
