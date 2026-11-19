# Rook: the AI trading desk

A supervised desk for one trade at a time. Nine seats read a session and argue
both sides, plain code decides whether the trade is allowed, and every decision
— including every refusal — is journaled. Paper only, and the demo runs offline
against one labelled session of delayed Yahoo Finance bars, with no keys and no
signup.

Working name and contact address are placeholders: `Rook`, `hello@rookdesk.app`
(`src/content.ts`).

```sh
bun install
bun run dev        # http://localhost:5173
bun run typecheck
bun test           # bun:test, src/shared/*.test.ts
bun run build
```

## What is real and what is sample

- **Real:** the risk gate (15 ordered rules), position sizing in integer cents,
  the setup rules on 5-minute bars, the journal schema and CSV, the paper-ticket
  fill replay, the Time Machine simulation. All pure TypeScript in `src/shared/`,
  tested, and the same module runs in the browser and in the Worker.
- **Market data:** Yahoo Finance 5-minute bars for the eight symbols, 30 sessions
  plus 30 daily closes, fetched once with `yfinance` (see below) and committed as
  `src/shared/data/market.json`. It is delayed data, not a feed: every screen
  shows a `MARKET DATA` badge, and the footer names the provider and the fetch
  time. Nothing is requested at runtime, so the demo still works offline and with
  no keys.
- **Fallback:** if the dataset is missing, `src/shared/fixtures.ts` generates a
  seeded session instead and every badge reads `SAMPLE DATA`.
- **Absent on purpose:** broker connections, live order routing, model calls,
  keys in the browser. See `.specify/memory/constitution.md`.

## Refreshing the market data

Python is a build-time tool here; it is not part of the app, the Worker or the
bundle.

```sh
python3 -m venv .venv-data
.venv-data/bin/pip install -r scripts/requirements.txt
.venv-data/bin/python scripts/fetch_bars.py   # writes src/shared/data/market.json + meta.json
```

Yahoo serves 5-minute bars for roughly the last 60 days, so the script fetches 30
sessions; the newest may be partial when the market is open, which the UI labels
as a demo clock rather than a live feed. Re-run it, then commit both files: the
diff is the record of what changed.

## Screens

| Route | What it is |
| --- | --- |
| `/` | Landing: hero with a live trade card, features, how it works, stats, pricing, FAQ |
| `/pricing` | Plans with monthly/yearly switch, comparison table, FAQ |
| `/about` | Story, numbers, values, contact form |
| `/login`, `/signup` | Demo account screens, validated by the Worker, user kept in localStorage |
| `/app` | Today's desk: risk budget, setups found by the rules, search and family filter |
| `/app/setup/:symbol` | One symbol: candles, opening range, plan levels, Time Machine, and the sessions behind its count |
| `/app/session/:symbol/:date` | One past session from that count, levels drawn, outcome stated |
| `/app/room` | The seats: run the room on a plan, read the memo and the case against |
| `/app/risk` | The gate: edit limits, check a plan against all 15 rules, confirm a paper ticket |
| `/app/journal` | Journal rows, weekly review, paper tickets, CSV export |
| `/app/chat` | Ask the desk, answered from the last packet with a citation |
| `/styleguide` | Every token and component, rendered by the real code |
| anything else | 404 |

## Where things live

| Path | Contents |
| --- | --- |
| `src/shared/data/market.json` | The yfinance snapshot: bars, past sessions and daily closes, with its `meta.json` provenance |
| `src/shared/dataset.ts` | Parses that snapshot into bars and does the provenance maths |
| `scripts/fetch_bars.py` | Refreshes the snapshot (yfinance). Build-time only |
| `src/shared/fixtures.ts` | The data API: the snapshot when present, a seeded generated session otherwise |
| `src/shared/setups.ts` | The four written setups (opening range, bull flag, gap retest, 20-day reclaim) |
| `src/shared/risk.ts` | The gate, rules R-01 to R-15. Contract: `specs/001-ai-trading-desk/contracts/risk-engine.md` |
| `src/shared/sizing.ts` | Integer-cent money, position sizing and the limit that decided it |
| `src/shared/journal.ts` | Row schema, weekly summary, CSV |
| `src/shared/stats.ts` | Wilson intervals, sample gates and split-half agreement behind every percentage |
| `src/shared/ticket.ts` | Paper-ticket state machine and the fill replay |
| `src/shared/simulate.ts` | Time Machine: 10k seeded replays from the past sessions |
| `src/shared/packet.ts` | Seat notes, rubric, memo, grounded answers |
| `src/lib/desk.ts` | Everything stored in this browser, under `desk:v1:` |
| `src/worker/index.ts` | The API (below). Stateless, no database |
| `src/content.ts` | Every marketing string, plan and image path |

## Worker routes

All in `src/worker/index.ts`. Each validates its input and answers JSON.

| Route | Body / query | Answers |
| --- | --- | --- |
| `GET /api/health` | | `{ ok: true }` |
| `GET /api/market/universe` | | the eight sample instruments |
| `GET /api/market/bars` | `?symbol=TSLA` | the session's 5-minute bars, 404 for an unknown symbol |
| `GET /api/desk/scan` | | every setup found in the session |
| `POST /api/risk/check` | `{ plan, limits, account, session, history }` | the gate verdict |
| `POST /api/simulate` | `{ plan, seed?, runs? }` | Time Machine probabilities, 422 on bad levels |
| `GET /api/news` | `?symbol=` | fixture headlines, calendar and regime |
| `POST /api/room/run` | `{ plan, limits, account, session }` | seat notes, rubric, memo |
| `POST /api/signup`, `POST /api/login` | form fields | the demo user, or 422 field errors |
| `POST /api/subscribe`, `POST /api/contact` | form fields | 200 or 422 |
| anything else under `/api/` | | 404 JSON |

## Making it real

The constitution sets the order: keep the gate pure and tested, then replace the
fixtures with a delayed feed, then move the journal from localStorage to a
database, and only then discuss execution — with its own review, its own kill
switch and its own limits. The gate module does not change for any of that.

The first step is done at build time. The next one is a scheduled refresh in the
Worker (a Cron Trigger writing to R2) so the snapshot is never stale, with the
same provenance fields and the same fallback: if the refresh fails, the last
good dataset stays on screen and says how old it is.

Images in `public/images/` were generated for this app.
