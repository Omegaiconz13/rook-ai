# Rook — the desk

Rook is a paper trading desk. It does one trade at a time and it is built so that the
most useful thing it can say is often "no".

## What it actually does

1. **Scan.** Four setup families over the bundled session: opening-range breakout
   (`orb`), bull flag (`flag`), fair-value gap (`fvg`), and reclaim of the 20-day
   average (`reclaim`).
2. **Plan.** Entry, stop and target in cents, producing a `TradePlan`.
3. **Size.** Three limits compete for the share count: risk per trade, position cap,
   cash after buffer. The verdict names the one that decided it.
4. **Check.** `checkPlan()` returns `approved` or `blocked` with a rule id. It reads
   numbers only — no model, no clock beyond the session state it is handed.
5. **Ticket.** A plan becomes a ticket only after a human confirms it.
6. **Journal.** Both outcomes are written as rows: `APPROVED`, `BLOCKED` or `MANUAL`.

## Vocabulary

| Word | Means |
|---|---|
| plan | A proposal: symbol, entry, stop, target, size unset. Editable at no cost. |
| verdict | The gate's answer about one plan against one set of limits. |
| ticket | A confirmed intent with a state machine: `proposed → confirmed → filled → closed`, or `cancelled` / `expired`. |
| row | One journal entry. A blocked plan produces a row too. |
| session | One trading day of pre-market, open, close and closed states. |
| R | Risk per share. `1R` is the distance from entry to stop. |

## Session states

`pre`, `open`, `close`, `closed`. The gate refuses entries outside the reader's
entry window and after the flat-by time; that is R-02 and R-15, not a UI choice.

## Defaults, for reference

These are the shipped defaults, not a recommendation, and every one is editable:

```
equity               $5,000
risk per trade       1%
daily loss limit     3%
position cap         50% of equity
cash buffer          10%
max trades per day   3
min reward:risk      1.5
entry window         09:35–11:30 ET
flat by              15:55 ET
```

## What this surface is not

- It does not place orders, hold funds, or connect to a broker. There is no
  execution path anywhere in the codebase.
- It does not store anything server-side. The journal lives in the reader's browser;
  the export bundle below is the only way an agent can see it.
- It does not give investment advice. It applies the reader's own written rules.

## Machine-readable entry points

| Path | Returns |
|---|---|
| `GET /llms.txt` | this index |
| `GET /docs/{index,rules,journal,ninth,skill}.md` | the documents, as `text/markdown; charset=utf-8` |
| `GET /api/health` | `mode` (`yfinance` or `fixture`), session state, ET time, session date |
| `GET /api/desk/scan` | the setups for the bundled session |
| `POST /api/risk/check` | a `GateVerdict` from the same pure function the browser runs |
| `POST /api/simulate` | a seeded Monte Carlo of one plan |

Every JSON route answers with one envelope: `{ ok: true, data }` or
`{ ok: false, error, errors? }`.
