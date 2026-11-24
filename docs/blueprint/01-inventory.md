# 01 — What is actually in the repo

Evidence first. Everything below was read or run on 2026-11-24, not taken from a spec's claims about
itself. Where a spec and the code disagree, this page says so — that disagreement is the single most
useful thing in the document.

## Verified health

| Check | Command | Result |
|---|---|---|
| Types | `bun run typecheck` (`tsc --noEmit`) | **clean** |
| Tests | `bun test` | **445 pass, 0 fail**, 15,035 assertions, 30 files, 4.4 s |
| Build | `bun run build` | **ok**, 7.7 s, 43 JS chunks, 4.2 MB client |
| Install | `bun install` | 175 packages, 15.8 s |
| Node deps | `package.json` | 12 runtime, 10 dev — no framework beyond React/Vite/Hono |

That is a healthier baseline than most projects at this stage. The problems are structural, not
functional: nothing here is broken, but several things are *unplanned*.

## Size and composition

| Area | Files | Lines | Nature |
|---|---|---|---|
| `src/shared/ninth/` | 42 | 6,456 | The agent harness: router, gate, loop, memory, learning, audit, 4 tool groups, 12 skills |
| `src/shared/` (rest) | 26 | 4,244 | Domain + engine: risk, sizing, simulate, setups, ticket, journal, stats, market, dataset, time |
| `src/lib/` | 16 | 1,521 | Browser adapters: storage, desk hooks, api, vela, pine, ninth runtime/client |
| `src/components/` | 43 | 2,586 | Presentational primitives (Badge, Verdict, Modal, TradeCard…) |
| `src/pages/` | 16 | 3,104 | Six marketing pages, seven desk surfaces, shell/header |
| `src/sections/` | 10 | 489 | Landing page sections |
| `src/worker/` | 2 | 380 | Hono app, 13 routes |
| **Total `src/`** | **158** | **14,842** | of which **4,291 lines are tests** (30 files) |

Test-to-source ratio is 1:2.5 by line count. That is unusually high and it is the reason the blueprint
can propose structural changes safely: there is a net.

## The layers that actually exist (unwritten, but real)

Read the imports and a clean layering is already there, just undocumented and unenforced:

```
L0 domain    market dataset fixtures time rng stats validate news         (no deps on anything above)
L1 engine    risk sizing simulate setups ticket journal                  (L0 only)
L2 agent     ninth/{types,router,gate,registry,loop,prompt,provider,
             memory,learning,audit,commands,watch,review,draft,verdict,
             tools/*, skills/*}                                          (L0+L1)
L3 adapter   lib/{storage,desk,api,ninth-client,ninth-runtime,vela,
             pine,rook-provider}                                         (L2)
L4 edge      worker/index.ts                                             (L0+L1+L2, never L3/L5)
L5 view      pages/* sections/* components/*                             (L3/L4)
```

Nothing in `src/shared/` imports React, the DOM, or `fetch`. Nothing in `src/worker/` imports a
component. That discipline is currently kept by habit, and habit is not a guarantee — hence
`02-architecture.md`'s boundary check.

## Every route that exists

**Pages** (`src/App.tsx`, plus two dynamic matchers):

| Path | Layout | Component | Notes |
|---|---|---|---|
| `/` | site | `Home` | landing, nav overlays hero |
| `/pricing` | site | `Pricing` | four plan cards, no checkout |
| `/about` | site | `About` | |
| `/styleguide` | site | `Styleguide` | dev page, **public in production** |
| `/login` | bare | `Login` | demo auth |
| `/signup` | bare | `Signup` | demo auth |
| `/app` | app | `Desk` | today's desk |
| `/app/charts` | app | `Charts` | Vela + Pine addon |
| `/app/risk` | app | `RiskGate` | gate playground |
| `/app/journal` | app | `Journal` | calendar + rows + export |
| `/app/chat` | app | `Ninth` | full-page assistant |
| `/app/setup/:symbol` | app | `Setup` | matched by `match()`, not in the table |
| `/app/session/:symbol/:date` | app | `Session` | matched by `match()`, not in the table |
| anything else | site | `NotFound` | inside `/app/*` renders the desk shell instead |

**API** (`src/worker/index.ts`): `GET /api/health`, `GET /api/market/universe`,
`GET /api/market/bars`, `GET /api/desk/scan`, `POST /api/risk/check`, `POST /api/simulate`,
`GET /api/news`, `POST /api/signup`, `POST /api/login`, `POST /api/subscribe`,
`POST /api/contact`, `GET /api/ninth/model`, `POST /api/ninth/turn`, plus a catch-all 404.

**Storage**: `localStorage`, namespaced `rook:v1:*`, via `src/lib/storage.ts` (`readStore`,
`writeStore`, `useStored`). No cookies, no server session, no database.

## The five findings that motivate this blueprint

### F1 — HeroUI ships 708 kB for a page nobody visits

Evidence: `@heroui/react` is imported by exactly one file, `src/components/ui/heroui-drawer.tsx`,
which is imported only by `src/components/ui/demo.tsx` and `src/components/ui/sidebar-nav.tsx`, and
`demo.tsx` is imported only by `Styleguide.tsx`. Build output: `Button-D5v_GNEt.js` = **708.15 kB
(281.51 kB gzip)** — the largest single first-party chunk in the app.

Meanwhile the repo already has its own `src/components/Modal.tsx` (used by 7 files) and
`heroui-drawer-utils/index.css` is imported by **zero** files.

**Action:** delete the HeroUI chain, drop `@heroui/react` + `@heroui/styles`, rebuild the styleguide
drawer demo on `Modal`. Removes 708 kB from the graph and one whole styling dependency.

### F2 — Two copies of the vendored skill pack

`.agents/skills/` and `agent/skills/` both contain the same nine Vela skills. They are *not*
byte-identical: `diff` shows only YAML line-folding differences, so they are the same upstream content
serialised twice. `.claude/skills/*` are symlinks into `.agents/skills/`, which makes `.agents/skills`
the canonical copy and `agent/skills` dead weight (92 kB, 10 files, plus a second place to update).

**Action:** delete `agent/skills/`, keep `.claude/skills` symlinks, document `.agents/skills` as the
one install location in the blueprint and in `README.md`.

### F3 — 36 MB of development screenshots are in git

`artifacts/` holds **202 PNGs and one JSON export** (36 MB) — build/QA evidence from the styling work
(`bug-clip-before.png`, `charts-full-1440.png`, …). They are useful during a change and dead weight in
a clone. `public/images/` separately holds the three real product photos (224 kB total), which are the
ones that ship.

**Action:** move the curated handful to `docs/media/`, delete the rest, and keep history in git. Add a
`artifacts/` ignore rule so it cannot regrow.

### F4 — The route table is code, so nothing can test it

`routes` is an array inside `src/App.tsx`, the nav items are a second array inside
`src/pages/app/AppShell.tsx`, the footer has a third list, and two dynamic routes are matched outside
the table with `match('/app/setup/:symbol', …)`. Nothing verifies that every nav link resolves, and
nothing can generate a sitemap or an `llms.txt` from the truth.

**Action:** extract `src/lib/routes.ts` as the single table (path, layout, title, guard, chunk), have
`App.tsx`, `Nav`, `AppShell`, `Footer` and the tests read it, and add a test that every internal href
in the repo resolves to a known route.

### F5 — Spec 004 describes modules that do not exist

`specs/004-ninth-harness/design.md` documents `src/shared/ninth/skills/packs/*.ts` (budgeted
long-form playbooks) and `POST /api/ninth/review` (a cheap structured-output tier). Neither exists:
there is no `packs/` directory, and the only Ninth routes in the worker are `/api/ninth/model` and
`/api/ninth/turn`.

This is spec drift, and drift is worse than a gap because it makes the design docs untrustworthy.

**Action:** decide per item — build, or move to an explicitly-labelled "planned" section. The blueprint
puts both under Phase 3 with exit criteria, so they stop being invisible.

## Smaller things worth naming

| Observation | Evidence | Consequence |
|---|---|---|
| Config naming mismatch | `wrangler.jsonc` name `rook-desk`; `deploy.json` module path `dist/rook_desk/index.js`; `postbuild.mjs` asserts they agree | A rename in one place fails the deploy *after* a successful build. Already guarded by a good error message — keep it, and document the pair. |
| Two "ninth panel" files | `src/components/NinthPanel.tsx` (291 lines, the UI) and `src/lib/ninth-panel.tsx` (87 lines, the Vela plugin registration) | Not duplication, but the names read as one. Rename the plugin to `vela-ninth-plugin.tsx`. |
| Demo auth is unlabelled in code | `POST /api/login` fabricates a name from the email and returns `level: '1–2 years'` | Acceptable for a demo, must be visibly labelled and must not sit behind a pricing page that implies purchase. |
| Public styleguide | route `/styleguide` in the production table | Ships a design-system page to strangers. Keep it — it is a credibility artefact — but it must not carry the only use of a 708 kB dep (F1). |
| No layer enforcement | layering holds by convention | One import away from a React dependency inside `shared/`, which would break the Worker build. |

## What is genuinely strong, and must not be redesigned

- **`src/shared/` is pure.** Same functions run in the browser, in the Worker and in `bun test`. That
  is why 445 tests exist without a DOM and why `/api/risk/check` can be trusted to match the UI.
- **The gate is a pure function.** `checkPlan({plan, limits, account, session, history}) → GateVerdict`
  with `RuleId`s. It is the product's spine and the one thing no redesign may touch.
- **The journal is a schema, not a table.** `JOURNAL_SCHEMA = 2`, capped at 2,000 rows, 280-char notes,
  explicit verdict and source enums, and a real export format.
- **Budgets are declared constants.** `MAX_STEPS = 6`, `MAX_TOKENS_OUT = 24_000`, `MAX_WRITES_PER_TURN
  = 3`, `AUDIT_MAX_ROWS = 500`, `PENDING_TTL_MS = 10 min` — all in `types.ts`/`gate.ts`, all testable.
- **The Worker is a proxy, not a brain.** It holds the model key and refuses cross-origin calls; the
  loop, tools and gate live in the browser. That is the right split for a paper desk and it is already
  implemented.

## Reading the rest of this blueprint

`02` fixes boundaries, `03` fixes routing, `04` fixes lifecycle, `05` records the framework decisions,
`06` specifies each surface, `07` sequences the work, and [`blueprint.html`](blueprint.html) draws all
of it.
