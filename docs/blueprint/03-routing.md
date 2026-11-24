# 03 — Routing: three routers, one table each

Rook has three separate routing problems and they are currently solved in three different places, with
different levels of rigour. This chapter gives each one a table and a test.

```
      ┌─────────────┐   URL      ┌──────────────────────────────┐
user ─┤   browser   ├───────────►│ lib/routes.ts  (this file §1) │
      └──────┬──────┘            └──────────────────────────────┘
             │ fetch
             ▼
      ┌─────────────┐   HTTP     ┌──────────────────────────────┐
      │   Worker    ├───────────►│ worker/routes/* (this file §2)│
      └──────┬──────┘            └──────────────────────────────┘
             │
      ┌──────▼──────┐   intent   ┌──────────────────────────────┐
      │    Ninth    ├───────────►│ ninth/router.ts  (this file §3)│
      └─────────────┘            └──────────────────────────────┘
```

Diagram: [`blueprint.html` #d5](blueprint.html#d5).

---

## 1. URL routing

### The table (target: `src/lib/routes.ts`)

`layout` picks the frame: `site` (marketing nav + footer), `bare` (auth screens), `app` (desk shell).
`chunk` names the lazy import so the landing page ships alone. `guard` is the only new field.

| # | Path | Layout | Title | Guard | Chunk |
|---|---|---|---|---|---|
| 1 | `/` | site | — (brand tagline) | none | eager |
| 2 | `/pricing` | site | Pricing | none | `Pricing` |
| 3 | `/about` | site | About | none | `About` |
| 4 | `/styleguide` | site | Style guide | `dev` (hidden from nav, still served) | `Styleguide` |
| 5 | `/login` | bare | Log in | none | `Login` |
| 6 | `/signup` | bare | Sign up | none | `Signup` |
| 7 | `/app` | app | Today's desk | none (demo) | `Desk` |
| 8 | `/app/charts` | app | Charts | none | `Charts` |
| 9 | `/app/risk` | app | Risk gate | none | `RiskGate` |
| 10 | `/app/journal` | app | Journal | none | `Journal` |
| 11 | `/app/chat` | app | Ninth | none | `Ninth` |
| 12 | `/app/setup/:symbol` | app | `{{SYMBOL}} setup` | `symbol` param | `Setup` |
| 13 | `/app/session/:symbol/:date` | app | `{{SYMBOL}} session` | `symbol`, `date` params | `Session` |
| — | anything else | site or app | Page not found | — | `NotFound` |

### Param validation (the part that is currently implicit)

- `:symbol` must match `/^[A-Z]{1,5}$/` after `toUpperCase()`. Reject otherwise with `NotFound`, not an
  empty desk — an empty desk looks like a data bug.
- `:date` must match `/^\d{4}-\d{2}-\d{2}$/` **and** exist in the dataset's session list. A valid-format
  date with no data renders the session page in its `no-session` state, which explains itself.
- Params are decoded once, in `match()`. No double-decoding.

### 404 and redirect policy

| Situation | Behaviour | Why |
|---|---|---|
| Unknown top-level path | `NotFound`, site frame | keeps nav/footer so the user can leave |
| Unknown `/app/*` path | `NotFound`, **app frame** | currently correct — the desk shell is a place, not a page |
| `/app/` with trailing slash | normalise to `/app` | `normalise()` already strips trailing slashes |
| `/setup/:symbol` (missing `/app`) | redirect to `/app/setup/:symbol` | cheap, prevents dead links from old notes |
| Hash to a missing id | keep the URL, do not scroll | the retry loop in `App.tsx` gives up after 120 frames — keep that |
| Unknown query params | ignored, never 404 | `?welcome=1` is already used |

### Routing invariants (new tests)

1. Every `href`/`to` beginning with `/` in `src/**` resolves to a row in the table (F4). Implemented by
   scanning source strings and asserting against `routes`.
2. Every `layout: 'app'` path renders inside `AppShell` — assert by construction, since `App.tsx` picks
   the frame from the table.
3. Every table row has a unique `path` and a non-empty `title` (except `/`).
4. Navigation moves focus to `<main>`; already implemented in `App.tsx`, assert in the route test.

### Navigation surfaces that must read the same table

| Surface | Today | Target |
|---|---|---|
| `App.tsx` route array | inline | `routes.ts` |
| `AppShell` desk nav (5 items) | inline array | `NAV_DESK` derived from `routes.ts` |
| `Nav` / `Footer` marketing links | inline | `NAV_SITE` derived from `routes.ts` |
| Sitemap for agents (`public/llms.txt`) | does not exist | generated from `routes.ts` at build time |

---

## 2. API routing (the Worker)

### The table

Every route answers `ApiResult<T>`: `{ ok: true, data, source? }` or `{ ok: false, error, errors? }`.
`source` is `yfinance | fixture` today; `provenance` per number is the long-term goal (constitution §III).

| Method | Path | Input | Validates | Returns | Status on failure | Side effects |
|---|---|---|---|---|---|---|
| GET | `/api/health` | — | — | `{ok, mode, session, nowEt, date, fetchedAt}` | — | none |
| GET | `/api/market/universe` | — | — | instruments + `provenance:'seed'` | — | none |
| GET | `/api/market/bars` | `?symbol=` | `^[A-Z]{1,5}$` | 5-minute bars + sessionDate | 422 bad symbol, 404 no bars | none |
| GET | `/api/desk/scan` | — | — | `deskSetups()` | — | none |
| POST | `/api/risk/check` | `{plan, limits, account, session, history?}` | presence, numeric prices, session state enum | `GateVerdict` + `checkedAt` | 400 not JSON, 422 fields | **none — pure** |
| POST | `/api/simulate` | `{plan, seed?, runs?}` | numeric entry/stop, stop < entry | simulation result | 400/422 | none |
| GET | `/api/news` | `?symbols=` | ≤20 symbols | headlines | — | none |
| POST | `/api/signup` | form | `validateSignup` | `{user}` | 400/422 | none (demo) |
| POST | `/api/login` | form | `validateLogin` | `{user}` | 400/422 | none (demo) |
| POST | `/api/subscribe` | `{email}` | `validateEmail` | `{ok}` | 422 | **none — no list wired yet** |
| POST | `/api/contact` | form | `validateContact` | `{ok}` | 422 | **none — no mail wired yet** |
| GET | `/api/ninth/model` | — | — | `{configured, model}` | — | none |
| POST | `/api/ninth/turn` | `{system, messages, tools}` | same-origin, size caps, key present | SSE stream | 403 cross-origin, 503 no key, 413 too large, 502 upstream | **spends money** |
| — | `/api/*` (other) | — | — | `{ok:false,error:'Not found'}` | 404 | none |

Three observations the blueprint turns into decisions:

- **`/api/risk/check` is the product.** It is pure, it matches the UI, and it should be the first route
  documented publicly. It currently has no rate limit and no CORS policy — fine for same-origin use,
  a problem the day it becomes the public API (Phase 4).
- **`/api/subscribe` and `/api/contact` accept data and discard it.** They validate and return `ok`
  without storing or sending anything. That is a silent lie to the user and the only dishonesty in the
  codebase. Either wire them or return `501 Not implemented` — do not keep returning `ok`.
- **`/api/ninth/turn` is the only route with a cost.** Its guards (same-origin, `MAX_SYSTEM_CHARS
  40k`, `MAX_MESSAGES 40`, `MAX_TOOLS 40`) are good. It needs a per-IP token bucket before it is public,
  and it is the only route that should ever stream.

### Error taxonomy (target: one helper in `shared/contracts.ts`)

| Code | Meaning | When |
|---|---|---|
| 400 | body is not a JSON object | parse failure |
| 403 | origin not allowed | cross-origin model call |
| 404 | route or resource missing | unknown API path, no bars |
| 409 | state conflict | (future) confirming a ticket twice |
| 413 | payload too large | model turn over caps |
| 422 | fields invalid | validation returns `errors{}` |
| 429 | over budget | (future) rate limit |
| 500 | our bug | unhandled — should never reach the client unmapped |
| 501 | deliberately not implemented | unwired forms until Phase 2 |
| 502 | upstream model failed | provider error, with a 300-char detail |
| 503 | model not configured | no `MODEL_API_KEY` |

### Caching and headers

- Static assets: `run_worker_first: true` plus the Workers assets binding — already correct.
- API: currently no `cache-control`. Target: `no-store` on everything except `/api/health` (60 s) and
  `/api/market/universe` (300 s), both of which are effectively constant per deploy.
- The model stream already sets `cache-control: no-store` — keep it.

---

## 3. Agent routing (Ninth's intent router)

This is the most under-documented part of the system and the one that most affects whether Ninth feels
competent. It is deterministic, testable, and already implemented in `src/shared/ninth/router.ts`.

### Pipeline

```
question ──► normalise ──► inferStage ──► scoreEverySkill ──► filter(floor, negatives, conditions)
         ──► co-activate from leader ──► top 6 ──► allowedTools() ──► prompt.composeSkills()
```

### The score, exactly (`SCORE` in `router.ts`)

| Signal | Points | Cap |
|---|---|---|
| Keyword hit (word-boundary, phrase-aware) | **30** each | 2 hits |
| Stage matches the skill's stages | **20** | once |
| Asset word (symbol/name) | **15** | once |
| Co-activation from the leading skill | **10** | once per turn |
| Turn came from a fired watch ("signal") | **25** | once |
| Tie-break: `(100 - priority) / 100` | < 1 | — |
| **Floor** — below this a skill is not offered | **10** | — |

Locked skills: a `negativeKeywords` hit or `requiresSetup` with no setup returns `-Infinity` and a
reason string (`neg:*`, `cond:no-setup`). The reasons are surfaced by `/trace`, which is why the router
is debuggable rather than mysterious.

### Stages and their trigger words (`STAGE_HINTS`)

| Stage | Words that imply it |
|---|---|
| `decide` | should i, should we, buy, enter, take it, size it, how many shares, ticket it, confirm |
| `evaluate` | why, blocked, explain, reason, what if, simulate, replay, odds, chance, worth, risk |
| `manage` | journal, log it, remember, forget, change my, update my, set my, save this |
| `discover` | what, where, show, scan, list, any, which, price, quote, levels, setups, news |

### The 12 skills, by stage and priority

| Skill | Stages | Priority | Notable |
|---|---|---|---|
| `desk.core` | discover, evaluate, decide | 90 | the always-relevant frame |
| `desk.news` | discover | 75 | |
| `desk.limits` | manage | 70 | |
| `desk.learn` | manage | 68 | |
| `desk.memory` | manage | 65 | |
| `desk.journal` | manage, discover | 60 | |
| `desk.ticket` | decide, manage | 55 | |
| `desk.sim` | evaluate | 50 | **`requiresSetup: true`** |
| `desk.setups` | discover, evaluate | 45 | |
| `desk.levels` | discover, evaluate | 40 | |
| `desk.risk` | evaluate, decide | 30 | |
| `desk.gate` | evaluate, decide | 20 | the veto skill |

### Tool routing

`ALWAYS_TOOLS` (callable whatever routed, so honesty is never optional):
`activate_skills`, `tool_search`, `ask_user`, `route_why`, `get_quote`, `read_account`, `read_memory`.

Everything else comes from the routed skills' declared `tools`, filtered to tools that actually exist
(`allowedTools`). That filter is the reason the catalog can list a tool before it is built — and the
reason a typo in a skill's tool list fails silently, which is worth a test.

### Slash commands are routes too (`commands.ts`)

| Command | Effect | Bypasses the model |
|---|---|---|
| `/memory` | show the four stores | yes |
| `/trace` | last turn's route, scores, reasons, tool calls | yes |
| `/review` | score the last turn | yes |
| `/draft` | draft a strategy from text | yes |
| `/watch` | add/list/remove price watches | yes |

Every one of them must work with no model configured. That is the offline-demo invariant and there are
already tests for it.

### Routing invariants (tests to add)

1. No skill can be routed without a reason string; `/trace` never shows a rule the user cannot read.
2. `route(q)` is stable for the same input and catalog (no `Math.random`, no clock).
3. A `requiresSetup` skill is never offered on an empty desk.
4. Every tool named in every skill exists in the registry (catches the silent-filter class).
5. `inferStage` covers each stage's canonical phrase — a table-driven test, not prose.

---

## The routing decision that matters most

**Do not add a second router.** The temptation, once Phase 2 lands, is to give automations their own
intent matching. Resist it: an automation's trigger is a *schedule or a price*, not language. Anything an
automation does with language goes through `ninth/router.ts` so there is exactly one place where "what
did the user mean?" is decided.
