# 04 — Workflow: every lifecycle, every failure path

The product is a loop with six state machines inside it. This chapter writes all six down, because the
current code keeps them correctly in its head and nowhere in prose — which is how they get broken later.

Diagram: [`blueprint.html` #d3](blueprint.html#d3) (the desk loop) and [#d6](blueprint.html#d6) (the
plan→ticket state machine).

---

## 0. The desk loop (the outer workflow)

One session, one symbol, one trade. This is the product's unit of work.

| # | Step | Actor | Reads | Writes | Refuses when |
|---|---|---|---|---|---|
| 1 | **Open the desk** | user | dataset for `SESSION_DATE`, limits, account, journal | nothing | never — the desk always opens |
| 2 | **Scan** | code | bars + daily bars → `setupsFor` for each instrument | nothing | never — returns `[]` on an empty desk |
| 3 | **Choose a setup** | user | `Setup` (family, status, levels) | selected symbol/date in the URL | the setup is `expired` |
| 4 | **Plan** | code → user | `planFromSetup(setup)` then user edits | `TradePlan` (`status: 'draft'`) | entry or stop missing |
| 5 | **Size** | code | `sizeFor(entry, riskPerShare, limits)` | computed shares + deciding limit | no share fits any limit (R-08/09/10) |
| 6 | **Check** | **code only** | plan + limits + account + session + history | `GateVerdict` (`approved` / `blocked` + ruleId) | any of R-01…R-15 |
| 7 | **Ticket** | user | approved plan | `PaperTicket` (`proposed` → `confirmed`) | verdict is `blocked`, or the plan changed after the check |
| 8 | **Journal** | code | verdict + ticket + note | `JournalRow` (`APPROVED` / `BLOCKED` / `MANUAL`) | note > 280 chars (clamped, not rejected) |
| 9 | **Review** | user + Ninth | journal rows, R-multiples, hit rate | `/review` output, learnings | sample < `MIN_SAMPLE` (10) → says "not enough yet" |

The invariant that makes this a product and not a toy: **step 6 cannot be influenced by steps 1–5 or by
Ninth.** The gate reads a plan and returns a verdict. That is all it does.

### Where a session can stop, and what the user sees

| Stop | Cause | User-facing state |
|---|---|---|
| Nothing to do | scan returns no setups | empty desk with the scan summary and the rules that produced it |
| Blocked | a rule failed | the rule id, its label, the numbers that failed, and what would have to change |
| Waiting | market `pre` / `closed`, or past `flatBy` | the session clock and the next open, not a disabled button with no reason |
| Out of trades | R-03 daily cap | cap reached, with the count and the reset time |
| Kill switch | user turned it on | every write and decide tool refuses; reads still work |

---

## 1. `TradePlan.status` — `risk.ts`

```
draft ──check──► checked ──approved──► approved ──ticket──► ticketed
                    │
                    └──blocked──► blocked ──edit plan──► draft
```

| From | Event | Guard | To | Effect |
|---|---|---|---|---|
| `draft` | user edits | numeric entry/stop/target | `draft` | recompute R:R, sizing |
| `draft` | `checkPlan` | always | `checked` | verdict attached |
| `checked` | verdict approved | — | `approved` | ticket may be proposed |
| `checked` | verdict blocked | — | `blocked` | refusal journaled; **plan is immutable until edited** |
| `approved` | ticket proposed + confirmed | ticket state `confirmed` | `ticketed` | plan freezes |
| `blocked` | **any** field changes | — | `draft` | previous verdict is void (2026-11-24 rule: a changed parameter voids confirmation) |

---

## 2. `PaperTicket.state` — `ticket.ts`

```
proposed ──confirm──► confirmed ──fill──► filled ──close──► closed
    │                     │                 │
    └──cancel──► cancelled └──expire──► expired ◄──expire──┘
```

| From | Event | Guard | To | Effect |
|---|---|---|---|---|
| — | `proposeTicket` | verdict approved, `ticketProblem()` returns null | `proposed` | shows entry/stop/target/size/max loss |
| `proposed` | user confirms **in the UI** | verdict still approved, plan unchanged | `confirmed` | the only path to a fill |
| `confirmed` | session replay reaches entry | bar low ≤ entry | `filled` | fill price, fill time |
| `filled` | target or stop touched | — | `closed` | realised R |
| `filled` | `flatBy` passes | — | `closed` | exit at the flat-by price, journaled as a time exit |
| `proposed`/`confirmed` | user cancels | — | `cancelled` | reason recorded |
| `proposed`/`confirmed` | never triggers before the session ends | — | `expired` | counted as a no-trade, not a loss |

`ticketProblem(ticket, verdict)` is the double-check: even an approved verdict cannot rescue a ticket
whose plan drifted. That check is why `replayAgainstSession` can be deterministic.

---

## 3. The verdict — `checkPlan` and R-01…R-15

Rules run in order and the **first failure is the reported one**. That is a deliberate UX decision: a
list of fifteen failures is noise, one rule with its numbers is a lesson.

| Rule | Question | Failure looks like |
|---|---|---|
| R-01 | kill switch off | "the switch is on" |
| R-02 | market open, inside entry window | "the window closed at 11:30 ET" |
| R-03 | trades left today | "3 of 3 used" |
| R-04 | daily loss limit not hit | "−$212 of −$250 used" |
| R-05 | a stop is attached | "no stop" |
| R-06 | stop below entry (long) | "stop 380.00 is at or above entry 379.5" |
| R-07 | risk per share positive | arithmetic guard |
| R-08 | stop fits the risk budget | "4 shares × $3.00 = $12.00 > $10.00" |
| R-09 | position cap allows ≥ 1 share | cap in dollars vs price |
| R-10 | cash buffer allows ≥ 1 share | buffer |
| R-11 | target above entry | "target below entry" |
| R-12 | reward:risk ≥ `minRewardRisk` | "1.4:1 < 2:1" |
| R-13 | no duplicate ticket on the symbol | "already a ticket on TSLA" |
| R-14 | today's total risk still fits | sum of open risk |
| R-15 | before `flatBy` | "flat-by is 15:55 ET" |

Every verdict carries: `planId`, `status`, `ruleId`, `checks[]`, `checkedAt`. `checks[]` is what lets the
Risk Gate page show the *passing* rules too, which is the teaching surface.

---

## 4. The agent turn — `loop.ts`

```
route ─► compose prompt ─► model call ─► dispatch tools ─► (repeat ≤ 6) ─► answer ─► audit
                                              │
                                              └─ tier ≥ 2 → gate → pending token → STOP ('pending')
```

| Stop reason | Meaning | What the UI shows |
|---|---|---|
| `done` | model produced a final answer | the answer + refs |
| `steps` | hit `MAX_STEPS = 6` | the answer so far, "ran out of steps", `/trace` |
| `tokens` | hit `MAX_TOKENS_OUT = 24 000` | truncated honestly |
| `pending` | a tool needs a human confirmation | the confirm card with the token; **no further tool calls** |
| `blocked-twice` | two blocked calls in one turn | "stopped: two refusals", with both reasons |

Turn-level caps, all in `types.ts`: `MAX_INPUT_CHARS 2 000`, `MAX_RESULT_CHARS 4 000`,
`MAX_WRITES_PER_TURN 3`, `MAX_ROUTED_SKILLS 6`, `SKILL_BODY_BUDGET_CHARS 12 000`, `MAX_LEARNINGS 3`,
`AUDIT_MAX_ROWS 500`.

**The confirmation is the workflow's hardest edge.** A tier-2/3 tool creates a `PendingCall` with a
single-use token, 10-minute TTL. The model cannot spend it. Only the desk's confirm handler calls
`confirmPending`. If the turn ends before that, the token expires and the action is simply not taken —
which is the correct failure direction.

---

## 5. Watches — `watch.ts`

```
add ─► armed ─► (price touches) ─► fired ─► re-armed?  no ─► removed
        │
        └─ remove / clear
```

- Kinds: `above`, `below`, `at`. Max 20 (`WATCH_MAX`).
- Firing is evaluated against the desk's own quotes, never a live feed.
- A fired watch can start a turn (`RouteInput.signal = true`, worth +25 routing points) — that is the
  intended bridge between "watching" and "asking".
- No persistence of alerts beyond `localStorage`; a fired watch shown twice is a bug, not a feature.

---

## 6. Memory and learning — `memory.ts`, `learning.ts`

```
turn ─► observations (habit|context|decision|note) ─► memory (keep 200, text ≤ 280)
     └─► TurnSummary ─► reviewTurn ─► Review{score} ─► learning (≥3 calls, score ≥7) ─► Wilson gate
```

| Constant | Value | Meaning |
|---|---|---|
| `MEMORY_KEEP` | 200 | observations retained per workspace |
| `MEMORY_TEXT_MAX` | 280 | one observation, one sentence |
| `OBSERVATIONS_IN_PROMPT` | 6 | how many are injected |
| `RECALL_TOP` | 3 | recall results per turn |
| `LEARNING_MIN_CALLS` | 3 | a learning needs three tool calls of evidence |
| `LEARNING_MIN_SCORE` | 7 | and a review score of at least 7 |
| `LEARNING_MIN_USES` | 10 | before it can be trusted |
| `LEARNING_MIN_RATE` | 0.55 | and a Wilson lower bound above 55% |
| `LEARNING_KEEP` | 100 | cap |

The Wilson bound (`z = 1.96`) is the most disciplined thing in the codebase: a learning is not promoted
because it worked twice, but because its lower confidence bound clears a threshold. Nothing in the UI
should ever present a learning as advice — it is a note about *process*.

---

## 7. Failure matrix (the "all conditions" table)

| If this fails | Behaviour today | Required behaviour |
|---|---|---|
| No model key | `/api/ninth/turn` → 503; Ninth answers deterministically | keep; the desk must be fully usable (it is) |
| Model provider 5xx | 502 with a 300-char detail | keep; never retried automatically in the same turn |
| Cross-origin model call | 403 | keep |
| Dataset missing | `fixtures.ts` generates a labelled session | keep; label must say "generated", not "live" |
| `localStorage` full | `writeStore` throws? | catch, surface a toast, never lose an existing row silently |
| `localStorage` corrupt/old schema | `readStore` falls back | migrate `rook:v1` → `rook:v2`; a bad payload must not blank the journal |
| Symbol has no bars | 404 from API, `barsFor` returns `[]` | page shows "no data for XYZ", not an empty chart |
| Verdict blocked | refusal journaled | keep; refusal must be as visible as an approval |
| Kill switch on | tier ≥ 2 blocked | keep; reads unaffected (this is important — you must be able to see why) |
| Watch fires twice | `checkWatches` removes on fire | keep; test exists |
| Ticket confirmed twice | token single-use + `ticketProblem` | keep; add the 409 case to the API if it ever becomes server-side |
| Clock wrong | `etNow` is injectable, `DEMO_CLOCK` exists | keep; every timing rule must take a clock, never read `Date.now()` inline |
| Deploy manifest drift | `postbuild.mjs` throws with a readable message | keep; add the pair to the checklist |

---

## 8. Determinism and replay

Three pins make the whole desk reproducible, and they must not be relaxed:

1. **`SESSION_DATE`** from the dataset meta — the session the demo trades.
2. **`DEFAULT_SEED = 19` / `DEFAULT_RUNS = 10 000`** in `simulate.ts` — same plan, same odds.
3. **`DEMO_CLOCK`** (`SESSION_DATE`, `10:12`) — the time the desk pretends it is.

Consequence: a bug report can be replayed exactly. Any new feature that introduces wall-clock time or
randomness must take an injectable clock/seed or it breaks this property. That is the single hardest
constraint on Phase 2 (automations), and the reason the scheduler must accept an injected `now`.

---

## 9. What the workflow does not have yet

| Missing | Consequence | Phase |
|---|---|---|
| Any scheduler | "every morning at 8" is impossible | 2 |
| Server-side or cross-device state | a second browser is a second desk | 3 (or never — see 08) |
| Multi-symbol concurrent positions | one ticket at a time, by design | 4, if ever |
| Partial fills, slippage model beyond the simulator | paper fills are optimistic | 4 |
| Post-session review report beyond `/review` | the loop ends softly | 3 |

The absence of the scheduler is the biggest gap between Rook and Minara's *feel*. Everything else here
is already better specified than most products twice this size.
