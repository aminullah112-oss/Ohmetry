"""Free insulation resistance (megger) test record sheet. Formulas only; no code tables, no fixed limits.
Run from the repo root: python3 docs/build_megger_sheet.py"""
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import FormulaRule

OUT = 'public/downloads/ohmetry-insulation-resistance-record.xlsx'
F = 'Arial'; INK = '0E171E'
base = Font(name=F, size=10); bold = Font(name=F, size=10, bold=True)
title = Font(name=F, size=16, bold=True, color=INK); note = Font(name=F, size=9, color='666666')
head = Font(name=F, size=10, bold=True, color='FFFFFF'); inp = Font(name=F, size=10, color='0000FF')
fh = PatternFill('solid', fgColor=INK); fi = PatternFill('solid', fgColor='FFF9DB'); fo = PatternFill('solid', fgColor='EAF0FB')
thin = Side(style='thin', color='C9D2DA'); box = Border(left=thin, right=thin, top=thin, bottom=thin)
wrap = Alignment(wrap_text=True, vertical='top'); ctr = Alignment(horizontal='center', vertical='center', wrap_text=True)
RED = PatternFill('solid', bgColor='F8C9C4'); GRN = PatternFill('solid', bgColor='CDEBD3'); AMB = PatternFill('solid', bgColor='FFE9A8')

wb = Workbook()
s0 = wb.active; s0.title = 'Start Here'
rec = wb.create_sheet('IR Test Record'); pi = wb.create_sheet('PI Test'); st = wb.create_sheet('Test Steps'); chk = wb.create_sheet('Self-Test')
for w in (s0, rec, pi, st, chk): w.sheet_view.showGridLines = False

def put(sh, a, v, font=base, fill=None, fmt=None, align=None, border=None):
    c = sh[a]; c.value = v; c.font = font
    if fill: c.fill = fill
    if fmt: c.number_format = fmt
    if align: c.alignment = align
    if border: c.border = border
    return c

# ---- Start Here --------------------------------------------------------------------------------
s0.column_dimensions['A'].width = 3; s0.column_dimensions['B'].width = 100
put(s0, 'B2', 'Insulation resistance (megger) test record', title)
lines = [
 ('What this is', 'A blank record sheet for insulation resistance tests, with a pass/fail check against the minimum YOUR specification or standard requires, a length-normalised value, a polarization index calculator and a pre-test checklist.'),
 ('What it does not do', 'It does not contain test voltages or minimum values from any standard. Those depend on the standard, the circuit voltage and the project specification. Enter them yourself on the IR Test Record sheet. Until you enter a minimum, the status column says "Enter minimum".'),
 ('How to use', '1. On IR Test Record, fill the yellow header cells (project, instrument, test voltage, minimum acceptable). 2. Add one row per circuit or cable and type the readings in MOhm. 3. Read the Status column. 4. Use PI Test only where the specification asks for a polarization index. 5. Work through Test Steps before you test.'),
 ('Colour code', 'Yellow cells with blue text are inputs. Blue-grey cells are calculated. Do not type over calculated cells.'),
 ('Readings', 'Enter readings in MOhm as numbers. If the instrument goes over-range, enter its maximum scale value and write "over-range" in Remarks. Leave a cell empty if that combination was not tested. An empty reading is ignored; it is not counted as zero.'),
 ('Length value', 'The MOhm.km column multiplies the lowest reading by the cable length in km. Insulation resistance of a cable falls as it gets longer, so this lets you compare cables of different lengths. Compare it only against a figure that your specification also states per km.'),
 ('Temperature and humidity', 'Insulation resistance changes with temperature and moisture. Record both. This sheet does not apply any temperature correction because the correction depends on the insulation type and the standard.'),
 ('Safety', 'Testing is done on de-energised, isolated and proven-dead circuits, by competent persons following the site permit and isolation procedure. This sheet is a record, not a procedure, and it is not a substitute for your standard or your company method statement.'),
 ('Limits', 'Ohmetry provides this sheet as is, without warranty. You are responsible for the test method, the limits applied and the results you sign off. Report an error to hello@ohmetry.com.'),
]
r = 4
for h, t in lines:
    put(s0, f'B{r}', h, bold); r += 1
    put(s0, f'B{r}', t, base, align=wrap); s0.row_dimensions[r].height = 15 * (1 + len(t) // 100); r += 2
put(s0, f'B{r}', 'Ohmetry | https://ohmetry.com | hello@ohmetry.com', note)

# ---- IR Test Record ----------------------------------------------------------------------------
readings = ['L1-L2', 'L2-L3', 'L3-L1', 'L1-N', 'L2-N', 'L3-N', 'L1-E', 'L2-E', 'L3-E', 'N-E']
rec.column_dimensions['A'].width = 12; rec.column_dimensions['B'].width = 30; rec.column_dimensions['C'].width = 11
for c in 'DEFGHIJKLM': rec.column_dimensions[c].width = 9
for c, w in zip('NOPQR', (13, 13, 14, 26, 14)): rec.column_dimensions[c].width = w
put(rec, 'A1', 'Insulation resistance test record', title)
hdr = [('A3', 'Project', 'B3'), ('A4', 'Location / board', 'B4'), ('A5', 'Test date', 'B5'), ('A6', 'Tested by (company)', 'B6'),
       ('F3', 'Instrument', 'I3'), ('F4', 'Calibration due', 'I4'), ('F5', 'Ambient temp (C)', 'I5'), ('F6', 'Humidity (%)', 'I6')]
for lab, txt, cell in hdr:
    put(rec, lab, txt, bold)
    put(rec, cell, None, inp, fi, border=box)
put(rec, 'B5', None, inp, fi, 'dd-mmm-yyyy', border=box)
put(rec, 'K3', 'Test voltage (V DC)', bold); put(rec, 'N3', None, inp, fi, '0', border=box)
put(rec, 'K4', 'Minimum acceptable (MOhm)', bold); put(rec, 'N4', None, inp, fi, '0.00', border=box)
put(rec, 'K5', 'Source of minimum', bold); put(rec, 'N5', None, inp, fi, border=box)
put(rec, 'K6', 'Enter the voltage and the minimum from your specification or standard. This sheet does not supply them.', note)
rec.merge_cells('K6:R6')
H = 8
cols = ['Ref', 'Circuit / cable', 'Length (m)'] + readings + ['Lowest reading (MOhm)', 'Readings entered', 'MOhm.km (lowest x km)', 'Status', 'Remarks']
for i, h in enumerate(cols, 1):
    c = rec.cell(H, i, h); c.font = head; c.fill = fh; c.alignment = ctr; c.border = box
rec.row_dimensions[H].height = 44
N = 30
for r in range(H + 1, H + 1 + N):
    for i in range(1, 14): put(rec, f'{chr(64+i)}{r}', None, inp, fi, '0.0' if i > 3 else None, border=box)
    put(rec, f'C{r}', None, inp, fi, '0', border=box)
    put(rec, f'N{r}', f'=IF(COUNT(D{r}:M{r})=0,"",MIN(D{r}:M{r}))', base, fo, '0.00', border=box)
    put(rec, f'O{r}', f'=COUNT(D{r}:M{r})', base, fo, '0', border=box)
    put(rec, f'P{r}', f'=IF(OR(N{r}="",C{r}=""),"",N{r}*C{r}/1000)', base, fo, '0.00', border=box)
    put(rec, f'Q{r}', f'=IF(O{r}=0,"",IF($N$4="","Enter minimum",IF(N{r}>=$N$4,"Pass","FAIL")))', bold, fo, border=box)
    put(rec, f'R{r}', None, inp, fi, border=box)
rng = f'Q{H+1}:Q{H+N}'
rec.conditional_formatting.add(rng, FormulaRule(formula=[f'Q{H+1}="FAIL"'], fill=RED))
rec.conditional_formatting.add(rng, FormulaRule(formula=[f'Q{H+1}="Pass"'], fill=GRN))
rec.conditional_formatting.add(rng, FormulaRule(formula=[f'Q{H+1}="Enter minimum"'], fill=AMB))
dv = DataValidation(type='decimal', operator='greaterThanOrEqual', formula1='0', allow_blank=True, showErrorMessage=True, errorTitle='Reading', error='Enter a number in MOhm (0 or more).')
rec.add_data_validation(dv); dv.add(f'D{H+1}:M{H+N}')
dl = DataValidation(type='decimal', operator='greaterThan', formula1='0', allow_blank=True, showErrorMessage=True, errorTitle='Length', error='Enter the length in metres (more than 0).')
rec.add_data_validation(dl); dl.add(f'C{H+1}:C{H+N}')
tot = H + N + 2
put(rec, f'A{tot}', 'Summary', bold)
put(rec, f'A{tot+1}', 'Circuits with readings'); put(rec, f'D{tot+1}', f'=COUNTIF(O{H+1}:O{H+N},">0")', base, fo, '0', border=box)
put(rec, f'A{tot+2}', 'Pass'); put(rec, f'D{tot+2}', f'=COUNTIF(Q{H+1}:Q{H+N},"Pass")', base, fo, '0', border=box)
put(rec, f'A{tot+3}', 'FAIL'); put(rec, f'D{tot+3}', f'=COUNTIF(Q{H+1}:Q{H+N},"FAIL")', base, fo, '0', border=box)
put(rec, f'A{tot+4}', 'Minimum not entered'); put(rec, f'D{tot+4}', f'=COUNTIF(Q{H+1}:Q{H+N},"Enter minimum")', base, fo, '0', border=box)
put(rec, f'A{tot+6}', 'Tested by (name and signature): ____________________    Witnessed by: ____________________    Date: ____________', base)
put(rec, f'A{tot+7}', 'A Pass here means only that the lowest reading is at or above the minimum you entered. It does not confirm that the minimum is the right one.', note)
rec.freeze_panes = f'D{H+1}'
rec.page_setup.orientation = 'landscape'; rec.page_setup.fitToWidth = 1; rec.page_setup.fitToHeight = 0
rec.sheet_properties.pageSetUpPr.fitToPage = True

# ---- PI Test -----------------------------------------------------------------------------------
pi.column_dimensions['A'].width = 24
for c in 'BCDEFG': pi.column_dimensions[c].width = 15
pi.column_dimensions['H'].width = 28
put(pi, 'A1', 'Polarization index (PI) and dielectric absorption ratio (DAR)', title)
put(pi, 'A2', 'PI = reading at 10 min / reading at 1 min. DAR = reading at 60 s / reading at 30 s. Use only where the specification asks for it, and compare with the value the specification states.', note)
ph = ['Ref / equipment', 'R at 30 s (MOhm)', 'R at 60 s (MOhm)', 'R at 10 min (MOhm)', 'DAR (60 s / 30 s)', 'PI (10 min / 1 min)', 'Minimum PI (spec)', 'Status']
for i, h in enumerate(ph, 1):
    c = pi.cell(4, i, h); c.font = head; c.fill = fh; c.alignment = ctr; c.border = box
pi.row_dimensions[4].height = 36
for r in range(5, 15):
    for i in range(1, 5): put(pi, f'{chr(64+i)}{r}', None, inp, fi, '0.00' if i > 1 else None, border=box)
    put(pi, f'G{r}', None, inp, fi, '0.00', border=box)
    put(pi, f'E{r}', f'=IF(OR(B{r}="",C{r}="",B{r}=0),"",C{r}/B{r})', base, fo, '0.00', border=box)
    put(pi, f'F{r}', f'=IF(OR(C{r}="",D{r}="",C{r}=0),"",D{r}/C{r})', base, fo, '0.00', border=box)
    put(pi, f'H{r}', f'=IF(F{r}="","",IF(G{r}="","Enter minimum",IF(F{r}>=G{r},"Pass","FAIL")))', bold, fo, border=box)
pr = 'H5:H14'
pi.conditional_formatting.add(pr, FormulaRule(formula=['H5="FAIL"'], fill=RED))
pi.conditional_formatting.add(pr, FormulaRule(formula=['H5="Pass"'], fill=GRN))
pi.conditional_formatting.add(pr, FormulaRule(formula=['H5="Enter minimum"'], fill=AMB))

# ---- Test Steps --------------------------------------------------------------------------------
st.column_dimensions['A'].width = 5; st.column_dimensions['B'].width = 78; st.column_dimensions['C'].width = 12; st.column_dimensions['D'].width = 28
put(st, 'A1', 'Pre-test and test checklist (generic)', title)
put(st, 'A2', 'A general reminder list. Your permit to work, isolation procedure, instrument manual and specification take precedence.', note)
for i, h in enumerate(['#', 'Step', 'Done', 'Remarks'], 1):
    c = st.cell(4, i, h); c.font = head; c.fill = fh; c.alignment = ctr; c.border = box
steps = [
 'Permit to work and isolation procedure in place for the circuit under test',
 'Circuit isolated, locked and tagged; proved dead with a voltage indicator that was itself proved before and after',
 'Test voltage and minimum acceptable value taken from the specification or standard and written on the record',
 'Instrument within calibration; leads in good condition; lead resistance or short-circuit check done if the manual asks for it',
 'Sensitive equipment disconnected or protected (electronics, surge protective devices, capacitors, dimmers, drives, meters)',
 'Other end of the cable clear of personnel and not connected to equipment that could be damaged by the test voltage',
 'Neutral and earth links in the board opened if the method requires it, and restored afterwards',
 'Ambient temperature and humidity recorded',
 'Readings taken between the conductor combinations required, each held for the time the specification states',
 'Readings entered on the record sheet and checked against the minimum',
 'Cable discharged after each test (the insulation stores charge) before leads are removed',
 'Links, connections and equipment restored; circuit left in the agreed state',
 'Record signed and witnessed as required',
]
for i, t in enumerate(steps, 1):
    r = 4 + i
    put(st, f'A{r}', i, base, border=box); put(st, f'B{r}', t, base, align=wrap, border=box)
    put(st, f'C{r}', None, inp, fi, border=box); put(st, f'D{r}', None, inp, fi, border=box)
    st.row_dimensions[r].height = 30
dc = DataValidation(type='list', formula1='"Yes,No,N/A"', allow_blank=True); st.add_data_validation(dc); dc.add(f'C5:C{4+len(steps)}')

# ---- Self-Test (known values, typed expected results) ------------------------------------------
chk.column_dimensions['A'].width = 56
for c in 'BCD': chk.column_dimensions[c].width = 16
put(chk, 'A1', 'Self-test', title)
put(chk, 'A2', 'Fixed test values run through the same formulas. If any row says FAIL, the sheet has been edited or damaged.', note)
for i, h in enumerate(['Check', 'Expected', 'Calculated', 'Result'], 1):
    c = chk.cell(4, i, h); c.font = head; c.fill = fh; c.border = box
tests = [
 ('Lowest of 500, 800, 1200 MOhm', 500, '=MIN(500,800,1200)'),
 ('Lowest 250 MOhm on a 400 m cable, in MOhm.km', 100, '=250*400/1000'),
 ('PI for 1 min = 500 and 10 min = 1500 MOhm', 3, '=1500/500'),
 ('DAR for 30 s = 400 and 60 s = 600 MOhm', 1.5, '=600/400'),
]
for i, (t, e, f) in enumerate(tests):
    r = 5 + i
    put(chk, f'A{r}', t, base, border=box); put(chk, f'B{r}', e, base, border=box)
    put(chk, f'C{r}', f, base, fo, border=box)
    put(chk, f'D{r}', f'=IF(ABS(B{r}-C{r})<0.000001,"OK","FAIL")', bold, border=box)
r = 5 + len(tests)
put(chk, f'A{r}', 'Record sheet logic: status of the lowest reading vs minimum (sample)', base, border=box)
put(chk, f'B{r}', 'FAIL', base, border=box)
put(chk, f'C{r}', '=IF(499.9>=500,"Pass","FAIL")', base, fo, border=box)
put(chk, f'D{r}', f'=IF(B{r}=C{r},"OK","FAIL")', bold, border=box)
put(chk, f'A{r+2}', 'Overall', bold)
put(chk, f'D{r+2}', f'=IF(COUNTIF(D5:D{r},"OK")={len(tests)+1},"ALL OK","CHECK")', bold)
for w in (s0, rec, pi, st, chk): w.sheet_properties.tabColor = INK
wb.save(OUT); print('saved', OUT)
