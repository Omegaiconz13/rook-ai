# The journal

The journal is the product's memory. A row is written for an approval, for a
refusal, and for a trade taken by hand — which is why a blocked plan is evidence
rather than an absence.

## Where it lives

`localStorage`, under `rook:v1:journal`, in the reader's browser. There is no
server-side table and no account. An agent can only see rows through the export
bundle, which the reader produces from `/app/journal`.

## The row

```ts
type JournalRow = {
  tradeId: string
  date: string                   // session date, YYYY-MM-DD
  session: 'pre' | 'open' | 'close' | 'closed'
  symbol: string
  setup: string                  // setup family, e.g. "orb"
  gateRule: string               // "R-03" or "" when the row came from hand entry
  verdict: 'APPROVED' | 'BLOCKED' | 'MANUAL'
  took: boolean                  // did the reader actually take it
  size: number                   // whole shares, 0 when blocked
  entry: string                  // decimal string, dollars, e.g. "250.00"
  stop: string
  target: string
  rPlanned: string               // decimal string, e.g. "3.00"
  rResult: number | null         // realised R, null until closed
  rulesFollowed: boolean
  note: string                   // ≤ 280 characters
  memoId: string | null
  tags: string[]                 // free labels: "FOMO", "A+", "news"
  editedAt: string | null        // set once the reader edits; edits stay visible
  source: 'gate' | 'manual'
}
```

Prices are decimal **strings** in dollars, not cents, because the row is a record
for a human to read back a year later. The gate speaks integer cents; the journal
speaks dollars. The conversion happens once, in `rowFromVerdict()`.

## Limits

| Limit | Value | Enforced by |
|---|---|---|
| Rows kept | 2,000 (oldest dropped first) | `JOURNAL_MAX_ROWS` |
| Row note | 280 characters | `NOTE_MAX`, and the editor's counter |
| Day note | 2,000 characters | `DAY_NOTE_MAX` |
| Schema | 2 | `JOURNAL_SCHEMA` |

A row is immutable except for `note`, `tags`, `took`, `rResult`, `rulesFollowed`
and `editedAt`. Once edited, `editedAt` stays set: an edited record is meant to
look edited.

## Export

```ts
type JournalBundle = {
  app: 'rook'
  kind: 'journal'
  schema: 2
  exportedAt: string             // ISO
  rows: JournalRow[]
  dayNotes: { date: string; note: string; updatedAt: string }[]
}
```

The import path validates the bundle before touching anything: wrong `app`, wrong
`kind`, or a `schema` newer than the running app is refused with a readable reason
rather than a partial merge. A bundle with an older schema is migrated, not rejected.

## What the numbers mean

- `rPlanned` is the target's distance from entry, divided by risk per share.
- `rResult` is realised: `-1` at the stop, `rPlanned` at the target, null if the
  entry never traded or the reader is still in it.
- Win rate is reported only with its Wilson lower bound next to it. At 6 trades a
  100% win rate is not evidence, and the journal says so.

## Reading it well

Three questions the journal is designed to answer:

1. How often did the gate refuse me, and which rule did most of that work?
2. When I overrode a refusal, what did it cost in R?
3. Is my win rate distinguishable from noise yet?

If the answer to 3 is "not yet", the journal says that instead of a percentage.
