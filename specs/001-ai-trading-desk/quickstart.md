# Quickstart: validate the AI Trading Desk

Runnable checks that prove the feature works end to end. No API keys, no network.
Implementation details live in `tasks.md`; shapes live in `data-model.md` and
`contracts/`.

## Prerequisites

- Bun installed (lockfile: `bun.lock`)
- No `.env` file required; the demo uses seeded fixtures
- Repository root: the workspace root containing `package.json`

## Setup

```bash
bun install
bun run typecheck          # expect: exit 0, no output
bun test                   # expect: all suites pass
bun run build              # expect: vite build + postbuild succeed
bun run dev                # Vite + Worker on http://localhost:3000
```

The dev server must bind `0.0.0.0` for the cloud preview. If port 3000 is taken,
stop the previous process; do not switch ports.

## Scenario V1 — demo runs with no network

1. Stop the network adapter or use a browser profile in offline mode; reload `/`.
2. Open `/app`.

**Expected**: Today's desk renders seeded setups; each row carries `SAMPLE DATA`;
no console errors from failed `fetch` to a provider. `bun run build` output contains
no provider URL.

## Scenario V2 — the gate approves the documented example

On `/app/risk`, set equity $5,000, risk 1%, daily loss 3%, position cap 50%, cash
buffer 10%, max trades 3, min R:R 1.50, window 09:35–11:30. Check a long at 364.18
with stop 358.32 and target 375.90.

**Expected**: APPROVED · 6 shares · max loss $35.16 · R:R 2.00 · size decided by
`position-cap`. Copy the reason: "Approved 6 shares; position cap set the size."

## Scenario V3 — the gate blocks at 1R

Same plan, target 370.04.

**Expected**: BLOCKED · rule `R-12` · "Reward:risk is 1.00, below your 1.50
minimum." No size shown. Journal gains a row with `took = false`.

## Scenario V4 — kill switch and daily loss

1. Toggle the kill switch, check any plan: BLOCKED `R-01`.
2. Reset it, set today's P&L to −$162, check again: BLOCKED `R-04`.

## Scenario V5 — browser and Worker agree

```bash
curl -s http://localhost:3000/api/health
curl -s "http://localhost:3000/api/market/bars?symbol=TSLA" | head -c 300
curl -s -X POST http://localhost:3000/api/risk/check \
  -H 'content-type: application/json' \
  -d '{"plan":{"symbol":"TSLA","direction":"long","entryCents":36418,"stopCents":35832,"targetCents":37590,"riskPerShareCents":586,"rMultiple":2,"id":"t1","status":"draft","provenance":"seed"},"limits":{"equityCents":500000,"riskPerTradePct":1,"dailyLossPct":3,"positionCapPct":50,"cashBufferPct":10,"maxTradesPerDay":3,"minRewardRisk":1.5,"entryWindowStart":"09:35","entryWindowEnd":"11:30","flatBy":"15:55"},"account":{"equityCents":500000,"dayPnlCents":0,"tradesToday":0,"riskUsedCents":0,"killSwitch":false,"sessionDate":"2026-11-19"},"session":{"state":"open","nowEt":"10:12"},"history":[]}'
```

**Expected**: identical `verdict`, `size`, `decidingLimit` and `ruleId` to what the
UI showed for the same inputs. Bars response has integer-cent prices, 78 bars for a
full session, `source: "seed"`.

## Scenario V6 — Time Machine is reproducible

Open `/app/setup/TSLA`, run the Time Machine twice with seed 19.

**Expected**: identical percentages both times; they sum to 100 ± 0.2; the seed is
displayed and stored with the result. Change the seed and the numbers move; the
verdict line changes tone only when the sample is large enough.

## Scenario V7 — the room cannot overrule the block

Send the 1R plan (blocked in V3) to `/app/room`.

**Expected**: eight seat cards render in order; the gate card shows `R-12`; the memo
scores 1–2 and reads PASS; the counter-case is present; no paper-ticket button
appears.

Then send the 2R plan on a live setup (the 20-day reclaim, `TSLA-reclaim`): the memo
scores 5, reads TAKE, and offers a **paper** ticket only. A plan whose setup seat
blocks — an opening range that expired before a trigger, say — reads PASS even at
4/5, and the chief names the setup seat as the stop.

## Scenario V8 — paper ticket and journal

1. Confirm the paper ticket from V7. The dialog must echo symbol, size, entry, stop,
   target and max loss.
2. Open `/app/journal`.

**Expected**: two rows today (one blocked, one approved), the taken row shows
`r_planned = 2.00`, the blocked row `size = 0`. "Export CSV" downloads a file whose
header matches the column list in `data-model.md` exactly.

## Scenario V9 — regression gates

```bash
bun run typecheck && bun test && bun run build
```

**Expected**: all three exit 0. Then grep the built assets for secrets:

```bash
grep -RInE "api[_-]?key|secret|ALPACA|FMP_" dist/ || echo "no secrets in bundle"
```

## Failure triage

| Symptom | First thing to check |
|---|---|
| Verdict differs between UI and curl | `session.nowEt` / `account.sessionDate` differ; the engine must not read the clock |
| Setup list empty | universe loaded but fixture date mismatch — check `date` query and seeded session date |
| `403` on the preview hostname | Vite host allowlist, not the app; use `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` |
| Journal empty after a check | the verdict was not appended — check `desk:v1:journal` in devtools |
| Simulator numbers change on reload | seed not persisted — check `desk:v1:seed` |

## Recorded run — 19 Nov 2026

Run in this workspace against the Vite dev server (Host header
`pv-344e6777db38-22cbaaa0-db2e-43b0-809f-f86d9da54d40.style.dev`) and the
modules directly with `bun`. No browser was driven, so anything that needs a
click is marked **not checked**.

| Scenario | Result | Evidence |
|---|---|---|
| V1 offline reload | Pass in a browser at 1440×900 and 390×844: every screen renders from the bundled dataset, no failed data request. The only external request is Google Fonts, which degrades to system sans | DevTools network log; `grep` over `dist/client` |
| V2 approved 2R | Pass | `approved 6 position-cap 3516 2.00` from `POST /api/risk/check` and the local module |
| V3 blocked at 1R | Pass | `blocked R-12 Reward:risk is 1.00, below your 1.50 minimum.` |
| V4 kill switch | Pass | `blocked R-01` |
| V5 browser/Worker agree | Pass | same call in `bun` and over HTTP: `approved 6 position-cap 3516 2.00` |
| V6 Time Machine | Pass | seed 19 twice → `17.8 / 47.3 / 34.9, avgR 0.04` |
| V7 room cannot overrule | Pass | 8 notes in order, `PASS 2/5`, gate `R-12`, trader: "No card. The gate blocked the plan…" |
| V8 ticket → journal → CSV | Pass in a browser: dialog echoes all six numbers, confirm writes the row, Settle records `-1.00R` (stopped out, filled 10:15 NY), Export CSV produces `rook-journal-2026-11-19.csv` with the 17-column header and one row ending `2.00,-1` | Browser run plus `src/shared/journal.test.ts`, `src/shared/ticket.test.ts` |
| V9 gates | Pass | `typecheck` 0, `bun test` 120 pass / 0 fail, `build` 0; secret scan over `dist/client` found no keys |

The browser pass also covered `/styleguide` (verdict cards, seat card, chart),
the drawn gate art on the landing page, and the mobile app nav at 390px.

Defects found and fixed during that pass:

- the hero CTA clipped the trade card's last line; the card now carries `pb-12`
- the drawn gate card overflowed its 4:3 frame (first and last rules cut); it now
  shows six compact rows ending in the red `R-12`
- the setup plan levels were squeezed into four narrow columns; now a 2×2 grid
- the journal table was wider than its panel, hiding the Settle button; min width
  reduced from 980 to 860 and padding tightened
- a ticket confirmed at the 10:12 demo clock replayed from 09:30 and filled in the
  past; fills now start at 10:12 (15:12Z) or at confirmation time when live
- the hero image ran full-bleed behind the lede, hurting legibility; a left-to-right
  scrim was added so the copy stays readable and the charts show on the right

Still unverified: hover readouts on the chart, the kill-switch toast, keyboard
focus order (only the focus trap was exercised), and any browser other than
Chromium.
