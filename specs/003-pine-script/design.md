# 003 — Pine Script on the chart (plan)

## Goal

A trader can run their own Pine Script on `/app/charts`: paste an `indicator()` or `strategy()`,
press Run, see it on the chart's own bars. Presets make the feature usable without writing code.
Nothing leaves the browser and nothing can place an order.

## Decision: adopt the addon, and say so

`@luxalgo/vela-pinets` (`0.3.4`) + `pinets` (`0.13.1`) are **AGPL-3.0-only**, unlike Vela's
Apache-2.0 core. Installing them brings network-copyleft obligations into any deployment of this
app: users served over a network must be offered the Corresponding Source of the AGPL code. The
alternative — writing our own engine against Vela's `ScriptingEngine` port — buys nothing here: a
Pine-compatible runtime is the AGPL part, not the wiring.

So: adopt it, isolate it, and record the licence in `docs/vela.md` and in the UI. The desk's own
promise is unchanged — a Pine strategy paints fills, it does not decide a trade.

## Shape

1. **Engine, lazily.** Vela asks for an engine synchronously at chart construction; the addon is a
   ~1.9 MB module. `src/lib/pine.ts` returns a facade that implements the two-method port
   (`prepare`, `execute`) and awaits a dynamic `import()` in `prepare`, which Vela always calls
   before `execute`. `PineWorkerEngine` runs scripts off the main thread; `PineEngine` is the
   fallback when a worker cannot be created.
2. **One editor, one chart.** A `<details>` panel under the chart, closed by default, so the addon
   is not fetched on page load (verified: no addon request until the panel opens or a saved script
   restores). Presets: EMA 20/50, RSI 14, EMA cross strategy.
3. **Errors are text, not exceptions.** `chart.runIndicator` never rejects; the panel prints the
   compile/runtime message next to the Run button and leaves the previous state alone.
4. **Persistence is ours.** Vela's document does not store ad-hoc scripts (a saved document held
   `indicators: { manifest: [], natives: ['volume'] }` after running two scripts). The desk keeps
   `desk:v1:pine:scripts` (max 8, newest first) and re-runs it on the active chart once `ready()`
   resolves. The editor lists them; removing one removes its legend row and its stored copy.

## Scope boundary

- One cell: scripts attach to the active chart, not to every cell in a grid.
- No `import` support (no `importResolver`), no `request.footprint()` (no order flow).
- No strategy results in the Journal: fills are chart markings only.

## Checks

- `bun run typecheck`, `bun test`, `bun run build` (record chunk sizes).
- Browser: editor opens → addon fetched only then; EMA plots on the price pane; RSI opens its own
  pane; the strategy paints entry/exit markers; a broken script shows `Undeclared identifier …`;
  the kept script returns after reload; removing the chip removes it from the chart.
- Deploy to the preview site and repeat the editor check on the live origin.
