# Internal link additions (approved and implemented 2026-11-04; not yet on main)

Status: all 32 rows implemented. Rows 4 and 17 were done as in-text links, and the Protection hub also gets a Guides card for the lightning guide.

Basis: docs/seo/link-graph.md (built site, 2026-11-04). Each addition is one extra item in the source page's existing "Related" list, with the anchor text shown, unless the "Where" column says otherwise. No sitewide or keyword-stuffed links. Hubs, the home page and legal pages are left alone: they are linked from the nav and footer on purpose.

| # | Source page | Link to | Anchor text | Why it is relevant | Where |
|---|---|---|---|---|---|
| 1 | /earth-resistance-calculator/ | /insulation-resistance-test-megger/ | Insulation resistance (megger) test and record sheet | Both are test-and-record tasks on an installation | Related |
| 2 | /earth-conductor-size-calculator/ | /insulation-resistance-test-megger/ | Insulation resistance (megger) test and record sheet | Earthing and insulation checks belong to the same commissioning stage | Related |
| 3 | /how-to-size-a-cable/ | /insulation-resistance-test-megger/ | Insulation resistance (megger) test | The step after installing the sized cable | Related |
| 4 | /insulation-resistance-test-megger/ | /what-happens-when-lightning-strikes-a-building/ | surge protective devices | The megger page says to disconnect SPDs before testing; the guide explains what they are | In-text link on the existing sentence |
| 5 | /cable-size-calculator/ | /neutral-conductor-sizing-calculator/ | Neutral conductor current | Neutral current feeds the cable size check on four-wire circuits | Related |
| 6 | /wire-size-calculator/ | /neutral-conductor-sizing-calculator/ | Neutral conductor current | Same | Related |
| 7 | /three-phase-power-calculator/ | /neutral-conductor-sizing-calculator/ | Neutral current in a three-phase circuit | Unbalance and neutral current follow from phase currents | Related |
| 8 | /how-to-size-a-cable/ | /neutral-conductor-sizing-calculator/ | Neutral conductor current | Four-wire circuits need the neutral checked | Related |
| 9 | /cable-derating-factor-chart/ | /neutral-conductor-sizing-calculator/ | Neutral conductor current | Harmonic neutral current affects conductor counting and derating | Related |
| 10 | /ev-charger-wire-size-calculator/ | /conduit-fill-calculator/ | Conduit fill calculator | The EV feeder usually runs in conduit | Related |
| 11 | /solar-wire-size-calculator/ | /conduit-fill-calculator/ | Conduit fill calculator | PV circuits are run in conduit | Related |
| 12 | /hp-to-amps-calculator/ | /hp-to-kw-chart/ | HP to kW chart | Same conversion, tabulated | Related |
| 13 | /motor-circuit-calculator/ | /hp-to-kw-chart/ | HP to kW chart | Motor ratings are quoted in HP and kW | Related |
| 14 | /kva-to-kw-calculator/ | /power-factor-correction-chart/ | Power factor correction chart | Power factor is the variable between kVA and kW | Related |
| 15 | /three-phase-power-calculator/ | /power-factor-correction-chart/ | Power factor correction chart | Same | Related |
| 16 | /earth-resistance-calculator/ | /what-happens-when-lightning-strikes-a-building/ | What happens when lightning strikes a building | Earth resistance and lightning paths | Related |
| 17 | /protection/ | /what-happens-when-lightning-strikes-a-building/ | Lightning and earthing guide | The guide is in the Protection hub but not linked from its intro text | Hub intro sentence |
| 18 | /how-to-size-a-circuit-breaker/ | /ev-charger-wire-size-calculator/ | EV charger wire size calculator | The page has an EV worked example | Related |
| 19 | /breaker-size-calculator/ | /ev-charger-wire-size-calculator/ | EV charger wire size calculator | The page has an EV workflow section | Related |
| 20 | /wire-size-calculator/ | /ev-charger-wire-size-calculator/ | EV charger wire size calculator | EV circuits are a common wire-size case | Related |
| 21 | /kva-to-amps-calculator/ | /generator-size-calculator/ | Generator size calculator | Generators are rated in kVA | Related |
| 22 | /inverter-size-calculator/ | /generator-size-calculator/ | Generator size calculator | Alternative backup supply | Related |
| 23 | /motor-circuit-calculator/ | /generator-size-calculator/ | Generator size calculator | Motor starting current drives generator sizing | Related |
| 24 | /idmt-relay-calculator/ | /relay-setting-checklist/ | Relay setting checklist | The checklist uses this calculator's curves | Related |
| 25 | /ct-burden-calculator/ | /relay-setting-checklist/ | Relay setting checklist | CT check is step 2 of the checklist | Related |
| 26 | /transformer-full-load-current-calculator/ | /relay-setting-checklist/ | Relay setting checklist | The checklist's worked example is a transformer feeder | Related |
| 27 | /transformer-full-load-current-calculator/ | /transformer-short-circuit-current-chart/ | Transformer short-circuit current chart | Same transformer data | Related |
| 28 | /cable-fault-current-calculator/ | /transformer-short-circuit-current-chart/ | Transformer short-circuit current chart | Source fault level for the cable calculation | Related |
| 29 | /amps-to-watts-calculator/ | /watts-to-amps-chart/ | Watts to amps chart | Inverse conversion, tabulated | Related |
| 30 | /breaker-amps-to-watts-chart/ | /watts-to-amps-chart/ | Watts to amps chart | Sibling chart | Related |
| 31 | /voltage-drop-formula/ | /wire-resistance-chart/ | Wire resistance chart | Resistance values used in the formula | Related |
| 32 | /wire-size-by-distance-chart/ | /wire-resistance-chart/ | Wire resistance chart | Same | Related |

Not touched: / , /about/ , /charts/ , /solar-ev/ , /electrical/ , /disclaimer/ , /methodology/ , /privacy/ (hubs, home and legal pages are linked from the nav and footer).

Rollback: each change is one line in one file. `git revert` the commit.
