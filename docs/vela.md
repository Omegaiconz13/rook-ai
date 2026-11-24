# Charts: Vela, upgrades and the Pine addon

`/app/charts` (and the embedded chart on `/app/setup/:symbol`, `/app/session/:symbol/:date`,
the journal entry and the styleguide) is rendered by [Vela](https://github.com/LuxAlgo/Vela) —
`@luxalgo/vela`, Apache-2.0 — over the same committed market snapshot the rest of the desk
uses. Nothing about the chart touches the network: the library is given bars through its
data-provider port, and the provider reads only `src/shared/data/market.json`.

## What we own, what the library owns

| Seam | File | Notes |
| --- | --- | --- |
| Bars, money and time | `src/shared/chartfeed.ts` | Integer cents → price units, ISO → epoch ms, session-aware aggregation. Pure and tested. |
| Symbol + timeframe serving | `src/lib/rook-provider.ts` | Implements Vela's `DataProvider` port: `getBars`, `listSymbols`, `getSymbolInfo`, `getCalendar`. No `subscribe`, so no live path. |
| Theme, levels | `src/lib/vela.ts` | Colours read from the CSS tokens in `src/styles.css`; setup levels drawn as locked `hline`s. |
| The screen | `src/pages/app/Charts.tsx` | The full workspace (topbar, drawings, indicators, layouts, persistence) plus the level painting and framing policy. |
| The embedded chart | `src/components/BarChart.tsx` | Single chart, offline `data`, desk-chosen symbol; its own symbol/timeframe controls are hidden. Used by Setup, Session, the journal entry and the styleguide. |
| The script panel | `src/lib/script-panel.tsx` | Registers the rail icon, the docked panel and the run's persistence with `@luxalgo/vela/plugin`. Runs at module scope, before any workspace is built. |
| The editor body | `src/components/ScriptPanel.tsx` | React editor mounted into the panel's `body` as its own root: code area, Run, status footer. |
| The engine and the draft | `src/lib/pine.ts` | Lazy `@luxalgo/vela-pinets` import, `registerEngine('pine', …)`, the draft in `localStorage`, the run id. |

Vela's own docs and agent skills ship **inside the installed package**, versioned with the
code: `node_modules/@luxalgo/vela/docs/`, `node_modules/@luxalgo/vela/skills/` (mirrored for
agents at `.agents/skills/`). Read those, not the website, when working on this integration.

## The page, decided

These are fixes against the library's documented behaviour, not preferences. Each one matches a
paragraph in the packaged docs.

- **Daily bars are dates.** A `1D` bar is stamped `00:00:00Z` and carries that date in every time
  zone (`chartfeed.ts`). Stamping it at the session's first bar put a time on a date: the axis
  read hours and the indicators drifted.
- **The view opens on the setup's session, at a fixed candle size.** The frame is 78 bars — one
  5-minute desk session — on every timeframe, so changing timeframe changes how much *time* is on
  screen, not how wide the candles are. Framing the session's hours instead made `1h` seven bars
  wide and pushed the reader to zoom out after every switch; `1D` has only 30 bars, so it frames
  every stored day. The saved document gives back drawings, indicators, layout and timeframe, but
  not a stale viewport. The frame is applied from the chart's `load:end` event — the
  documented hook for rebuilding host visuals — which fires after the library has fitted
  the new bars itself.
- **The provider serves the whole snapshot, not the window asked for.** `getBars` gets a
  `BarRange` hint and ignores it: answering with only that window left blank space before the
  bars when the frame reached further back (a `1D` switch from a `1h` view drew an empty month).
  A 5-minute symbol is 2,299 bars, so there is nothing to save by trimming, and the chart clips
  what it paints. This is a deliberate departure from the provider rule that says to answer the
  requested window; it is safe only while the snapshot stays this small.
- **A timeframe the snapshot cannot serve is refused, not faked.** The bottombar's range chips
  ask for whatever timeframe fills their window (`1D` asks for `1m`), and the desk holds 5-minute
  bars only. `getBars` throws `DataUnavailableError` naming `5` as the finest, so the cell falls
  back to `5m`; returning an empty array instead painted a blank grid.
- **Levels have no in-chart text.** Three levels can sit a few cents apart, so any label on them
  overprints at coarse zoom or is clipped by the price scale. The colours are drawn as locked
  lines and the numbers are listed beside the chart, updating with the active symbol.
- **The levels are scrubbed from the saved document before restore.** They are redrawn on every
  visit; restoring last visit's copy stacked four more lines per load. Filtering them out keeps the
  document from growing. The filter matches a locked `hline` whose anchor price equals one of
  this symbol's own rule levels (converted to price units), because the document carries no
  owner on a drawing. A line the reader locked at any other price survives.
- **Drawings belong to the chart, not the symbol.** `clearOnSymbolChange` is off: the library
  treats the restore on first load as a symbol change and would delete the reader's work. Our own
  lines are removed and redrawn per symbol instead, so nothing stale is left on the next symbol.
- **The chrome is themed too.** `createTheme({ base, accent, radius, font })` puts Rook's leaf on
  the accent (menus, chips, the active cell outline) instead of the library's blue. The chart's
  seven canvas colours come from the same CSS tokens, read once at theme build time.
- **The session calendar is served.** `getCalendar` reports 09:30–16:00 New York per stored day,
  derived from the bars themselves, so the RTH/ETH switch and session shading have real data.

## Attribution is a licence term, not a style choice

Apache-2.0 plus the NOTICE file requires a visible attribution. The chart's watermark (on by
default, bottom-left) is what satisfies it: the workspace is created with `watermark: true`.
There is no second Vela link on the page, so do not set
`chart.renderer.set('attribution', false)` unless that link is added first.

## Getting a new release

`@luxalgo/vela` is a normal dependency with a caret range, so patch and minor releases inside
0.10 arrive with:

```sh
bun update @luxalgo/vela
bun run typecheck && bun test && bun run build
```

0.11 is a breaking release (the 0.9 → 0.10 notes renamed several UI-kit exports), so read
`node_modules/@luxalgo/vela/docs/user/upgrading.md` and `CHANGELOG.md` **before** bumping the
range, then work the list below. Never copy the library's source into this repo and never
patch inside `node_modules`: the upgrade path only stays open while the dependency is untouched.

### The contract to re-check after any bump

1. `/app/charts` paints candles and the container reports `data-chart-status="ready"`.
2. The topbar symbol search lists Rook's eight symbols with their venue badges, and picking one
   reframes the session and redraws that symbol's levels.
3. Every timeframe chip works: `5` (every stored bar), `15`, `30`, `60`, and `1D` (30 candles,
   one per stored session).
4. An indicator from the picker renders, and a drawing placed by hand survives a reload (and is not
   doubled, nor lost when the document restores).
5. The setup levels are the rule's five (fewer when two share a price) and read as locked.
6. The Vela watermark is visible.
7. Pine: the panel opens from the right rail's panel group, the template's first Run draws its
   line, a broken script reports the engine's message in the footer while the previous code
   keeps painting, and a run comes back after a reload.
8. A saved panel width and its maximized/restored state behave after a reload (widths persist with
   the shell's state document; maximization is a moment, not a placement).

## Pine Script: installed, AGPL-3.0-only

`@luxalgo/vela-pinets` and `pinets` are dependencies (`^0.3.4`, `^0.13.1`). Vela itself stays
Apache-2.0 and ships no Pine code; the addon is a separate package, under a separate licence.

**The licence decision, recorded.** `pinets` — the transpiler and runtime the addon executes —
is **AGPL-3.0-only**, so the addon is too. It is network copyleft: serving this app to other
people obliges us to offer them the Corresponding Source of the AGPL-covered code (the addon,
`pinets`, and arguably this integration around them), and it cannot be shipped as closed source.
That is a decision about *this deployment*, not about the chart library, and it now sits in the
repo: this page and `specs/003-pine-script/design.md` are where it is written down. Remove the
addon (below) to go back to Apache-2.0-only.

**What it buys.** A trader can paste a Pine v5/v6 `indicator()` or `strategy()` and run it on the
chart's own bars: plots on the price pane or in a pane of their own, and a strategy's broker-
emulated fills painted as trade markers. Nothing leaves the browser.

**Weight, measured from `bun run build` (Vela 0.10.14).** Vela's own chunk is 1,698 kB / 466 kB
gzip, the entry is 283.9 kB / 90.2 kB gzip, and the Charts route is 11.18 kB / 4.72 kB gzip. The
addon is its *own* on-demand chunk — 832.8 kB / 221.6 kB gzip — reached by a dynamic `import()`
from the Charts chunk and not preloaded with it, so a visit that only looks at candles never
fetches Pine. Only the in-process `PineEngine` is imported; the worker engine's bundle is not
part of that chunk.

**How it is wired.**

| Seam | File | Notes |
| --- | --- | --- |
| Lazy engine | `src/lib/pine.ts` | `ensurePineEngine(chart)` dynamic-imports `@luxalgo/vela-pinets` once, keeping only the `PineEngine` constructor (holding the module namespace defeats tree shaking and pulls the worker engine into the chunk). Each chart gets a fresh instance through a `WeakMap` of per-chart promises, so a grid never shares engine state. |
| The draft | `src/lib/pine.ts` | `rook:v1:script` — one draft per browser, seeded with `SCRIPT_TEMPLATE` (`//@version=6`, an overlay that plots a line). |
| The run's identity | `src/lib/pine.ts` | `RUN_ID = 'rook.pine'` and `SCRIPT_TITLE = 'My script'`: the id a reload looks for, and the legend row's name. |
| Running | `src/components/ScriptPanel.tsx` | `run()`: ensure the engine, then `handle.updateCode(source)` if a run under `RUN_ID` is live (it re-compiles in place and puts the previous code back on failure), otherwise `chart.runIndicator(source, { id: RUN_ID, language: 'pine' })`. Surface `result.error.message` on failure, then `shell.stateChanged()` and the elapsed time. Both APIs never reject, and a failed fresh run leaves no dead legend row. |
| The panel | `src/lib/script-panel.tsx` | `registerIcon('rook-script', …)` plus `registerSidePanel({ id: 'rook.script', order: 60, width: 520, minWidth: 360, maxWidth: 900, resizable: true, maximizable: true, overlay: true, placement: 'chart', header: 'none' })`. |
| The persistence | `src/lib/script-panel.tsx` | `registerStatePersistence({ key: 'rook.script.run', scope: 'cell' })`. |

**The panel, in the shell's terms.** It is a contributed side panel, not our own chrome: the
shell draws its toggle in the right rail's panel group (the rail is configured in `Charts.tsx` as
`sidebar: { top: ['objects', 'dataWindow', 'panels'], bottom: ['actions'] }`). It opens as an
overlay on the chart's right edge so the bars keep their width; the overlay's pin docks it as a
column instead, and the user's choice is saved with the shell's state. `header: 'none'` means the
shell renders no header row, so the editor draws its own — title, Run, maximize, close — and wires
those controls to `header.setMaximized()` and `header.close()`. The maximize state is a moment,
not a placement: closing restores it. The panel is registered at module scope in `Charts.tsx`
(`installScriptPanel()`, before `new VelaWorkspace`), which is what the plugin SDK requires;
a late registration would need `refreshActions()`.

**Rebinding the chart.** A panel's `onChart` is a rebind hook, not a one-shot: it runs on mount,
after a widget rebuild, and when the workspace points the panel at another active cell. The
editor stores that chart and reads it when Run is pressed (`getChart`), so a rebuild never leaves
it holding a destroyed chart. It does not need to follow symbol switches: a script re-executes
over the new market itself, and the panel holds no per-symbol content.

**Persistence, and why it does not use the indicator list.** Vela's document stores native and
manifest indicators, not scripts added ad hoc through `runIndicator`. So the panel registers a
`ext` entry instead (`registerStatePersistence`, `scope: 'cell'`):

- `serialize` reads the source off the live handle — `chart.indicators().find(h => h.id === RUN_ID)?.source` — and writes `{ script }`, or `undefined` when nothing ran. Reading the handle's own source keeps the document honest after an in-place edit.
- `restore` treats the payload as untrusted (the codec passes `ext` through opaquely): a non-object, or a missing/blank `script`, is dropped. It then awaits `ensurePineEngine(ctx.chart)` — the engine is fetched lazily, so a restore has to bring it in — and calls `ctx.addIndicator({ id: RUN_ID, name: SCRIPT_TITLE, script, language: 'pine' })`. Cell-scope restores run inside the shell's history-mute, so the indicator comes back without polluting undo, and `ctx.addIndicator` is bound to that cell's chart even when it is not the active one.

**One script per cell.** The single `RUN_ID` is what makes a reload find the run again — and it
also means Run replaces the cell's previous script. A re-run edits the study in place
(`handle.updateCode`), so a compile error leaves the working version on screen. There is one
draft per browser, not per symbol.

**Known limits.** Scripts attach to the active cell only; `request.security` resolves through
Vela's feed (our provider, so the same snapshot); `request.footprint()` answers `na` (the desk has
no order flow); `import` needs an `importResolver`, which is not provided, so a script importing a
Pine library fails to prepare. `PineEngine` runs in-process — the addon's worker engine is not
imported — so a heavy script occupies the main thread while it computes. The footer shows the
engine's own error text verbatim.

**Removing it.** Delete the `installScriptPanel()` call in `src/pages/app/Charts.tsx` (which also
removes the rail toggle), delete `src/lib/script-panel.tsx`, `src/components/ScriptPanel.tsx` and
`src/lib/pine.ts`, then `bun remove @luxalgo/vela-pinets pinets`. Nothing else imports the addon.
