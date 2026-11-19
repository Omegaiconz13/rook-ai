# Contract: Risk Engine (`src/shared/risk.ts`)

Pure TypeScript, no I/O, no dates from the clock unless passed in, identical in
browser and Worker. The same function backs `POST /api/risk/check` and the client
preview, so a verdict cannot differ between the two.

```ts
export function checkPlan(input: {
  plan: TradePlan
  limits: RiskLimits
  account: Account
  session: { state: 'pre' | 'open' | 'close' | 'closed'; nowEt: string }
  history: { symbol: string; sessionDate: string }[]   // confirmed tickets today
}): GateVerdict
```

## Evaluation order

Rules are checked in order; the **first failure wins** and is the only rule reported
in `ruleId`. Approved verdicts carry the size and the deciding limit.

| Rule | Check | Block message (shape) |
|---|---|---|
| `R-01` | `account.killSwitch === false` | "Kill switch is on. Reset it before checking plans." |
| `R-02` | `session.state === 'open'` and inside the entry window | "Outside the entry window (09:35–11:30 New York)." |
| `R-03` | `account.tradesToday < limits.maxTradesPerDay` | "Trade cap reached: 3 of 3 taken today." |
| `R-04` | `−account.dayPnlCents < dailyLossCents` | "Daily loss limit used: $162 against a $150 limit." |
| `R-05` | `plan.stopCents > 0` | "No stop on this plan. A trade without a stop is not checked." |
| `R-06` | `plan.stopCents < plan.entryCents` | "Stop 364.18 is at or above the entry for a long." |
| `R-07` | `riskPerShareCents = entry − stop > 0` | "Stop is too close: risk per share is zero." |
| `R-08` | `floor(maxRiskCents / riskPerShareCents) ≥ 1` | "Stop too wide: risking $50 allows 0 shares at $14.18 per share." |
| `R-09` | position cap: `floor(equity × positionCapPct / 100 / entry) ≥ 1` | "Position cap allows 0 shares at this price." |
| `R-10` | size after caps ≥ 1 | "Cash buffer leaves no room for one share." |
| `R-11` | `plan.targetCents > plan.entryCents` | "Target 358.00 is below the entry; there is no reward to measure." |
| `R-12` | `rewardRisk ≥ limits.minRewardRisk` | "Reward:risk is 1.00, below your 1.50 minimum." |
| `R-13` | no confirmed ticket for this symbol today | "A ticket for TSLA was already confirmed today." |
| `R-14` | `riskUsedCents + size × riskPerShare ≤ dailyLossCents` | "This trade would put today's risk at $168 against a $150 limit." |
| `R-15` | `nowEt < flatBy` | "Past your flat-by time (15:55). No new entries." |

## Sizing (runs after R-01..R-11 pass)

```
riskShares   = floor(maxRiskCents / riskPerShareCents)
capShares    = floor(equityCents × positionCapPct / 100 / entryCents)
cashShares   = floor(equityCents × (100 − cashBufferPct) / 100 / entryCents)
size         = min(riskShares, capShares, cashShares)
decidingLimit= 'risk-per-trade' | 'position-cap' | 'cash-buffer'   // argmin, first on ties
lossAtStop   = size × riskPerShareCents
rewardRisk   = (targetCents − entryCents) / riskPerShareCents
```

Integer maths only for share counts; `rewardRisk` rounded to 2 dp for display and
compared against `minRewardRisk` unrounded.

## Worked examples (fixtures the tests must reproduce)

Limits: equity $5,000 · risk 1% ($50) · daily loss 3% ($150) · position cap 50%
($2,500) · cash buffer 10% ($4,500) · max 3 trades · min R:R 1.50 · entry window
09:35–11:30 · flat-by 15:55. Account: flat day, no tickets, kill switch off.
Plan: long TSLA at 364.18, stop 358.32 → risk per share 5.86.

### A — approved at 2R

Target 375.90 (R = 2.00).

```
riskShares = floor(5000 / 5.86) = 8   ($46.88)
capShares  = floor(2500 / 364.18) = 6 ($2,185.08)
cashShares = floor(4500 / 364.18) = 12
size = 6, decidingLimit = 'position-cap'
lossAtStop = 6 × 5.86 = $35.16
R-14: 0 + 35.16 ≤ 150 ✓      R-12: 2.00 ≥ 1.50 ✓
→ approved, 6 shares
```

### B — blocked at 1R

Target 370.04 (R = 1.00).

```
R-01..R-11 pass, size 6 as above
R-12: 1.00 < 1.50 → blocked, ruleId 'R-12'
→ "Reward:risk is 1.00, below your 1.50 minimum."
```

### C — stop too wide

Entry 364.18, stop 350.00 → risk per share 14.18, target 375.90.

```
R-08: floor(50 / 14.18) = 3 ≥ 1 → passes sizing
size = min(3, 6, 12) = 3, lossAtStop = $42.54
R-12: 11.72 / 14.18 = 0.83 < 1.50 → blocked 'R-12'
```

### D — daily loss already used

`dayPnlCents = −16200` (−$162), limit $150.

```
R-04: 162 ≥ 150 → blocked 'R-04'
```

### E — kill switch

`account.killSwitch = true` → blocked `R-01`, before any sizing.

### F — outside the window

`session.nowEt = '11:31'` → blocked `R-02`. `nowEt = '16:10'` also `R-02`
(`state: 'closed'`).

## Invariants (asserted in `risk.test.ts`)

1. `verdict === 'blocked'` implies `size === null` and `ruleId !== null`.
2. `verdict === 'approved'` implies `size ≥ 1` and `size × riskPerShare ≤ maxRiskCents`.
3. Approved `lossAtStopCents ≤ dailyLossCents − riskUsedCents`.
4. `rewardRisk` is never displayed at more than 2 dp.
5. Identical inputs produce identical output, including `ruleId`, `size` and
   `decidingLimit` — no `Date.now()` inside the function; `checkedAt` is passed in
   by the caller (server route stamps it).
6. Setting `account.killSwitch` only ever moves a verdict from approved to blocked,
   never the reverse.

## Forbidden

- Reading `process.env`, `fetch`, `localStorage` or the clock inside the module.
- Consulting `SeatNote`, `Memo` or model output.
- Returning a size larger than any single cap.
- Throwing on malformed input: the Worker validates first and answers `422`; the
  engine may assume a well-formed `TradePlan` (documented in `data-model.md`).
