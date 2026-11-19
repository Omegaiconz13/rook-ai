# Contract: Worker HTTP API

All routes are JSON unless stated. The Worker is the only place that talks to a data
provider; the browser never calls a provider directly.

Common response envelope:

```json
{ "ok": true, "data": {}, "source": "seed|live|fallback", "fetchedAt": "2026-11-19T14:31:00.000Z" }
```

Error shape (every non-2xx):

```json
{ "ok": false, "error": "Check the highlighted fields.", "errors": { "symbol": "Unknown symbol." } }
```

| Status | When |
|---|---|
| 400 | body is not a JSON object |
| 404 | unknown symbol, unknown setup, or unknown `/api/*` route |
| 422 | validation failed; `errors` keyed by field |
| 405 | method not allowed on a known path |

Validation is shared with the browser (`src/shared/validate.ts`), so a message the
client shows is the message the server would return.

---

## GET /api/health

Unchanged from the template, extended with mode.

```json
{ "ok": true, "mode": "seed", "session": "open", "nowEt": "2026-11-19T10:12:00-05:00" }
```

---

## GET /api/market/universe

The instruments the desk can show.

```json
{
  "ok": true,
  "data": [
    { "symbol": "TSLA", "name": "Tesla", "exchange": "NASDAQ", "sector": "Auto", "avgVolume": 98200000, "provenance": "seed" }
  ],
  "source": "seed"
}
```

---

## GET /api/market/bars?symbol=TSLA&interval=5m&date=2026-11-19

| Query | Rules |
|---|---|
| `symbol` | required, `/^[A-Z]{1,5}$/`, must exist in the universe |
| `interval` | `5m` (default) or `1d` |
| `date` | optional `YYYY-MM-DD`; defaults to the latest fixture/session |

```json
{
  "ok": true,
  "data": {
    "symbol": "TSLA",
    "interval": "5m",
    "sessionDate": "2026-11-19",
    "bars": [
      { "start": "2026-11-19T14:30:00.000Z", "open": 35912, "high": 36104, "low": 35877, "close": 36060, "volume": 842000 }
    ]
  },
  "source": "seed",
  "fetchedAt": "2026-11-19T14:31:00.000Z",
  "fallback": false
}
```

Contract notes: prices are integer cents; bars are sorted by `start`; a session has
78 bars; if the provider fails, `source: "fallback"`, `fallback: true` and the seeded
bars are returned — never an empty array with 200.

---

## GET /api/market/quote?symbols=TSLA,NVDA

```json
{
  "ok": true,
  "data": [
    { "symbol": "TSLA", "last": 36418, "prevClose": 35890, "changePct": 1.47, "asOf": "2026-11-19T15:15:00.000Z", "delayed": true }
  ],
  "source": "seed"
}
```

Rules: at most 20 symbols; unknown symbols are omitted and listed in
`errors.unknown` with status 422 if *none* resolve.

---

## POST /api/desk/scan

Body: `{ "symbols": ["TSLA"], "date": "2026-11-19" }` (both optional; default: whole
universe, latest session).

Returns setups exactly as defined in `data-model.md`, computed by
`src/shared/setups.ts` so the browser and Worker agree.

```json
{
  "ok": true,
  "data": [
    { "id": "TSLA-2026-11-19-orb", "symbol": "TSLA", "family": "orb", "direction": "long",
      "triggerAt": "2026-11-19T15:12:00.000Z", "entryCents": 36418, "stopCents": 35832,
      "targetCents": 37590, "riskPerShareCents": 586, "rMultiple": 2,
      "status": "triggered", "provenance": "seed" }
  ],
  "source": "seed"
}
```

---

## POST /api/risk/check

Body: `{ plan, limits, account, session, history }` — shapes in `data-model.md`.
Stateless: the Worker does not store limits.

Response: a `GateVerdict` from `src/shared/risk.ts`, stamped with `checkedAt` by the
route (the engine itself takes no clock).

```json
{
  "ok": true,
  "data": {
    "planId": "1f0c…", "verdict": "approved", "ruleId": null,
    "reason": "Approved 6 shares; position cap set the size.",
    "size": 6, "decidingLimit": "position-cap", "lossAtStopCents": 3516,
    "rewardRisk": 2, "checkedAt": "2026-11-19T15:16:04.000Z",
    "limitsSnapshot": { "equityCents": 500000, "riskPerTradePct": 1, "dailyLossPct": 3, "positionCapPct": 50, "cashBufferPct": 10, "maxTradesPerDay": 3, "minRewardRisk": 1.5, "entryWindowStart": "09:35", "entryWindowEnd": "11:30", "flatBy": "15:55" }
  }
}
```

Blocked example:

```json
{ "ok": true, "data": { "verdict": "blocked", "ruleId": "R-12", "reason": "Reward:risk is 1.00, below your 1.50 minimum.", "size": null, "decidingLimit": null, "lossAtStopCents": null, "rewardRisk": 1 } }
```

422 cases: missing plan fields, non-integer prices, stop ≥ entry, unknown symbol.

---

## POST /api/room/run

Body: `{ plan, limits, account, session, history, seed? }`.

Response: seat notes in fixed order plus the memo. The gate is evaluated server-side
by the same module; a blocked gate forces `decision: "PASS"` and `rubricScore ≤ 2`, and an
expired setup (the setup seat's veto) forces `PASS` even when the gate approved and the
score is 3 or more.

```json
{
  "ok": true,
  "data": {
    "notes": [
      { "role": "analyst", "verdict": "info", "reason": "Trend day, volatility normal for the last hour.", "evidence": ["range 354.47–362.18", "close 364.18 above range high"], "packetRef": "setup.rangeHighCents" }
    ],
    "gate": { "verdict": "blocked", "ruleId": "R-12" },
    "memo": { "rubricScore": 2, "decision": "PASS", "counterCase": "Price sits 40 points under yesterday's high; the target needs a clean break of it." }
  }
}
```

Failure: if a seat cannot produce a note (missing packet field), respond 422 with
`errors.seat` and produce **no** memo.

---

## POST /api/simulate

Body: `{ symbol, plan, seed, runs = 10000 }`.

```json
{
  "ok": true,
  "data": {
    "seed": 19, "runs": 10000,
    "targetFirst": 29.4, "stopFirst": 25.5, "neither": 45.1,
    "avgR": 0.12, "historicalOccurrences": 33,
    "historicalWins": 13, "historicalLosses": 15, "historicalNeither": 5,
    "verdictLine": "Close to a coin flip on this sample; the target edge is not established."
  }
}
```

Rules: `runs` clamped to 1_000–20_000; `seed` defaults to a value stored with the
result; probabilities sum to 100 ± 0.2; under 20 occurrences the `verdictLine` must
contain "too early".

---

## GET /api/news?symbols=TSLA

```json
{
  "ok": true,
  "data": [{ "symbol": "TSLA", "at": "2026-11-19T13:04:00.000Z", "title": "Sample headline for the fixture session", "tag": "earnings", "source": "fixture" }],
  "source": "seed"
}
```

Seeded headlines are clearly fictional and labelled `source: "fixture"`. No live news
provider in v1.

---

## GET /api/journal/csv

Not a server route. CSV export is generated in the browser from
`desk:v1:journal` by `src/shared/journal.ts#toCsv`, so journal data never leaves the
device. Documented here so nobody adds a route that uploads it.

---

## Not implemented in v1

`POST /api/orders` (paper fills happen locally against fixture bars),
`POST /api/broker/*`, `POST /api/chat` with a model key, D1 persistence, auth. Each
is a follow-up feature with its own spec.
