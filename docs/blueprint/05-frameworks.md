# 05 — Frameworks: the decisions, recorded

Each decision below is written as a record: context, options, choice, consequence. The point is that a
future contributor can disagree with a decision *and know what it cost*, instead of silently reversing
it.

## The stack, in one table

| Concern | Choice | Version | Status |
|---|---|---|---|
| Language | TypeScript, `strict`, `noUnusedLocals`, `noUnusedParameters` | 5.9 | keep |
| UI runtime | React | 19.3 | keep |
| Build | Vite + `@vitejs/plugin-react` + `@tailwindcss/vite` + `@cloudflare/vite-plugin` | 8.3 | keep |
| Styling | Tailwind 4 (`@theme` tokens in `src/styles.css`) | 4.3 | keep |
| Component base | own primitives in `src/components` (43 files) | — | keep |
| Component library | HeroUI | 3.2.8 | **remove** |
| Icons | `lucide-react` | 1.60 | keep |
| Animation | `motion` | 14.4 | **remove (unused)** |
| Charts | `@luxalgo/vela` (+ `@luxalgo/vela-pinets` for Pine) | 0.10 / 0.3 | keep |
| Pine support | `pinets` | 0.13 | verify (no direct import) |
| Edge | Hono on Cloudflare Workers + Assets | 4.13 | keep |
| Tests | `bun test` (bun:test), no DOM | 1.4.4 | keep |
| Package manager | bun (lockfile committed) | 1.4 | keep |

Runtime dependencies after this blueprint: **12 → 9** (drop `@heroui/react`, `@heroui/styles`, `motion`),
or **8** if `pinets` is not a required peer of the Vela Pine addon.

---

## ADR-1 — React 19 + Vite SPA, not a framework with SSR

**Context.** The product is a desk: client state (limits, journal, tickets) in `localStorage`, a Worker
for HTTP, and a landing page that needs to be fast and indexable. There is no per-user server render.

**Options.** Next.js/Remix (SSR, routing, server actions) · Astro (islands, static-first) · Vite SPA +
separate Worker.

**Decision. Vite SPA.** Every desk surface is interactive and unauthenticated-demo; SSR would add a
runtime, a build mode, and a second place state could live. The Worker already provides the API and
serves the SPA (`not_found_handling: single-page-application`). Landing SEO is handled by static HTML
+ the `llms.txt` work in Phase 1, not by a renderer.

**Consequence.** We own routing, data loading and error boundaries. Accept that cost (it is ~90 lines)
and do not re-litigate it per feature.

---

## ADR-2 — Keep the hand-written router; extract the table

**Context.** `src/lib/router.tsx` is ~90 lines: `useSyncExternalStore`, `navigate`, `match`, `Link`,
scroll/focus restoration. It works, it is tested by using the app, and it has no dependency.

**Options.** TanStack Router (typed routes, loaders) · React Router 7 · keep + extract table.

**Decision. Keep, and move the route list out of `App.tsx` into `src/lib/routes.ts`.** Typed routes would
be nice; the router's *table* being untestable is the actual problem (F4), not the matching logic.

**Consequence.** We forgo code-split-per-route conventions and type-safe params; in exchange, adding a
route stays a one-line change plus a chunk name, and the table can generate nav, sitemap and tests.

---

## ADR-3 — `localStorage` + `useSyncExternalStore`, no state library

**Context.** One user, one browser, no accounts, no server state. Every persisted value is
`rook:v1:{limits,account,user,seed,journal,ninth:*}`.

**Options.** Zustand/Redux (client store) · TanStack Query (server cache) · keep hooks + storage.

**Decision. Keep.** `src/lib/desk.ts` already exposes `useLimits`, `useAccountState`, `useUser`,
`useSeed`, `readJournal`; `storage.ts` is the only writer. A store library would add a second source of
truth next to `localStorage`, which is exactly the bug class we cannot afford in a product whose value
is auditability.

**Consequence.** Two obligations: **(a)** a versioned envelope + migration function before the schema
changes again (`JOURNAL_SCHEMA` is already 2), and **(b)** every write handled for quota errors with a
visible message. Both are in the roadmap; neither exists today.

---

## ADR-4 — Remove HeroUI; the design system is ours

**Context.** Measured, not assumed:

- `@heroui/react` is imported by **one** file (`components/ui/heroui-drawer.tsx`), reachable only from
  `components/ui/demo.tsx` → `pages/Styleguide.tsx`.
- `@heroui/styles/*` is imported **five times in `src/styles.css`**, i.e. in the global stylesheet of
  every page, including the landing page.
- Build output puts it in `Button-D5v_GNEt.js` = **708 kB (281 kB gzip)**, the largest first-party chunk.
- `components/ui/heroui-drawer-utils/index.css` is imported by zero files.
- The repo already has `components/Modal.tsx` used by 7 files, doing the same job.

**Options.** Keep HeroUI for one drawer · replace with the existing Modal · adopt a different library.

**Decision. Delete the chain**: `heroui-drawer.tsx`, `demo.tsx`, `sidebar-nav.tsx`,
`heroui-drawer-utils/`, the five `@import`s, and both `@heroui/*` dependencies. Rebuild the styleguide's
drawer demo on `Modal`.

**Consequence.** −708 kB of JS, −5 CSS imports, −2 dependencies, no visual change (the drawer's surface
already came from our tokens). The styleguide keeps demonstrating a drawer, just ours.

---

## ADR-5 — Vela for charts, Pine as an on-demand addon

**Context.** `@luxalgo/vela` is used by 9 files; `@luxalgo/vela-pinets` by 1 (`src/lib/pine.ts`), fetched
on demand from the Charts page. The Vela chunk is 1,672 kB (457 kB gzip) and it is *correct* that it is
large.

**Decision. Keep both, and keep them out of every route except `/app/charts`.** Chart code must never be
imported by a landing section or by `shared/`. The Vela theme lives in `src/lib/vela.ts` and reads our
CSS tokens, so charts cannot drift from the brand.

**Consequence.** Charts are the only heavy route; a performance regression there is visible in one number.
`pinets` (0 direct imports) must be verified as a required peer of `vela-pinets` before removal — if it
is, keep it and say why in `package.json`'s comment-free world via this ADR.

---

## ADR-6 — Tailwind utilities + `@theme` tokens, no CSS-in-JS

**Context.** `src/styles.css` (324 lines) defines the whole visual language: `--color-bg #050906`,
`--color-leaf #7ee068`, panel/line/glow tokens, and `--font-sans` (Albert Sans) / `--font-mono`
(JetBrains Mono). Components consume tokens, not hex.

**Decision. Keep.** No CSS-in-JS, no second styling system. A component may add utilities; it may not
introduce a colour that is not a token.

**Consequence.** `Styleguide.tsx` is the enforcement surface: if a new pattern is not there, it is not in
the system. That is why the styleguide stays public.

---

## ADR-7 — Hono on Workers + Assets, model key at the edge only

**Context.** One Worker, 240 lines, 13 routes, `run_worker_first: true`, SPA fallback via the assets
binding. The model key is a Worker secret; the browser never sees it.

**Options.** Pages Functions · bare `fetch` handler · Hono · a separate Node server.

**Decision. Keep Hono.** It costs one dependency and gives routing, `c.req.json()`, and `c.json()` with
types. Split into `worker/routes/*.ts` when it crosses ~400 lines, not before.

**Consequence.** Two manifests must agree: `wrangler.jsonc` (`name: rook-desk`) and `deploy.json`
(`./dist/rook_desk/index.js`). `scripts/postbuild.mjs` already fails the build loudly if they drift —
keep that guard and add it to the release checklist.

---

## ADR-8 — `bun test`, no DOM, no e2e for now

**Context.** 445 tests, 15,035 assertions, 4.4 s, zero DOM. Mocking `localStorage` and `fetch` is done
through injected ports (`src/shared/ninth/testctx.ts`), which is why the harness is testable at all.

**Decision. Keep.** Add three test *classes* before adding any framework: layer-boundary check (script),
route-table check, and Worker contract tests using `app.request()` (Hono supports it with no server).

**Consequence.** Browser behaviour is verified by hand and by `artifacts/` screenshots today. When the
desk gains automations (Phase 2) the scheduler deserves a real clock-injected test suite; a Playwright
smoke test is justified only after that, and only for the confirm flow.

---

## ADR-9 — Model access through an OpenAI-compatible proxy, no SDK

**Context.** `lib/ninth-client.ts` posts to `/api/ninth/turn`; the Worker forwards to any
OpenAI-compatible `/chat/completions` with `MODEL_BASE_URL`, `MODEL_NAME`, `MODEL_API_KEY`. With no key,
Ninth answers deterministically (`answerNinth`).

**Decision. Keep.** No vendor SDK. The loop (`loop.ts`), the SSE reader (`provider.ts`) and the tool
schema are ours, ~200 lines, and testable with a fake model.

**Consequence.** We maintain a small amount of provider glue and get provider independence, a working
offline demo, and no supply-chain surface in the hot path. Any future "use the Vercel AI SDK" proposal
must first delete a working, tested implementation.

---

## ADR-10 — Data is a build artefact, never a live feed

**Context.** `scripts/fetch_bars.py` writes `src/shared/data/market.json` + `meta.json` from yfinance
(~30 sessions of 5-minute bars, integer cents, bar index from session open so gaps are visible). The app
labels fetch time and never claims real-time.

**Decision. Keep snapshot-at-build.** Provenance (`seed`/`live`/`fallback`/`user`) is already a type in
`market.ts`, and `SourceBadge` renders it.

**Consequence.** No API keys in the client, no rate limits, fully reproducible sessions — and the honest
constraint that Rook cannot answer "what is the price *now*". That is a product position, not a gap.

---

## Performance budgets (measured today, enforced after Phase 1)

| Route | Budget (gzip JS) | Today |
|---|---|---|
| `/` (landing) | ≤ 180 kB | 90 kB `index` + shared chunks |
| `/app/*` (desk) | ≤ 260 kB | ~110 kB after HeroUI removal |
| `/app/charts` | ≤ 700 kB | 457 kB Vela + 10 kB glue (lazy) |
| Any route | 0 new deps without an ADR | — |
| Build time | ≤ 15 s | 7.7 s |
| Test suite | ≤ 10 s | 4.4 s |

Total client payload is 4.2 MB across 43 chunks; after the HeroUI and dead-dependency removals the
expected total is ~3.4 MB with the largest *first-party* chunk below 300 kB.

## Dependency policy

A new runtime dependency is accepted only if all four hold:

1. It removes more code than it adds (measured, not guessed).
2. It has no CSS side effects that our tokens cannot control.
3. It is replaceable by <150 lines in `shared/` **or** it is genuinely outside our competence (charts).
4. It does not run in the model path or in `shared/`.

`motion` is the cautionary example: added for landing animation, imported by zero files, still in
`package.json`. The policy exists so that never happens again.
