# 02 — Architecture: boundaries, layers, and the target tree

The code already behaves like a layered system. This chapter makes the layering **explicit, enforced,
and small enough to hold in one head**. Nothing here proposes a rewrite: it names what exists, forbids
what must never happen, and moves a handful of files that are in the wrong place.

Diagram: [`blueprint.html` #d1](blueprint.html#d1) (layer stack with allowed and forbidden edges).

## The one rule

> **Dependencies point inward. `shared/` never knows that a browser, a Worker, or React exists.**

Everything else in this chapter is a consequence of that sentence.

## Layers

| Layer | Directory | Owns | May import | Must never import |
|---|---|---|---|---|
| **L0 Domain** | `src/shared/{market,dataset,fixtures,time,rng,stats,validate,news}.ts` | values and their types: bars, instruments, session clock, statistics, input validation | standard library | React, DOM, `fetch`, `lib/`, `worker/`, `pages/` |
| **L1 Engine** | `src/shared/{risk,sizing,simulate,setups,ticket,journal}.ts` | every decision that can cost money or write a record | L0 | React, DOM, `fetch`, any adapter |
| **L2 Agent** | `src/shared/ninth/**` | routing, playbooks, tool dispatch, safety gate, memory, learning, audit | L0, L1 | React, DOM, `fetch`, `lib/` (except via an injected port) |
| **L3 Adapters** | `src/lib/**` | the outside world: `localStorage`, `fetch`, Vela, Pine, React hooks | L0–L2, browser APIs | `worker/`, `pages/`, `sections/` |
| **L4 Edge** | `src/worker/index.ts` (+ `src/worker/routes/*` after this blueprint) | HTTP: validation, status codes, the model key, static assets | L0–L2 | React, `lib/`, `pages/`, `sections/` |
| **L5 View** | `src/{pages,sections,components}/**` | rendering and interaction only | L0–L4, React | writing to storage directly (go through `lib/`) |

Two edges are **legal and load-bearing**: L5→L4 (a page calls the API) and L3→L2 (the runtime drives
the loop). Two edges are **forbidden forever**: L2→L3 (the harness must not own a transport) and
L4→L5 (the Worker must not own a view).

### Why `shared/` purity is not stylistic

Three concrete payoffs, all already realised:

1. **The Worker and the browser run the same gate.** `/api/risk/check` cannot drift from the UI
   because both call `checkPlan`.
2. **`bun test` needs no DOM, no jsdom, no Worker runtime.** 445 tests in 4.4 s, 15k assertions.
3. **The bundle stays honest.** A React import inside `shared/` would be pulled into the Worker bundle
   and break the build in a way that is confusing to debug.

### Enforce it (new file)

`scripts/check-layers.mjs`, run in `bun run check` and in CI. Suggested implementation — small enough
to read in one screen:

```js
// Fails when a layer imports something it must not. Rules are intentionally
// coarse: a hex import is easier to keep true than a parser.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = 'src'
const RULES = [
  { from: /^shared\//, banned: /^(react|react-dom|\.\.\/lib\/|\.\.\/worker\/|\.\.\/pages\/)/, why: 'shared/ must stay pure' },
  { from: /^shared\/ninth\//, banned: /\.\.\/\.\.\/lib\//, why: 'the harness owns no transport' },
  { from: /^worker\//, banned: /^(react|react-dom|\.\.\/lib\/|\.\.\/pages\/|\.\.\/components\/)/, why: 'the edge owns no view' },
  { from: /^lib\//, banned: /^(\.\.\/worker\/|\.\.\/pages\/|\.\.\/sections\/)/, why: 'adapters are not the app' },
]

const files = []
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path)
    else if (/\.tsx?$/.test(name)) files.push(path)
  }
}
walk(ROOT)

let bad = 0
for (const file of files) {
  const rel = relative(ROOT, file)
  const text = readFileSync(file, 'utf8')
  for (const spec of [...text.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((m) => m[1])) {
    for (const rule of RULES) {
      if (!rule.from.test(rel) || !rule.banned.test(spec)) continue
      console.error(`${rel}: imports ${spec} — ${rule.why}`)
      bad++
    }
  }
}
if (bad) process.exit(1)
console.log(`layers ok (${files.length} files)`)
```

Wire it as `"check": "node scripts/check-layers.mjs && tsc --noEmit"`, and have the roadmap's CI gate
call `bun run check`.

## Target tree

Additions marked `+`, moves marked `→`, deletions marked `−`. Everything else stays where it is.

```
src/
├── shared/                      (L0+L1+L2 — pure, tested with bun)
│   ├── market.ts dataset.ts fixtures.ts time.ts rng.ts stats.ts validate.ts news.ts
│   ├── risk.ts sizing.ts simulate.ts setups.ts ticket.ts journal.ts chartfeed.ts
│   ├── contracts.ts            + one file: ApiResult<T>, request types, status mapping
│   └── ninth/                  (L2)
│       ├── types.ts router.ts gate.ts registry.ts loop.ts prompt.ts provider.ts
│       ├── memory.ts learning.ts audit.ts commands.ts watch.ts review.ts draft.ts
│       ├── verdict.ts result.ts args.ts
│       ├── tools/{read,decide,write,meta}.ts
│       └── skills/{catalog.ts, *.ts, packs/*.ts}     + packs/ (Phase 3, or delete from spec)
├── lib/                         (L3 — adapters)
│   ├── routes.ts               + the single route table
│   ├── storage.ts desk.ts api.ts rook-provider.ts
│   ├── ninth-client.ts ninth-runtime.ts
│   ├── vela.ts pine.ts vela-ninth-plugin.tsx   → renamed from ninth-panel.tsx
│   └── use-*.ts                 (hooks)
├── worker/                      (L4)
│   ├── index.ts                → keeps Hono, mounts route modules
│   └── routes/{market,desk,risk,ninth,forms,health}.ts   +
├── pages/ sections/ components/ (L5)
└── styles.css content.ts main.tsx App.tsx
```

### Moves, with reasons

| Change | From → To | Why |
|---|---|---|
| Route table | `App.tsx` → `lib/routes.ts` | testable, single source for nav/footer/sitemap (F4) |
| Vela plugin host | `lib/ninth-panel.tsx` → `lib/vela-ninth-plugin.tsx` | the current name collides with the UI component (F-small) |
| Worker routes | `worker/index.ts` → `worker/routes/*.ts` | 240 lines is fine now; six route modules keep validation next to its contract before it becomes 600 |
| API types | inline in `worker/index.ts` → `shared/contracts.ts` | the browser and the edge must agree on `{ok,data,error,errors}` |
| Delete | `components/ui/heroui-drawer.tsx`, `components/ui/heroui-drawer-utils/` | F1 (done) |
| Add | `components/Drawer.tsx` — the phone sheet, on our tokens | F1 (done) |
| Delete | `agent/skills/` | F2 |
| Delete | `artifacts/*` except a curated `docs/media/` | F3 |

### What must not move

- `src/shared/ninth/` stays a sibling of the domain modules. Hoisting it to `src/agent/` would invite
  it to import adapters. Its **dependency direction** is the point, not its address.
- `specs/` stays as-is. Specs are history; the blueprint is the present. Rewriting old specs to match
  new decisions destroys the audit trail.
- `src/components/Verdict.tsx` and `RiskGate` stay in the view layer. They *render* a verdict; they
  must never compute one.

## Module map, with the contracts that matter

The three interfaces the whole system hangs on:

```ts
// L1 — the only thing allowed to say no.
checkPlan({ plan, limits, account, session, history }): GateVerdict
//    GateVerdict = { planId, status: 'approved'|'blocked', ruleId: RuleId|null, checks[], checkedAt }

// L2 — one turn of the assistant, model-optional.
runTurn(input: TurnInput, model: Model, emit: (e: TurnEvent) => void): Promise<TurnResult>
//    TurnResult = { stopReason: 'done'|'steps'|'tokens'|'pending'|'blocked-twice', text, trace }

// L4 — every route answers the same envelope.
type ApiResult<T> = { ok: true; data: T; source?: Provenance } | { ok: false; error: string; errors?: Record<string,string> }
```

If a proposed change adds a fourth interface of this weight, it needs a design note before code.

## Coupling today, measured

- `shared/ninth/tools/*` import engine modules directly (`risk`, `sizing`, `simulate`, `journal`) —
  correct, and the reason tools cannot lie about numbers.
- `lib/desk.ts` owns every storage key and exposes hooks; pages never touch `localStorage` directly
  (verified: `storage.ts` is the only writer).
- `worker/index.ts` imports 11 shared modules and zero view modules (verified by import grep).
- The only cross-layer shortcut is `worker → shared/fixtures`, which is right: the fixture is L0.

## Consequences of adopting this chapter

- One new script, six file moves, three deletions, one rename. No behaviour change.
- After it: a layering violation fails CI, and the route table can be tested and published.
- Effort: half a day, all mechanical, all covered by the existing 445 tests plus one new route test.
