# 002 — Charts: the Vela workspace over Rook's snapshot

**Status:** implemented | **Date:** 2026-11-23

## Intent and why

The desk could show one session of candles, hand-drawn in SVG, with the setup's levels on it.
That is enough to explain a rule and not enough to read a chart: no pan, no zoom, no drawing
tools, no indicators, no other symbol without leaving the page.

This adds a **Charts** seat to the desk: the full [Vela](https://github.com/LuxAlgo/Vela)
workspace — its topbar, symbol search, timeframes, 70+ native studies, 79 drawing tools, chart
styles, settings, object tree, data window, layouts, keyboard map and saved state — running
offline over the bars this repo already ships. The setup's own levels are drawn in, locked, for
the session the rule fired on. The hand-drawn `BarChart` on the setup and session pages becomes
the same library's chart, with the same props and the same levels.

The second requirement is lifecycle: **upstream releases must keep arriving.** The library is a
normal npm dependency, never vendored or patched, with the upgrade ritual and its contract
checks written down in `docs/vela.md`.

## Goals

- A real charting surface on `/app/charts`, reached from the desk rail, that needs no keys and
  no network.
- The chart's own chrome works: symbol search across Rook's eight instruments, timeframes
  5m/15m/30m/1h/1D, indicators, drawings, styles, layouts, persistence.
- The rule's levels are on the chart, distinguishable from anything the reader draws.
- The setup and session pages keep their chart, now interactive, without changing their props.
- An upgrade path: caret range, version stamped on screen, version-matched docs, contract list.

## Non-goals

- Live data. There is no streaming provider, no websocket, no polling; `live` stays off.
- Brokers, order routing, execution. The chart displays; the gate still decides.
- Crypto, futures, forex symbols. Vela ships providers for those; Rook does not serve them.
- User-authored Pine Script (see *The Pine decision*).

## Anti-goals

- A chart that shows numbers the snapshot does not contain, or candles aggregated across the
  overnight gap.
- A second design language: the chart must read as Rook, not as a foreign widget.
- A landing page that pays for the chart: the library must never enter the entry chunk.

## Constraints

- Constitution V: zero keys, zero runtime network calls. Satisfied by construction — the
  provider reads `src/shared/data/market.json` and the pages pass `data` directly.
- Constitution III: every displayed number has a source. Aggregated candles are derived from the
  same snapshot and labelled as delayed data; no level is invented.
- Constitution VI: smallest diff, new dependency only when the platform cannot do the job.
  Hand-drawing 79 drawing tools and 70 studies is not a reasonable platform-only path.
- Apache-2.0 + NOTICE: the watermark stays, and the page links Vela as well.
- The snapshot holds 30 sessions of 5-minute bars per symbol (~2,300 bars) and 30 daily closes.

## Approaches considered

1. **Full workspace + a Rook data provider** *(chosen)*. `VelaWorkspace` with `layout: '1'` over a
   `DataProvider` that serves the eight symbols and five timeframes from the snapshot. Every
   workspace control is real; the extra work is a small provider and an aggregation module, both
   pure and tested.
2. **Full workspace over offline `data`, Rook's own symbol switcher.** Less work, but the
   workspace's symbol search and timeframe chips dead-end, and hiding them via `topbar`
   freezes the shell's composition. Rejected: it is not the "complete charting" that was asked
   for, and the seams it skips are the ones that make the screen worth having.
3. **Bare `Vela` + Rook chrome around it.** Most Rook code, least library surface: we would build
   the topbar, drawing toolbar, indicator picker, settings and object tree ourselves. Rejected on
   scope and on the requirement to use what the library offers.

## Decisions

- **Entry point:** `VelaWorkspace` from `@luxalgo/vela/workspace`, `layout: '1'`. One cell by
  default, so the layout dropdown can grow to 2h/4/8 without a second integration.
- **Data:** a provider, not per-page `data`, for the workspace. `getBars` slices
  `chartHistory(symbol, timeframe)` by the library's `BarRange`; `listSymbols` returns the eight
  instruments with their `NASDAQ`/`NYSE`/`AMEX` prefixes; `getSymbolInfo` declares New York time,
  `0930-1600`, and the five timeframes. No `subscribe` — nothing to stream.
- **Timeframes:** `5`, `15`, `30`, `60`, `1D`. Aggregation counts buckets from each session's
  first bar and never spans two sessions. `1D` is built from each session's own 5-minute bars, so
  it is a real OHLC candle rather than a close-only series drawn as one.
- **Money:** `Bar` stays in integer cents; `toChartBars` is the single conversion to price units.
  The drawn levels come from `setups.ts` in cents and are divided once, at the drawing call.
- **Levels:** the triggered setup for the symbol (else its first written setup) — range high,
  range low, entry, stop, target — placed as locked `hline` drawings anchored at the left of the
  visible window, labelled with the price. Two levels on one price (the ORB entry *is* the range
  high) merge into one line with a joined label.
- **Framing:** on mount and on every symbol or timeframe change, the chart frames the last 78 bars
  of that symbol's history — one 5-minute desk session — so the levels are on screen rather than
  below the autoscaled window, and the candles stay the same size whichever timeframe is up.
  `1D` has only 30 stored bars, so it frames them all.
- **Theme:** the seven colours Vela needs are read once from the CSS tokens in `src/styles.css`
  (`--color-bg`, `--color-soft`, `--color-line-strong`, `--color-leaf`, `--color-danger`) so the
  stylesheet stays the single source of truth. Candle colours are passed at the top level, where
  the library takes them.
- **Persistence:** `persist: 'desk:v1:charts'` keeps the shell's state under Rook's localStorage
  namespace; `clearOnSymbolChange` keeps hand-drawn work with its symbol.
- **Attribution:** watermark on, plus a "Charts by Vela™" link in the page footnote.
- **Setup/Session:** `BarChart` keeps its props; its SVG body is replaced by a single-chart
  workspace over `data`, with the desk's symbol and timeframe controls hidden and the levels
  drawn after `ready()`. Teardown is `destroy()` in the effect cleanup, so navigating away leaves
  no chart, canvas or subscription behind.
- **Version:** `vite.config.ts` reads the installed package's version into `__VELA_VERSION__`;
  the charts page shows `Vela 0.10.14`, so an upgrade is visible on screen.

## The Pine decision

`@luxalgo/vela-pinets` + `pinets` run user-authored Pine Script. They are **AGPL-3.0-only**, a
network-copyleft licence, unlike Apache-2.0 Vela. Bundling them would put source-availability
obligations on the deployed product and rule out a closed-source release; they are also large.
Measured on this repo, wiring the addon grows the charts route from 3.24 kB to 836.14 kB
(1.72 kB → 223.18 kB gzip) — about **+833 kB minified / +221 kB gzip**.

Nothing in this feature needs them: the seven-dozen built-in studies are native and run without
an engine. Decision: **not installed**; the two-line opt-in and the licence reading are recorded
in `docs/vela.md` for a separate, deliberate change.

## Update path

- Dependency: `"@luxalgo/vela": "^0.10.14"`. Patch and minor releases arrive with
  `bun update @luxalgo/vela`; 0.11 is breaking and is read from
  `node_modules/@luxalgo/vela/docs/user/upgrading.md` first.
- The package ships its docs and agent skills, versioned with the code; they are the reference,
  not the website.
- Six contract checks (candles, symbol search, timeframes, indicators/drawings/persistence,
  levels, attribution) are listed in `docs/vela.md` and rerun after every bump.
- No source is copied into the repo and nothing is patched in `node_modules`.

## Cost

| Chunk | Before | After |
| --- | --- | --- |
| Entry (`index-*`) | 274.0 kB (86.4 kB gzip) | unchanged |
| CSS | 94.4 kB (15.4 kB gzip) | unchanged |
| Charts route | — | 3.24 kB (1.72 kB gzip) |
| Shared chart chunk (lazy, `/app/charts`, `/app/setup/*`, `/app/session/*`) | — | 1,697.8 kB (465.9 kB gzip) |

The landing page and the desk pay nothing; the chart pages fetch Vela on demand.

## Verification

- `bun run typecheck` clean.
- `bun test`: 171 pass, including the new aggregation suite (`src/shared/chartfeed.test.ts`):
  cents → price, epoch ms, 15-minute merges, the overnight gap, daily OHLC, timeframe validation,
  unknown symbols and the session window.
- `bun run build` clean, chunk sizes above, manifest guard passes.
- Browser, on the dev preview: `/app/charts` mounts with `data-chart-status="ready"`, seven
  canvases, candles, styled chrome, symbol/venue in the status line, the five rule levels on the
  framed session, watermark and version badge; `/app/setup/TSLA` renders the same chart with its
  labels and levels.
- Not verified in the browser: the drawing/indicator pickers by hand, a symbol switch through the
  search, persistence across reload, and the mobile layout. The contract list covers these for
  the next person who touches the integration.

## Left to the builder

- Decide on Pine separately if it is ever wanted (install + one `engines` line, then re-check the
  licence position).
- Optional: a weekly GitHub Action that opens an issue when `@luxalgo/vela` publishes, if the
  repository gains CI.
