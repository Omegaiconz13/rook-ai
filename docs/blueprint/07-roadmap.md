# 07 — Roadmap to the finished product

This supersedes the phase list in
[`specs/research/minara-ai/07-build-plan.md`](../../specs/research/minara-ai/07-build-plan.md). That plan
was written from Minara's shape; this one is sequenced by *what the repo actually needs*, which is
different: Rook is not missing features first, it is missing **hygiene and a stated end state**.

## The end state, in one paragraph

A stranger opens Rook, and within one screen understands that it refuses to predict. They open a paper
desk that runs on a labelled snapshot of real bars, see four kinds of setup, turn one into a sized plan,
and watch fifteen deterministic rules decide whether it is allowed — and when it is not, they learn why,
in numbers. Every decision they make, and every refusal the desk makes, is in a journal they can export.
An assistant called Ninth answers only from that desk, shows its evidence, and cannot act without a human
click. It works with no account, no key, no network. The same rules are readable by an agent through
`llms.txt` and a skill, and the same gate is callable over HTTP and returns the same verdict the page
shows.

That is the whole product. Nothing on that path requires custody, a wallet, a broker, or a live feed.

---

## Phase 0 — Decide (this document)

**Deliverable.** `docs/blueprint/` and `blueprint.html`.
**Exit criteria.** The five findings in `01-inventory.md` have an owner and a phase. The layer rule, the
route table and the four state machines are written down. Merged.
**Effort.** Done.

---

## Phase 1 — Hygiene (1 day, zero behaviour change)

| # | Task | Files | Done when |
|---|---|---|---|
| 1.1 | Remove HeroUI chain (F1) | delete `components/ui/{heroui-drawer,demo,sidebar-nav}.tsx`, `ui/heroui-drawer-utils/`; strip 5 `@import`s from `styles.css`; rebuild styleguide drawer on `Modal`; drop `@heroui/*` | `bun run build` largest first-party chunk < 300 kB; styleguide still demonstrates a drawer |
| 1.2 | Remove `motion` (0 imports) and resolve `pinets` | `package.json` | `bun install` clean; chart still renders |
| 1.3 | Canonical skills (F2) | delete `agent/skills/`; note `.agents/skills` in `README.md` | `.claude/skills` symlinks still resolve |
| 1.4 | Artifacts out of git (F3) | move ≤6 curated images to `docs/media/`; delete rest; ignore `artifacts/` | clone size drops from ~40 MB to <5 MB |
| 1.5 | Route table (F4) | new `src/lib/routes.ts`; `App.tsx`, `Nav`, `AppShell`, `Footer` read it | new test: every internal href resolves |
| 1.6 | Layer check | new `scripts/check-layers.mjs`; `"check"` script | `bun run check` fails on a deliberate `shared/ → react` import |
| 1.7 | API contracts | new `src/shared/contracts.ts` (`ApiResult<T>`, status map); worker uses it | response shape is one type, asserted by a test |

**Exit criteria.** `bun run check` and `bun test` green; build ≤ 15 s; no route changes; no new dependency;
total client payload < 3.5 MB.

---

## Phase 2 — Honesty (2 days)

The only phase that fixes things that are currently *untrue*.

| # | Task | Why |
|---|---|---|
| 2.1 | `/api/subscribe` and `/api/contact` either store/send or return `501` with "not connected yet" | they currently accept data and discard it while returning `ok` |
| 2.2 | Label demo auth in the UI and in `README.md`; no pricing CTA that implies purchase | `POST /api/login` fabricates a user |
| 2.3 | Stale-data state on every surface (`SESSION_DATE` vs now, `fetchedAt`) | a desk showing yesterday's bars as "now" is the failure mode this product exists to prevent |
| 2.4 | `localStorage` quota + schema-migration handling (`rook:v1` → `rook:v2`) | never lose a journal row |
| 2.5 | Reconcile spec 004 drift (F5): delete `skills/packs/*` and `/api/ninth/review` from the spec, or move them to a "planned" section | untrustworthy specs poison future decisions |
| 2.6 | Provenance on every displayed number, via `SourceBadge` | constitution §III, currently partial |

**Exit criteria.** No surface can be read as a promise it cannot keep. Every number has a source chip.
A user can export the journal and re-import it without loss.

---

## Phase 3 — The missing product surface: paper automations (4–6 days)

The one thing that turns a demo into a habit, and the only phase with real design work.

| # | Task | Files |
|---|---|---|
| 3.1 | Automation domain types (`Trigger`, `Step`, `Delivery`, `permission`) | new `src/shared/automations.ts` |
| 3.2 | Pure runner `runPlan(plan, ctx)` reusing `setups`/`simulate`/`checkPlan`/`journal` | new `src/shared/automations/run.ts` |
| 3.3 | Schedule evaluation with an **injected clock** (no `Date.now()` inline) | new `src/shared/automations/schedule.ts` |
| 3.4 | Price triggers reusing `watch.ts` semantics; no second watcher | `automations/triggers.ts` |
| 3.5 | UI: list, editor, **Test** (writes nothing), run log | new `pages/app/Automations.tsx` + route |
| 3.6 | Permission ladder capped at `confirm-plan`; no `hands-off` | `automations.ts` |
| 3.7 | `check-condition` steps may never call a model | type system + test |

**Exit criteria.** Create "weekdays 09:00 → scan → if opening-range setup → draft plan → notify"; Test
describes the run and writes no journal row; Run once writes exactly one; the same automation evaluated
twice at a pinned clock produces identical results; a blocked plan still journals its refusal.

**Deliberate omission.** No `hands-off` level, even though it is paper. A desk that fills without a human
teaches the wrong reflex.

---

## Phase 4 — Proof and distribution (3–4 days)

Cheap, and it makes everything before it legible.

| # | Task | Notes |
|---|---|---|
| 4.1 | ✅ `public/llms.txt` + `public/docs/*.md` served as `text/markdown` | shipped; hand-written for now, moves to generation from `routes.ts` when 1.5 lands |
| 4.2 | `skills/rook-desk/` (SKILL.md, setup.md, references, version-check) | structure copied from Minara's MIT pack; refusals are the skill's core rule |
| 4.3 | `/benchmark` page projecting the journal (no new store) | cannot be faked: it is a pure function of the audit log |
| 4.4 | Read-only API: `GET /v1/rules`, `POST /v1/check-plan`, `GET /v1/journal`, `GET /v1/benchmark` — no auth, 60 req/min/IP, **no model calls** | Rook's version of a structured-output API, free |
| 4.5 | `docs/MEDIA.md` + 6 curated screenshots | replaces the 36 MB `artifacts/` |

**Shipped early.** 4.1 is done ahead of Phases 1–3 because it is the cheapest way to make the
product legible: `public/llms.txt` plus five documents (`index`, `rules`, `journal`, `ninth`,
`skill`), a `GET /llms.txt` and `GET /docs/:file` route in the Worker that serves them as
`text/markdown; charset=utf-8` with `Link: </llms.txt>; rel="llms"`, an allowlist so a typo
cannot return the SPA shell as a document, and ten tests in `src/worker/docs.test.ts`. The
documented `POST /api/risk/check` examples are transcripts of real responses.

**Exit criteria.** An agent can read the rules and call the gate and get the same verdict string the UI
shows. The benchmark page reconciles exactly with the journal export (tested). Installing the skill into a
fresh harness produces a desk action, not a lecture.

---

## Phase 5 — History and real backtests (1–2 weeks)

Only after 1–4. This is the phase that invites claims, so it goes last.

1. Dataset loader for multiple labelled sessions with `source`, `asOf`, `delayedByMinutes`.
2. Backtest runner replaying sessions through `setups → simulate → stats`.
3. Metrics page using the Academy vocabulary (total return, max drawdown, win rate, avg R, exposure).
4. Optimiser **only with** a train/test split and an explanatory warning.

**Exit criteria.** Determinism test (same session twice → byte-identical output); a sweep returns a table,
not a headline number.

---

## Risk register

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Phase 3 grows a second intent router | high | medium | `03-routing.md` §"the decision that matters most": all language goes through `ninth/router.ts` |
| R2 | Automations introduce wall-clock time and break replay | high | high | injected clock, enforced by test |
| R3 | HeroUI removal breaks the styleguide | medium | low | rebuild on `Modal`, keep the demo section |
| R4 | `deploy.json` / `wrangler.jsonc` drift | medium | high (failed publish after green build) | `postbuild.mjs` guard + checklist |
| R5 | Public read-only API is scraped/abused | medium | low | no model calls on those routes; IP rate limit |
| R6 | A skill (Phase 4.2) rephrases a refusal into advice | medium | high | the skill's first rule is the refusal contract; test with a blocked plan |
| R7 | Scope creep toward custody because "Minara does it" | low | fatal | `08-risks-and-non-goals.md` non-goals 1–8 |
| R8 | Backtests on one session produce false confidence | high | high | phase ordering + train/test split + explicit warning |
| R9 | Benchmark page drifts from journal (someone adds a second store) | medium | high | projection test |

## Definition of finished (per release, not per phase)

- `bun run check` clean, `bun test` green, build within budget.
- Every user-visible number has provenance and a stale check.
- No new dependency without an ADR entry in `05-frameworks.md`.
- Any edited spec is annotated "superseded by blueprint §" rather than silently updated.
- The demo works with the network off.
- The word "paper" appears wherever money could be imagined.

## What would make this roadmap wrong

If the goal were to compete with Minara as a *product with users*, the ordering is wrong: distribution
(Phase 4) would come first and automation later. This roadmap assumes the goal is a **credible, finished
artefact** — a desk that is correct, legible, and honest — which is what the repo's own constitution asks
for. If that assumption changes, `06-gap-analysis.md` in the Minara research is the map for the other path.
