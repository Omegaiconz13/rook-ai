# The gate

`checkPlan()` in `src/shared/risk.ts` is a pure function. Same inputs, same verdict,
no clock of its own, no network, no model. The browser calls it and `POST
/api/risk/check` calls it — the same code, so a verdict can be reproduced outside the
page.

## Inputs

```ts
type CheckInput = {
  plan: {
    id: string
    symbol: string                 // uppercase, 1–5 letters
    direction: 'long'              // long only, for now
    entryCents: number
    stopCents: number
    targetCents: number
    riskPerShareCents: number
    rMultiple: number
    setupId: string | null
    status: 'draft' | 'checked' | 'approved' | 'blocked' | 'ticketed'
    provenance: 'seed' | 'live'
  }
  limits: {
    equityCents: number
    riskPerTradePct: number
    dailyLossPct: number
    positionCapPct: number
    cashBufferPct: number
    maxTradesPerDay: number
    minRewardRisk: number
    entryWindowStart: string       // "09:35"
    entryWindowEnd: string         // "11:30"
    flatBy: string                 // "15:55"
  }
  account: {
    equityCents: number
    dayPnlCents: number
    tradesToday: number
    riskUsedCents: number
    killSwitch: boolean
    sessionDate: string
  }
  session: { state: 'pre' | 'open' | 'close' | 'closed'; nowEt: string }
  history: { symbol: string; sessionDate: string }[]
}
```

All money is integer cents. All percentages are numbers, not fractions: `1` means 1%.

## The fifteen rules

Evaluated in order. The first one that fails becomes the verdict, so the rule id
alone explains why a plan was stopped.

| Rule | Blocks when |
|---|---|
| R-01 | The kill switch is on |
| R-02 | The market is not open, or the time is outside the entry window |
| R-03 | Today's trade count already reached the cap |
| R-04 | The day's loss has used the daily limit |
| R-05 | No stop is attached |
| R-06 | The stop is not below the entry |
| R-07 | Risk per share is not positive |
| R-08 | The stop is far enough away that even one share risks more than the per-trade budget |
| R-09 | The position cap does not allow one share |
| R-10 | Cash after the buffer does not allow one share |
| R-11 | The target is not above the entry |
| R-12 | Reward:risk is below the reader's minimum |
| R-13 | A ticket for this symbol already exists today |
| R-14 | Today's risk plus this trade exceeds the daily limit |
| R-15 | It is at or after the flat-by time |

R-08 and R-15 are the two refusals that read as unfair, and both are arithmetic: a
wider stop needs a smaller size, and a flat-by time is a time.

## The verdict

```ts
type GateVerdict = {
  planId: string
  verdict: 'approved' | 'blocked'
  ruleId: 'R-01' | … | 'R-15' | null
  reason: string                          // one sentence, with the numbers in it
  size: number | null                     // whole shares, null when blocked
  decidingLimit: 'risk-per-trade' | 'position-cap' | 'cash-buffer' | null
  lossAtStopCents: number | null
  rewardRisk: number
  checkedAt?: string                      // added by the HTTP route only
}
```

A blocked verdict always carries a non-null `ruleId` and a `reason` that names what
would have to change. A verdict never says "unsafe" without saying why.

## Over HTTP

```bash
curl -s http://localhost:5333/api/risk/check \
  -H 'content-type: application/json' \
  -d '{
    "plan":   {"id":"p1","symbol":"TSLA","direction":"long","entryCents":25000,
               "stopCents":24700,"targetCents":25900,"riskPerShareCents":300,
               "rMultiple":3,"setupId":"TSLA-orb","status":"checked","provenance":"seed"},
    "limits": {"equityCents":500000,"riskPerTradePct":1,"dailyLossPct":3,
               "positionCapPct":50,"cashBufferPct":10,"maxTradesPerDay":3,
               "minRewardRisk":1.5,"entryWindowStart":"09:35",
               "entryWindowEnd":"11:30","flatBy":"15:55"},
    "account":{"equityCents":500000,"dayPnlCents":0,"tradesToday":0,
               "riskUsedCents":0,"killSwitch":false,"sessionDate":"2026-11-24"},
    "session":{"state":"open","nowEt":"10:05"},
    "history":[]
  }'
```

```json
{"ok":true,"data":{"planId":"p1","verdict":"approved","ruleId":null,
 "reason":"Approved 10 shares; position cap set the size.",
 "size":10,"decidingLimit":"position-cap","lossAtStopCents":3000,"rewardRisk":3,
 "checkedAt":"2026-11-24T15:05:00.000Z"}}
```

Refusals use the same envelope with HTTP 200 — a blocked verdict is a successful
check, not a transport error. The same plan with a $190.00 stop instead of $247.00
comes back:

```json
{"ok":true,"data":{"planId":"p2","verdict":"blocked","ruleId":"R-08",
 "reason":"Stop too wide: risking $50.00 allows 0 shares at $60.00 per share.",
 "size":null,"decidingLimit":null,"lossAtStopCents":null,"rewardRisk":3}}
```

`size`, `decidingLimit` and `lossAtStopCents` are null on a refusal, because nothing
was sized. `400` means the body was not JSON, `422` means a field was missing or not
numeric.

## What the gate does not decide

Whether the setup is any good, whether the reader should take it, or what happens
after the stop. Those are judgment calls, and the desk shows them as such.
