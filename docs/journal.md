# The journal

The journal is the desk's memory: every check the gate ran (taken or refused), every trade the
reader writes down by hand, the note for each session, and the arithmetic over both. It is local
to this browser — no account, no database, no request — and portable through two files.

The shape (rows as the primitive, a day layer above them, a calendar, named analytics, export)
follows [LuxAlgo/trade-journal](https://github.com/LuxAlgo/trade-journal), an MIT project. No code
from it is vendored or copied here: this is a small pure-TypeScript model written for this desk's
rows, which are gate checks with an R plan rather than broker fills.

## Where it lives

| Key | Contents | Cap |
| --- | --- | --- |
| `desk:v1:journal` | `JournalRow[]`, newest first | 2,000 rows |
| `desk:v1:daynotes` | `DayNote[]`, oldest first | one per date |

`src/lib/storage.ts` namespaces every key with `desk:` and keeps an in-memory copy, so the page
still works when storage is blocked (the data is then gone on reload — the footer says so).
`migrateJournal` fills old rows forward: a row stored before tags and `source` existed reads with
`tags: []`, `source: 'gate'`, `editedAt: null`. Nothing is rejected for being old.

## What the reader can change

- **Note** (≤ 280 chars), **tags** (≤ 8), **rules followed**, and **R result** — the columns the
  reader owns. The first save stamps `editedAt`, so an edited record is visible as one.
- The gate's columns — verdict, rule, size, levels, planned R — stay read-only. A journal you can
  rewrite after the fact is not evidence.
- **Add trade** writes a `MANUAL` row: a trade the gate never saw. It is a third verdict, not a
  fake `APPROVED`, so no report can claim the gate cleared it.
- **Delete** asks twice inside the editor; the row is gone from storage after the second press.

The automatic result written back by settling a paper ticket does **not** stamp `editedAt`: the
desk wrote that number, the reader did not.

## Analytics, and when they refuse to read

Every figure is arithmetic over the rows in this browser, in the order they happened
(`journalAnalytics` reverses the newest-first store). Below **ten closed rows** the sample gates
apply:

| Figure | Definition | Printed below ten closed rows |
| --- | --- | --- |
| Sum R | Σ `r_result` of closed, taken rows | yes (a sum, not a rate) |
| Hit rate | wins ÷ closed, with a Wilson 95% interval | `—`, `N=x of 10` |
| Profit factor | gross wins ÷ gross losses | `—` |
| Expectancy | mean R per closed row | `—` |
| Avg win / avg loss | mean of positive / negative R, the loss signed | `—` |
| Max drawdown | worst peak-to-trough of cumulative R, no reset | yes (drawdown is not an edge claim) |
| Streak | consecutive wins or losses, newest backwards; a 0R row ends it | yes |
| By setup / by symbol | sum R, closed count and hit rate per key, best first | the rows, with `N` |
| Blocks by rule | count per `gate_rule` on `BLOCKED` rows | yes (a count) |

The weekly review (`weekSummary`) additionally suggests **one** change, and only after ten rows.

## The calendar and the day note

`calendarMonth(rows, year, month, today)` builds six Monday-first weeks so the grid never changes
height, buckets rows by their own ET session date (no time-zone maths: a row belongs to the date it
was written under), and totals only the days that belong to the month. A day with rows is a button:
picking it filters the table and switches the day note to that date. `This month` returns to the
desk session's month; `today` is the session date, not the wall clock, so the ring agrees with the
rest of the app.

A day note is saved on blur and by button, up to 2,000 characters, and removing all the text
deletes the note rather than storing an empty one.

## Export, backup, restore

- **CSV** — the 17 documented columns, in order, every row, whatever the filter. See
  `specs/001-ai-trading-desk/data-model.md`.
- **Backup** — `rook-journal-<session>.json`: `{ app: 'rook', kind: 'journal', schema: 2,
  exportedAt, rows, dayNotes }`. Tags, `editedAt` and `source` ride in this file.
- **Restore** — reads a backup, shows what the file holds against what the browser holds, and
  replaces both lists only after the reader confirms. A bare array of rows (an older export) is
  accepted. A file that is not JSON, or holds no readable row, is refused with a reason.

## Adding to it

Everything about rows, notes, the calendar and the figures is pure code in `src/shared/journal.ts`
with its tests in `src/shared/journal.test.ts`; the page only reads it. If a new figure is added,
give it a definition in the table above, a test with a known series, and the same ten-row gate.
Storage changes go through `src/lib/desk.ts` so the key names stay in one place.
