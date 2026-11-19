# Research: AI Trading Desk

Phase 0 decisions. Each is Decision / Rationale / Alternatives considered. Anything
not settled here is marked NEEDS CLARIFICATION and blocks Phase 1.

## D-01 Market data provider for live mode

**Decision**: Yahoo Finance chart JSON (`query1.finance.yahoo.com/v8/finance/chart`)
as the primary adapter, Stooq CSV as fallback, Nasdaq Trader symbol directories for
the universe. All fetched from the Worker only.

**Rationale**: no API key, no billing, and it is the exact source the
`day-trader-skill` repository already uses in production for 5-minute bars and
quotes. Provenance is honest: "delayed, unofficial".

**Alternatives**: FMP / Twelve Data / Polygon — better SLAs and documented terms,
but a key and a rate limit, so they belong to a later opt-in profile, not the demo.
Stooq alone — daily granularity is not enough for opening-range logic.

## D-02 CORS and caching

**Decision**: every provider call is proxied by the Worker with a typed adapter,
normalized to the internal `Bar`/`Quote` shapes, cached in the Cache API: quotes
15 s, 5-minute bars 60 s, daily bars 15 min. Responses carry `source` and
`fetchedAt`. Cache misses on failure return the seeded fixture flagged
`fallback: true`, never a 500.

**Rationale**: browser calls to Yahoo/Stooq/SEC are blocked by CORS, and SEC
requires a contact user-agent that must not ship to the client. A single proxy also
gives one place to rate-limit and label data.

**Alternatives**: client-side fetch with a public CORS proxy — untrustworthy and
rate-limited; build-time data snapshot — stale on purpose, but loses the live story.

## D-03 SEC and filings

**Decision**: out of v1. The news seat reads seeded headlines; the adapter interface
reserves a `filings` method.

**Rationale**: EDGAR requires a real contact user-agent and polite rate limits, and
filings do not change the demo's story. Adding it later is a pure adapter addition.

**Alternatives**: ship an EDGAR adapter with a placeholder UA — violates the
constitution's data rule.

## D-04 Charts

**Decision**: hand-rolled SVG candlesticks in `src/components/BarChart.tsx`:
5-minute bars, opening-range band, entry/stop/target lines, hover readout.

**Rationale**: needs ~120 lines, no dependency, fully themeable with existing
tokens, and renders identically on the Worker-free demo.

**Alternatives**: `lightweight-charts` (~45 KB, excellent, but a new dependency and
an imperative canvas API); `recharts` (wrong abstraction for candles).

## D-05 Determinism of the Time Machine

**Decision**: `mulberry32` seeded PRNG, resampling the symbol's own 5-minute returns
by time-of-day bucket, 10,000 paths, seed shown in the UI and stored with the result.

**Rationale**: reproducibility is a product feature — the same plan and seed must
produce the same odds. Time-of-day bucketing preserves the intraday shape that
matters for a day trade.

**Alternatives**: i.i.d. bootstrap (destroys the intraday profile); GBM (wrong
tails, implies normality the data does not have); unseeded `Math.random` (not
reproducible, not testable).

## D-06 Agent narrative

**Decision**: scripted seat notes generated from the packet in `src/shared/packet.ts`,
following the fixed formats from the library guides. Each seat has 2–4 template
branches keyed to real packet values (regime, blackout, rule match count, RR).

**Rationale**: keeps the demo free, offline and deterministic, and matches the
template's existing approach (`packs.ts` scripted answers). The risk gate stays code
regardless.

**Alternatives**: live model call — needs a key, non-deterministic prose, and cannot
be tested; a model call is a later optional Worker route with server-side keys.

## D-07 State and persistence

**Decision**: one versioned localStorage namespace `desk:v1:*` with a small typed
store per slice (limits, account, journal, memos, tickets). Migration: if the old
`cramly:` keys exist, ignore them and start clean; no destructive migration.

**Rationale**: the template already has `useStored`/`readStore`/`writeStore`, which
handles cross-tab updates; server persistence is unnecessary for v1.

**Alternatives**: D1 now — adds auth, migrations and deploy surface for no demo
value; IndexedDB — more code for the same result at this data size.

## D-08 Testing

**Decision**: `bun test` for pure modules: `risk.test.ts` (rule table, worked
examples), `sizing.test.ts` (cents, rounding, caps), `simulate.test.ts`
(reproducibility, probability sum), `journal.test.ts` (CSV header/escaping).
Worker adapter parsing is tested against checked-in fixture JSON.

**Rationale**: no new dependency, TypeScript-native, and exactly the layer where a
mistake costs money. UI behaviour is checked by hand per `quickstart.md`.

**Alternatives**: Vitest — nicer DX, extra dependency and config for the same
coverage; Playwright — disproportionate for a demo.

## D-09 Money math

**Decision**: prices held as integer cents (`entryCents`, `stopCents`); share counts
integer; R multiple computed in floats but displayed to 2 dp; dollar amounts rounded
once at the boundary with `Math.round`.

**Rationale**: float dollars drift under repeated arithmetic, and the gate's output
must be byte-identical between browser and Worker.

**Alternatives**: float everywhere with `toFixed` at render — hides drift rather
than preventing it.

## D-10 Copy and compliance

**Decision**: write original interface copy. Store the disclaimer once in
`src/content.ts` (`DISCLAIMER`) and render it via `Disclaimer.tsx` on every `/app`
route. No number in marketing copy may be a performance claim; stats become
"checks run", "rules enforced", "seats per trade".

**Rationale**: the library and CoTrader guide are third-party published material —
methods are fair to implement, their prose is not ours to republish. Performance
claims would also breach the constitution and CFTC guidance.

**Alternatives**: reuse guide text verbatim — licensing and voice problems.

## D-11 Auth

**Decision**: keep the template's demo login; `/app` is usable without signing in.

**Rationale**: it keeps the "landing to blocked trade in 90 seconds" success
criterion intact. Real accounts are a separate feature with D1 + Freebuff auth.

**Alternatives**: Sign in with Freebuff now — adds setup friction before there is
any per-user server state.

## D-12 Session clock

**Decision**: compute US-equity session state in `America/New_York` using
`Intl.DateTimeFormat` with `timeZone`, include a 2026–2027 holiday and early-close
table in `src/shared/time.ts`.

**Rationale**: the source skill ships exactly such a table; getting a session wrong
makes every verdict wrong. `Intl` avoids a date library.

**Alternatives**: `date-fns-tz` (dependency), server clock only (wrong for
pre-market browsing).

## Open items

None. All Technical Context unknowns are resolved above. Brand name remains a copy
decision, not a technical one, and does not block implementation.
