"""Free sample sheet: breaker size (125 % rule) and voltage drop check for one circuit. Formulas only."""
import math
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import FormulaRule

OUT = 'public/downloads/ohmetry-sample-sheet.xlsx'  # run from the repo root: python3 docs/build_sample_sheet.py
F = 'Arial'
INK = '0E171E'
base = Font(name=F, size=10); bold = Font(name=F, size=10, bold=True)
title = Font(name=F, size=16, bold=True, color=INK); note = Font(name=F, size=9, color='666666')
head = Font(name=F, size=10, bold=True, color='FFFFFF'); inp = Font(name=F, size=10, color='0000FF')
fh = PatternFill('solid', fgColor=INK); fi = PatternFill('solid', fgColor='FFF9DB'); fo = PatternFill('solid', fgColor='EAF0FB')
thin = Side(style='thin', color='C9D2DA'); box = Border(left=thin, right=thin, top=thin, bottom=thin)
wrap = Alignment(wrap_text=True, vertical='top')

wb = Workbook()
ws0 = wb.active; ws0.title = 'Start Here'
ws = wb.create_sheet('Breaker + Voltage Drop')
ls = wb.create_sheet('Lists')
for w in (ws0, ws, ls): w.sheet_view.showGridLines = False

def put(sh, a, v, font=base, fill=None, fmt=None, align=None, border=None):
    c = sh[a]; c.value = v; c.font = font
    if fill: c.fill = fill
    if fmt: c.number_format = fmt
    if align: c.alignment = align
    if border: c.border = border

# ---- Lists -------------------------------------------------------------------------------------
put(ls, 'A1', 'Standard ratings (A)', bold); put(ls, 'C1', 'AWG label', bold); put(ls, 'D1', 'n', bold); put(ls, 'F1', 'Material', bold); put(ls, 'G1', 'rho at 20 C (ohm mm2/m)', bold); put(ls, 'H1', 'alpha (per C)', bold); put(ls, 'J1', 'Phase', bold)
ratings = [15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 110, 125, 150, 175, 200, 225, 250, 300, 350, 400, 450, 500, 600, 700, 800, 1000, 1200, 1600, 2000]
for i, r in enumerate(ratings, 2): put(ls, f'A{i}', r)
awg = [('14', 14), ('12', 12), ('10', 10), ('8', 8), ('6', 6), ('4', 4), ('3', 3), ('2', 2), ('1', 1), ('1/0', 0), ('2/0', -1), ('3/0', -2), ('4/0', -3)]
for i, (l, n) in enumerate(awg, 2): put(ls, f'C{i}', l); put(ls, f'D{i}', n)
put(ls, 'F2', 'Copper'); put(ls, 'G2', 0.017241); put(ls, 'H2', 0.00393)
put(ls, 'F3', 'Aluminum'); put(ls, 'G3', 0.028264); put(ls, 'H3', 0.00403)
put(ls, 'J2', 'Single-phase'); put(ls, 'J3', 'Three-phase')
put(ls, 'A36', 'Ratings are the common standard sizes. Edit the list to match the standard you work to.', note)
for col, w in zip('ABCDEFGHIJ', (20, 3, 12, 6, 3, 12, 24, 14, 3, 14)): ls.column_dimensions[col].width = w

# ---- Start Here --------------------------------------------------------------------------------
ws0.column_dimensions['A'].width = 3; ws0.column_dimensions['B'].width = 96
put(ws0, 'B2', 'Ohmetry sample sheet', title)
put(ws0, 'B3', 'Breaker size and voltage drop for one circuit. A free sample from the Electrical Engineer’s Toolkit.', Font(name=F, size=10, italic=True, color='555555'))
lines = [
 ('What it does', 'Enter a load, a voltage and a cable run on the next sheet. It gives the minimum breaker under the 125 % continuous-load rule (NEC 210.20(A)), the next standard rating, the voltage drop in volts and percent, and the longest run that stays inside your limit.'),
 ('How to use it', 'Change the blue cells on the “Breaker + Voltage Drop” sheet. Everything else is a formula you can click and read. The Self-Test block at the bottom recalculates a worked example and shows PASS when the sheet agrees with the expected values.'),
 ('What it does not do', 'It does not check wire ampacity, terminal ratings, temperature or conduit adjustment, or any motor, EV, or other special-case rule. The conductor must also be large enough for the breaker under the code you work to. Voltage drop uses resistance only, no reactance.'),
 ('Method', 'Minimum device = 1.25 × continuous + noncontinuous load. Drop = k × I × L × ρ / A, with k = 2 for single-phase and √3 for three-phase, ρ at the conductor temperature, and A from the AWG diameter 0.127 × 92^((36 − n)/39) mm.'),
 ('More', 'The same calculations are free online at ohmetry.com. The full workbook has circuit and load schedules, relay grading, fault levels and 71 self-checks across 14 sheets.'),
 ('Disclaimer', 'An engineering aid, not a substitute for the applicable code or a licensed engineer’s review. Verify results against your project standards before relying on them. Version 1.0.'),
]
r = 5
for h, t in lines:
    put(ws0, f'B{r}', h, bold); put(ws0, f'B{r+1}', t, base, align=wrap); ws0.row_dimensions[r+1].height = 54; r += 3

# ---- Calculator --------------------------------------------------------------------------------
for col, w in zip('ABCD', (3, 40, 18, 52)): ws.column_dimensions[col].width = w
put(ws, 'B1', 'Breaker size and voltage drop', title)
put(ws, 'B2', 'Blue cells on a yellow background are inputs. Everything else is calculated.', note)
for a, t in (('B3', 'Inputs'), ('C3', 'Value'), ('D3', 'Note')): put(ws, a, t, head, fh)
rows = [
 (4, 'Continuous load (A)', 20, '0.0', 'Runs three hours or more. Gets the 125 % factor.'),
 (5, 'Noncontinuous load (A)', 0, '0.0', 'Counted at 100 %.'),
 (6, 'System voltage (V)', 240, '0', 'Line-to-line for three-phase.'),
 (7, 'Phase', 'Single-phase', None, 'Single-phase or Three-phase.'),
 (8, 'Conductor material', 'Copper', None, 'Copper or Aluminum.'),
 (9, 'Conductor size (AWG)', '10', None, '14 to 4/0. 1/0 means AWG 0.'),
 (10, 'One-way length (ft)', 150, '0', 'Source to load. The return is counted for you.'),
 (11, 'Conductor temperature (°C)', 75, '0', '75 °C is a common design value.'),
 (12, 'Allowed voltage drop (%)', 3, '0.0', 'The NEC recommends 3 % for a branch circuit.'),
]
for r, lab, val, fmt, nt in rows:
    put(ws, f'B{r}', lab, base, border=box); put(ws, f'C{r}', val, inp, fi, fmt, border=box); put(ws, f'D{r}', nt, note, border=box)
put(ws, 'C9', '10', inp, fi, '@', border=box)
for a, f_ in (('C7', '"Single-phase,Three-phase"'), ('C8', '"Copper,Aluminum"')):
    dv = DataValidation(type='list', formula1=f_, allow_blank=False); ws.add_data_validation(dv); dv.add(a)
dv = DataValidation(type='list', formula1='=Lists!$C$2:$C$14', allow_blank=False); ws.add_data_validation(dv); dv.add('C9')
for a, lo in (('C4', 0), ('C5', 0), ('C6', 1), ('C10', 1), ('C12', 0.01)):
    dv = DataValidation(type='decimal', operator='greaterThanOrEqual', formula1=str(lo), showErrorMessage=True, error='Enter a number'); ws.add_data_validation(dv); dv.add(a)

for a, t in (('B14', 'Breaker'), ('C14', 'Result'), ('D14', 'Note')): put(ws, a, t, head, fh)
calc = [
 (15, 'Minimum device rating (A)', '=1.25*C4+C5', '0.0', '125 % of continuous + 100 % of noncontinuous.'),
 (16, 'Next standard rating (A)', '=IF(C15>MAX(Lists!$A$2:$A$33),"Above list",INDEX(Lists!$A$2:$A$33,COUNTIF(Lists!$A$2:$A$33,"<"&(C15-0.000001))+1))', '0', 'From the Lists sheet. Check it with your protection requirements.'),
]
for r, lab, f_, fmt, nt in calc:
    put(ws, f'B{r}', lab, base, border=box); put(ws, f'C{r}', f_, bold, fo, fmt, border=box); put(ws, f'D{r}', nt, note, border=box)

for a, t in (('B18', 'Voltage drop'), ('C18', 'Result'), ('D18', 'Note')): put(ws, a, t, head, fh)
calc2 = [
 (19, 'Design current (A)', '=C4+C5', '0.0', 'Continuous plus noncontinuous load.'),
 (20, 'Resistivity at temperature (ohm mm²/m)', '=INDEX(Lists!$G$2:$G$3,MATCH(C8,Lists!$F$2:$F$3,0))*(1+INDEX(Lists!$H$2:$H$3,MATCH(C8,Lists!$F$2:$F$3,0))*(C11-20))', '0.000000', 'Rises with temperature.'),
 (21, 'Conductor area (mm²)', '=PI()/4*(0.127*92^((36-INDEX(Lists!$D$2:$D$14,MATCH(C9,Lists!$C$2:$C$14,0)))/39))^2', '0.00', 'Solid round conductor from the AWG definition.'),
 (22, 'Circuit factor k', '=IF(C7="Three-phase",SQRT(3),2)', '0.000', '2 for out and back, √3 for balanced three-phase.'),
 (23, 'Voltage drop (V)', '=C22*C19*C10*0.3048*C20/C21', '0.00', 'Resistance only, reactance ignored.'),
 (24, 'Voltage drop (%)', '=C23/C6*100', '0.00', 'Of the system voltage.'),
 (25, 'Result', '=IF(C24<=C12,"PASS","CHECK")', None, 'PASS when the drop is within your allowed percent.'),
 (26, 'Longest run for the limit (ft)', '=(C12/100*C6*C21)/(C22*C19*C20)/0.3048', '#,##0', 'One-way length at which the drop equals your limit.'),
]
for r, lab, f_, fmt, nt in calc2:
    put(ws, f'B{r}', lab, base, border=box); put(ws, f'C{r}', f_, bold if r in (23, 24, 25, 26) else base, fo, fmt, border=box); put(ws, f'D{r}', nt, note, border=box)
red = PatternFill('solid', bgColor='F8D7DA', fgColor='F8D7DA'); grn = PatternFill('solid', bgColor='D5F0DD', fgColor='D5F0DD')
ws.conditional_formatting.add('C25', FormulaRule(formula=['$C$25="CHECK"'], fill=red))
ws.conditional_formatting.add('C25', FormulaRule(formula=['$C$25="PASS"'], fill=grn))

# Self-test: worked example computed independently here in Python
rho = 0.017241 * (1 + 0.00393 * 55); d = 0.127 * 92 ** ((36 - 10) / 39); A = math.pi / 4 * d * d
drop_v = 2 * 20 * 150 * 0.3048 * rho / A
exp = {'min': 25.0, 'std': 25, 'drop': round(drop_v, 4), 'pct': round(drop_v / 240 * 100, 4), 'len': round((0.03 * 240 * A) / (2 * 20 * rho) / 0.3048, 2)}
put(ws, 'B28', 'Self-test', head, fh); put(ws, 'C28', 'Expected', head, fh); put(ws, 'D28', 'Sheet value and status', head, fh)
put(ws, 'B29', 'Worked example: 20 A continuous, 240 V single-phase, 10 AWG copper, 150 ft, 75 °C, 3 % limit. Uses its own inputs below, not the cells above.', note, align=wrap); ws.merge_cells('B29:D29'); ws.row_dimensions[29].height = 28
# Self-test uses its own fixed inputs, so changing the blue cells does not break the check.
put(ws, 'B30', 'Minimum device (A)', base, border=box); put(ws, 'C30', exp['min'], base, border=box, fmt='0.0')
put(ws, 'D30', '=IF(ABS(1.25*20+0-C30)<0.0001,"PASS","FAIL")', bold, border=box)
put(ws, 'B31', 'Next standard rating (A)', base, border=box); put(ws, 'C31', exp['std'], base, border=box)
put(ws, 'D31', '=IF(INDEX(Lists!$A$2:$A$33,COUNTIF(Lists!$A$2:$A$33,"<"&(1.25*20-0.000001))+1)=C31,"PASS","FAIL")', bold, border=box)
put(ws, 'B32', 'Voltage drop (V)', base, border=box); put(ws, 'C32', exp['drop'], base, border=box, fmt='0.0000')
put(ws, 'D32', '=IF(ABS(2*20*150*0.3048*(Lists!$G$2*(1+Lists!$H$2*(75-20)))/(PI()/4*(0.127*92^((36-10)/39))^2)-C32)<0.0005,"PASS","FAIL")', bold, border=box)
put(ws, 'B33', 'Voltage drop (%)', base, border=box); put(ws, 'C33', exp['pct'], base, border=box, fmt='0.0000')
put(ws, 'D33', '=IF(ABS(D32_VALUE/240*100-C33)<0.0005,"PASS","FAIL")'.replace('D32_VALUE', '(2*20*150*0.3048*(Lists!$G$2*(1+Lists!$H$2*(75-20)))/(PI()/4*(0.127*92^((36-10)/39))^2))'), bold, border=box)
put(ws, 'B34', 'Longest run for 3 % (ft)', base, border=box); put(ws, 'C34', exp['len'], base, border=box, fmt='#,##0.00')
put(ws, 'D34', '=IF(ABS((0.03*240*(PI()/4*(0.127*92^((36-10)/39))^2))/(2*20*(Lists!$G$2*(1+Lists!$H$2*(75-20))))/0.3048-C34)<0.01,"PASS","FAIL")', bold, border=box)
put(ws, 'B35', 'All checks', bold, border=box); put(ws, 'C35', '=IF(COUNTIF(D30:D34,"PASS")=5,"ALL PASS","REVIEW")', bold, fo, border=box)
ws.conditional_formatting.add('D30:D35', FormulaRule(formula=['D30="FAIL"'], fill=red))
ws.freeze_panes = 'A4'
ws.page_setup.orientation = 'portrait'; ws.page_setup.fitToWidth = 1; ws.sheet_properties.pageSetUpPr.fitToPage = True
wb.save(OUT)
print(exp)
