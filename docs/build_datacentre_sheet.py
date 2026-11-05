"""Free sheet for the data centre load calculation worked example. Fictional facility, formulas only, no code tables.
Run from the repo root: python3 docs/build_datacentre_sheet.py"""
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import FormulaRule

OUT = 'public/downloads/ohmetry-data-centre-load-example.xlsx'
F = 'Arial'; INK = '0E171E'
base = Font(name=F, size=10); bold = Font(name=F, size=10, bold=True)
title = Font(name=F, size=16, bold=True, color=INK); note = Font(name=F, size=9, color='666666')
head = Font(name=F, size=10, bold=True, color='FFFFFF'); inp = Font(name=F, size=10, color='0000FF')
fh = PatternFill('solid', fgColor=INK); fi = PatternFill('solid', fgColor='FFF9DB'); fo = PatternFill('solid', fgColor='EAF0FB')
thin = Side(style='thin', color='C9D2DA'); box = Border(left=thin, right=thin, top=thin, bottom=thin)
wrap = Alignment(wrap_text=True, vertical='top'); ctr = Alignment(horizontal='center', vertical='center', wrap_text=True)
GRN = PatternFill('solid', bgColor='CDEBD3'); RED = PatternFill('solid', bgColor='F8C9C4')

wb = Workbook()
s0 = wb.active; s0.title = 'Start Here'
inpS = wb.create_sheet('Inputs'); L = wb.create_sheet('Loads'); S = wb.create_sheet('Sizing'); P = wb.create_sheet('PDU Balance'); T = wb.create_sheet('Self-Test')
for w in (s0, inpS, L, S, P, T): w.sheet_view.showGridLines = False; w.sheet_properties.tabColor = INK

def put(sh, a, v, font=base, fill=None, fmt=None, align=None, border=None):
    c = sh[a]; c.value = v; c.font = font
    if fill: c.fill = fill
    if fmt: c.number_format = fmt
    if align: c.alignment = align
    if border: c.border = border
    return c
def hdr(sh, row, labels, widths=None):
    for i, h in enumerate(labels, 1):
        c = sh.cell(row, i, h); c.font = head; c.fill = fh; c.alignment = ctr; c.border = box
    if widths:
        for i, w in enumerate(widths, 1): sh.column_dimensions[chr(64 + i)].width = w

# ---- Start Here
s0.column_dimensions['A'].width = 3; s0.column_dimensions['B'].width = 100
put(s0, 'B2', 'Data centre load calculation: worked example', title)
rows = [
 ('What this is', 'A fictional data hall ("DC-1") worked from equipment list to UPS, transformer, generator and supply-current sizing, plus a phase-balance check on one PDU. It accompanies the page at ohmetry.com/data-centre-load-calculation-example/.'),
 ('This is not a real project', 'Every load, demand factor, efficiency, loading limit and equipment size is an illustrative assumption. Replace each yellow input with your own design criteria before using the method on a real design. Nothing here is for construction.'),
 ('How to use', '1. Inputs: set the system voltage, UPS, transformer and generator criteria. 2. Loads: edit the load list. 3. Sizing: read the results. 4. PDU Balance: enter circuits and phases. 5. Self-Test: confirm the formulas still give the reference values after you edit.'),
 ('Colour code', 'Yellow cells with blue text are inputs. Blue-grey cells are calculated. Do not type over calculated cells.'),
 ('Method', 'Real and reactive power are added separately (P and Q), and apparent power is the square root of the sum of squares. Adding kVA arithmetically is conservative and ignores the phase angle between loads. UPS-fed loads are counted at the UPS input (output divided by efficiency), not at their own rating.'),
 ('What it leaves out', 'Cable sizing and voltage drop, fault levels, protection coordination, earthing, harmonics and their effect on neutral and transformer ratings, motor starting, arc flash, and the cooling design. Standard transformer and generator sizes are editable lists on the Inputs sheet; use your supplier\'s ranges.'),
 ('Limits', 'Provided as is, without warranty. You are responsible for the design, the criteria and the results you rely on. Report an error to hello@ohmetry.com.'),
]
r = 4
for h, t in rows:
    put(s0, f'B{r}', h, bold); r += 1
    put(s0, f'B{r}', t, base, align=wrap); s0.row_dimensions[r].height = 15 * (1 + len(t) // 105); r += 2
put(s0, f'B{r}', 'Ohmetry | https://ohmetry.com | hello@ohmetry.com', note)

# ---- Inputs
inpS.column_dimensions['A'].width = 3; inpS.column_dimensions['B'].width = 52; inpS.column_dimensions['C'].width = 14; inpS.column_dimensions['D'].width = 44
for c, w in (('E', 16), ('F', 4), ('G', 18)): inpS.column_dimensions[c].width = w
put(inpS, 'B1', 'Inputs (all illustrative assumptions)', title)
items = [
 (4, 'System voltage, line to line (V)', 400, '0', 'Three-phase supply voltage'),
 (6, 'UPS efficiency at operating load', 0.95, '0.00', 'Assumed. Take from the UPS data sheet at your load'),
 (7, 'UPS maximum design loading', 0.80, '0.00', 'Design criterion. Normal load as a fraction of capacity'),
 (8, 'UPS module rating (kVA)', 250, '0', 'Assumed module size'),
 (9, 'Redundant UPS modules (the "+1")', 1, '0', 'Extra modules beyond those needed to carry the load'),
 (10, 'UPS input power factor', 0.99, '0.00', 'Assumed. Take from the UPS data sheet'),
 (12, 'Transformer growth margin', 0.20, '0.00', 'Design criterion'),
 (13, 'Transformers sharing the load (N)', 2, '0', 'Each must carry total / N'),
 (14, 'Redundant transformers', 1, '0', ''),
 (16, 'Generator margin', 0.15, '0.00', 'Design criterion. Does not cover motor starting'),
 (17, 'Generators sharing the load (N)', 2, '0', 'Each must carry total / N'),
 (18, 'Redundant generators', 1, '0', ''),
 (20, 'PDU line-to-neutral voltage (V)', 230, '0', 'For the phase-balance sheet'),
 (21, 'PDU circuit power factor', 0.95, '0.00', ''),
]
for rr, lab, val, fmt, hint in items:
    put(inpS, f'B{rr}', lab); put(inpS, f'C{rr}', val, inp, fi, fmt, border=box); put(inpS, f'D{rr}', hint, note)
put(inpS, 'B3', 'System', bold); put(inpS, 'B5', 'UPS', bold); put(inpS, 'B11', 'Transformers', bold); put(inpS, 'B15', 'Generators', bold); put(inpS, 'B19', 'PDU', bold)
put(inpS, 'E3', 'Transformer sizes (kVA)', bold); put(inpS, 'G3', 'Generator sizes (kVA)', bold)
for i, v in enumerate([630, 800, 1000, 1250, 1600, 2000, 2500]): put(inpS, f'E{4+i}', v, inp, fi, '0', border=box)
for i, v in enumerate([500, 630, 800, 1000, 1250, 1500, 1750, 2000, 2250, 2500]): put(inpS, f'G{4+i}', v, inp, fi, '0', border=box)
put(inpS, 'E12', 'Keep each list in ascending order. Edit to your supplier\'s range.', note)

# ---- Loads
hdr(L, 3, ['Ref', 'Load', 'Group', 'Qty', 'kW each', 'Connected kW', 'PF', 'Connected kVA', 'Demand factor', 'Demand kW', 'Demand kvar', 'Demand kVA', 'On UPS?', 'On generator?', 'kW at supply', 'kvar at supply'],
    (6, 40, 11, 7, 9, 12, 7, 12, 10, 11, 11, 11, 9, 11, 11, 11))
L.row_dimensions[3].height = 42
put(L, 'A1', 'Load list and demand', title)
loads = [
 ('Hall A: IT racks', 'IT', 40, 8, 0.95, 1.00, 'Yes', 'Yes'), ('Hall B: IT racks', 'IT', 30, 10, 0.95, 1.00, 'Yes', 'Yes'), ('Network and core room', 'IT', 1, 40, 0.95, 1.00, 'Yes', 'Yes'),
 ('Cooling: CRAH units', 'Cooling', 10, 6, 0.85, 1.00, 'No', 'Yes'), ('Cooling: chillers (2 of 3 run)', 'Cooling', 3, 75, 0.85, 0.67, 'No', 'Yes'), ('Chilled-water pumps (2 of 4 run)', 'Cooling', 4, 15, 0.85, 0.50, 'No', 'Yes'),
 ('Lighting', 'Building', 1, 15, 0.90, 0.80, 'No', 'Yes'), ('Small power and maintenance sockets', 'Building', 1, 25, 0.90, 0.40, 'No', 'No'), ('Building services (fire, security, BMS)', 'Building', 1, 20, 0.90, 1.00, 'No', 'Yes'),
]
R0, R1 = 4, 4 + len(loads) - 1
for i, (nm, g, q, k, pf, df, u, gn) in enumerate(loads):
    r = R0 + i
    put(L, f'A{r}', i + 1, base, border=box)
    for col, v, fmt in (('B', nm, None), ('C', g, None), ('D', q, '0'), ('E', k, '0.0'), ('G', pf, '0.00'), ('I', df, '0.00'), ('M', u, None), ('N', gn, None)):
        put(L, f'{col}{r}', v, inp, fi, fmt, border=box)
    put(L, f'F{r}', f'=D{r}*E{r}', base, fo, '#,##0.0', border=box)
    put(L, f'H{r}', f'=F{r}/G{r}', base, fo, '#,##0.0', border=box)
    put(L, f'J{r}', f'=F{r}*I{r}', base, fo, '#,##0.0', border=box)
    put(L, f'K{r}', f'=J{r}*TAN(ACOS(G{r}))', base, fo, '#,##0.0', border=box)
    put(L, f'L{r}', f'=SQRT(J{r}^2+K{r}^2)', base, fo, '#,##0.0', border=box)
    put(L, f'O{r}', f'=IF(M{r}="Yes",J{r}/Inputs!$C$6,J{r})', base, fo, '#,##0.0', border=box)
    put(L, f'P{r}', f'=IF(M{r}="Yes",O{r}*TAN(ACOS(Inputs!$C$10)),K{r})', base, fo, '#,##0.0', border=box)
rt = R1 + 1
put(L, f'B{rt}', 'Total', bold)
for col in 'FHJKOP': put(L, f'{col}{rt}', f'=SUM({col}{R0}:{col}{R1})', bold, fo, '#,##0.0', border=box)
put(L, f'L{rt}', f'=SQRT(J{rt}^2+K{rt}^2)', bold, fo, '#,##0.0', border=box)
put(L, f'B{rt+2}', 'Connected kVA is the arithmetic sum of the rows (conservative). Demand kVA is from the total demand kW and kvar. Total demand kvar adds the rows\' reactive power; UPS-fed rows are counted at the UPS input in the last two columns.', note)
dv = DataValidation(type='list', formula1='"Yes,No"', allow_blank=False); L.add_data_validation(dv); dv.add(f'M{R0}:N{R1}')
dp = DataValidation(type='decimal', operator='between', formula1='0.05', formula2='1', showErrorMessage=True, errorTitle='Power factor', error='Enter a power factor between 0.05 and 1.')
L.add_data_validation(dp); dp.add(f'G{R0}:G{R1}')
L.freeze_panes = 'C4'

# ---- Sizing
S.column_dimensions['A'].width = 3; S.column_dimensions['B'].width = 58; S.column_dimensions['C'].width = 16; S.column_dimensions['D'].width = 56
put(S, 'B1', 'Sizing results', title)
def sec(r, t): put(S, f'B{r}', t, Font(name=F, size=11, bold=True, color=INK))
def line(r, lab, f, fmt, hint=''):
    put(S, f'B{r}', lab); put(S, f'C{r}', f, bold, fo, fmt, border=box); put(S, f'D{r}', hint, note)
Lm = lambda c: f'Loads!{c}{R0}:{c}{R1}'
sec(3, 'UPS')
line(5, 'UPS output demand (kW)', f'=SUMIF({Lm("M")},"Yes",{Lm("J")})', '#,##0.0')
line(6, 'UPS output demand (kvar)', f'=SUMIF({Lm("M")},"Yes",{Lm("K")})', '#,##0.0')
line(7, 'UPS output demand (kVA)', '=SQRT(C5^2+C6^2)', '#,##0.0')
line(8, 'UPS capacity needed at the design loading limit (kVA)', '=C7/Inputs!C7', '#,##0.0', 'Output kVA divided by the maximum design loading')
line(9, 'Modules needed to carry the load (N)', '=ROUNDUP(C8/Inputs!C8,0)', '0')
line(10, 'Modules installed (N + redundant)', '=C9+Inputs!C9', '0')
line(11, 'Installed capacity (kVA)', '=C10*Inputs!C8', '#,##0')
line(12, 'Loading with all modules in service', '=C7/C11', '0.0%')
line(13, 'Loading with the redundant module out', '=C7/(C9*Inputs!C8)', '0.0%')
line(14, 'Check against the loading limit with one module out', '=IF(C13<=Inputs!C7,"OK","Over limit")', '@')
line(15, 'UPS input power (kW)', '=C5/Inputs!C6', '#,##0.0', 'Output kW divided by efficiency')
line(16, 'UPS input apparent power (kVA)', '=C15/Inputs!C10', '#,##0.0')
line(17, 'UPS losses (kW)', '=C15-C5', '#,##0.0', 'Becomes heat the cooling must remove')
sec(19, 'Load at the supply (UPS-fed loads counted at the UPS input)')
line(20, 'Real power (kW)', f'=Loads!O{rt}', '#,##0.0'); line(21, 'Reactive power (kvar)', f'=Loads!P{rt}', '#,##0.0')
line(22, 'Apparent power (kVA)', '=SQRT(C20^2+C21^2)', '#,##0.0'); line(23, 'Power factor at the supply', '=C20/C22', '0.000')
sec(25, 'Transformers')
line(26, 'Required total with growth margin (kVA)', '=C22*(1+Inputs!C12)', '#,##0.0')
line(27, 'Required per transformer, N sharing (kVA)', '=C26/Inputs!C13', '#,##0.0')
line(28, 'Selected standard size per transformer (kVA)', '=IFERROR(INDEX(Inputs!E4:E10,COUNTIF(Inputs!E4:E10,"<"&C27)+1),"above list")', '#,##0', 'Next size at or above the requirement')
line(29, 'Transformers installed', '=Inputs!C13+Inputs!C14', '0')
line(30, 'Loading with N in service (no growth margin)', '=C22/(Inputs!C13*C28)', '0.0%')
line(31, 'Full-load supply current (A)', '=C22*1000/(SQRT(3)*Inputs!C4)', '#,##0', 'Apparent power / (square root of 3 x system voltage)')
line(32, 'Rated current per transformer (A)', '=C28*1000/(SQRT(3)*Inputs!C4)', '#,##0')
sec(34, 'Generators (loads marked "On generator" in Loads)')
line(35, 'Essential load (kW)', f'=SUMIF({Lm("N")},"Yes",{Lm("O")})', '#,##0.0'); line(36, 'Essential load (kvar)', f'=SUMIF({Lm("N")},"Yes",{Lm("P")})', '#,##0.0')
line(37, 'Essential load (kVA)', '=SQRT(C35^2+C36^2)', '#,##0.0')
line(38, 'Required total with margin (kVA)', '=C37*(1+Inputs!C16)', '#,##0.0', 'Margin is an input. It does not cover motor starting')
line(39, 'Required per generator, N sharing (kVA)', '=C38/Inputs!C17', '#,##0.0')
line(40, 'Selected standard size per generator (kVA)', '=IFERROR(INDEX(Inputs!G4:G13,COUNTIF(Inputs!G4:G13,"<"&C39)+1),"above list")', '#,##0')
line(41, 'Generators installed', '=Inputs!C17+Inputs!C18', '0')
line(42, 'Loading with N in service (no margin)', '=C37/(Inputs!C17*C40)', '0.0%')
put(S, 'B44', 'Generator ratings (standby, prime) and the derating for altitude, temperature and non-linear load come from the manufacturer. This sheet gives a first sizing, not a specification.', note)

# ---- PDU balance
hdr(P, 4, ['Circuit', 'Load (kW)', 'PF', 'kVA', 'Current (A)', 'Phase'], (10, 12, 8, 10, 12, 8))
put(P, 'A1', 'PDU phase balance', title)
put(P, 'A2', 'Single-phase circuits on one PDU. The phases are deliberately unbalanced to show the effect on the neutral.', note)
pdu = [(4.2, 'L1'), (3.8, 'L2'), (5.1, 'L3'), (4.6, 'L1'), (3.9, 'L2'), (4.4, 'L3'), (5.0, 'L1'), (4.1, 'L2'), (4.8, 'L3'), (3.6, 'L1'), (4.3, 'L1'), (4.9, 'L3')]
for i, (kw, ph) in enumerate(pdu):
    r = 5 + i
    put(P, f'A{r}', i + 1, base, border=box); put(P, f'B{r}', kw, inp, fi, '0.0', border=box); put(P, f'C{r}', '=Inputs!$C$21', base, fo, '0.00', border=box)
    put(P, f'D{r}', f'=B{r}/C{r}', base, fo, '0.00', border=box); put(P, f'E{r}', f'=D{r}*1000/Inputs!$C$20', base, fo, '0.0', border=box); put(P, f'F{r}', ph, inp, fi, border=box)
dpv = DataValidation(type='list', formula1='"L1,L2,L3"', allow_blank=False); P.add_data_validation(dpv); dpv.add('F5:F16')
for c, w in (('H', 26), ('I', 12), ('J', 12), ('K', 12)): P.column_dimensions[c].width = w
for j, h in enumerate(['', 'L1', 'L2', 'L3']): 
    if j: put(P, f'{"HIJK"[j]}4', h, head, fh, align=ctr, border=box)
put(P, 'H5', 'Phase load (kVA)'); put(P, 'H6', 'Phase current (A)')
for j, ph in enumerate(['L1', 'L2', 'L3']):
    col = 'IJK'[j]
    put(P, f'{col}5', f'=SUMIF($F$5:$F$16,"{ph}",$D$5:$D$16)', bold, fo, '0.00', border=box)
    put(P, f'{col}6', f'={col}5*1000/Inputs!$C$20', bold, fo, '0.0', border=box)
put(P, 'H8', 'Average phase current (A)'); put(P, 'I8', '=AVERAGE(I6:K6)', bold, fo, '0.0', border=box)
put(P, 'H9', 'Largest deviation from the average'); put(P, 'I9', '=MAX(ABS(I6-I8),ABS(J6-I8),ABS(K6-I8))/I8', bold, fo, '0.0%', border=box)
put(P, 'H10', 'Neutral current from the unbalance (A)'); put(P, 'I10', '=SQRT(MAX(0,I6^2+J6^2+K6^2-I6*J6-J6*K6-K6*I6))', bold, fo, '0.0', border=box)
put(P, 'H12', 'Neutral current assumes the same power factor on every phase and no triplen harmonics. See ohmetry.com/neutral-conductor-sizing-calculator/.', note)

# ---- Self-test: expected values typed from an independent Python calculation
hdr(T, 4, ['Check', 'Expected', 'Sheet', 'Result'], (62, 14, 14, 10))
put(T, 'A1', 'Self-test', title)
put(T, 'A2', 'Reference values for the delivered inputs, calculated separately. They only apply while the inputs are unchanged.', note)
tests = [
 ('Total connected load (kW)', 1065.0, '=Loads!F13', 0.01), ('Total demand load (kW)', 942.75, '=Loads!J13', 0.01), ('Total demand load (kVA)', 1018.89, '=Loads!L13', 0.01),
 ('UPS output demand (kVA)', 694.74, '=Sizing!C7', 0.01), ('UPS capacity needed (kVA)', 868.42, '=Sizing!C8', 0.01), ('UPS modules installed', 5, '=Sizing!C10', 0.001),
 ('UPS losses (kW)', 34.74, '=Sizing!C17', 0.01), ('Supply apparent power (kVA)', 1013.70, '=Sizing!C22', 0.01), ('Transformer size selected (kVA)', 630, '=Sizing!C28', 0.001),
 ('Supply full-load current (A)', 1463.15, '=Sizing!C31', 0.01), ('Generator essential load (kVA)', 1002.78, '=Sizing!C37', 0.01), ('Generator size selected (kVA)', 630, '=Sizing!C40', 0.001),
 ('PDU L1 current (A)', 99.31, "='PDU Balance'!I6", 0.01), ('PDU neutral current (A)', 40.81, "='PDU Balance'!I10", 0.01),
]
for i, (lab, exp, f, tol) in enumerate(tests):
    r = 5 + i
    put(T, f'A{r}', lab, base, border=box); put(T, f'B{r}', exp, base, border=box); put(T, f'C{r}', f, base, fo, '0.00', border=box)
    put(T, f'D{r}', f'=IF(ABS(B{r}-C{r})<={tol},"OK","CHECK")', bold, border=box)
rr = 5 + len(tests) + 1
put(T, f'A{rr}', 'Overall', bold); put(T, f'D{rr}', f'=IF(COUNTIF(D5:D{rr-2},"OK")={len(tests)},"ALL OK","CHECK")', bold)
T.conditional_formatting.add(f'D5:D{rr}', FormulaRule(formula=['OR(D5="OK",D5="ALL OK")'], fill=GRN))
T.conditional_formatting.add(f'D5:D{rr}', FormulaRule(formula=['D5="CHECK"'], fill=RED))
wb.save(OUT); print('saved', OUT)
