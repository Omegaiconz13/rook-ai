# Requirements Checklist: AI Trading Desk

Quality gate for `spec.md`, `plan.md` and the contract set. Each item is pass/fail
with a one-line note. Run before implementation starts.

## Completeness

- [ ] Every functional requirement is testable without reading source code (FR-001..FR-034)
- [ ] Each user story has an independent test and at least two acceptance scenarios
- [ ] Every edge case in `spec.md` maps to a documented rule id, empty state, or FR
- [ ] Every entity in `data-model.md` appears in at least one story or contract
- [ ] Every Worker route in `contracts/worker-api.md` has status codes and a failure shape
- [ ] Success criteria are measurable and have a stated method (SC-001..SC-008)
- [ ] Out-of-scope list is explicit and matches Assumptions

## Clarity

- [ ] No requirement uses "fast", "nice", "robust" or "user-friendly" without a number
- [ ] Money rules state integer cents, rounding point and display precision (research D-09)
- [ ] Session/time rules name the timezone (`America/New_York`) and the flat-by time
- [ ] The word "signal" does not appear as a product claim anywhere in the spec set
- [ ] "Approved" and "TAKE" are distinguished: gate approval ≠ memo verdict
- [ ] Seat list is fixed and ordered; `risk` is a gate, not a seat

## Consistency

- [ ] The six worked examples in `contracts/risk-engine.md` use one limits set and one plan; arithmetic checked
- [ ] `R-01`..`R-15` are referenced identically in spec, contract and tasks
- [ ] Route names in spec, plan and tasks agree (`/app`, `/app/setup/:symbol`, `/app/room`, `/app/risk`, `/app/journal`, `/app/chat`)
- [ ] Storage keys in `data-model.md` match those named in `tasks.md`
- [ ] Deleted files listed in `plan.md` do not appear as required work in `tasks.md`

## Constitution alignment

- [ ] I. Paper Before Live: no task creates a live order path; kill switch tasks exist (T035, T062)
- [ ] II. Code Decides: money rules only in `src/shared/risk.ts`/`sizing.ts`; room task T041 cannot change a verdict
- [ ] III. Every Number Has a Source: `SourceBadge` task exists (T008) and is used by T020, T059
- [ ] IV. Educational, Never Advice: `Disclaimer` task exists (T007); T064 forbids performance claims
- [ ] V. Offline Demo: US1 independent test runs offline; no provider URL in the client bundle (T072)
- [ ] VI. Smallest Diff: no new dependency proposed; `bun test` used instead of a test framework

## Risk

- [ ] The risk engine has tests that fail before implementation (T029, T030 ordered before T031)
- [ ] Determinism invariant is testable: identical inputs → identical `ruleId`, `size`, `decidingLimit`
- [ ] Seeded fixtures are labelled fictional wherever they surface
- [ ] Fallback behaviour on provider failure is specified (bars: `fallback: true`, never empty 200)

## Sign-off

- [ ] Product scope (intraday desk, paper only) confirmed by the requester
- [ ] Brand name confirmed and written into `src/content.ts`
- [ ] Feature branch and spec directory accepted as `001-ai-trading-desk`
