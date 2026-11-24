# 06 — Surfaces: what each screen is for

Each page gets the same five-line spec: **job**, **primary action**, **must handle**, **never**, and
**done when**. If a page cannot state its job in one sentence, it is two pages.

The visual language is fixed by `src/styles.css` and demonstrated in `/styleguide`. No page may introduce
a colour, radius or shadow that is not a token.

---

## Global chrome

| Element | Rule |
|---|---|
| `Nav` (site) | overlays the hero on `/`, solid elsewhere; links come from `routes.ts` |
| `Footer` (site) | disclaimer must appear on every marketing page: *educational only, not financial advice, sample data is fictional, nothing places an order* |
| `AppShell` (desk) | five nav items (Desk, Charts, Gate, Journal, Ninth), kill switch in the header, account menu |
| `KillSwitch` | visible on every desk surface, one click, state read aloud by `aria-label` |
| `Toast` | one provider at the root; never for a blocked verdict (those are inline, they must persist) |
| `Disclaimer` | present on every screen that shows a number |

---

## Marketing

### `/` — Home

**Job.** Convince a trader that *process* is the product, in one screen, with no signup.
**Primary action.** Open the demo desk (`/app`) or read how the gate works.
**Must handle.** Reduced motion; a hero image that is 60 kB not 600 kB; the disclaimer.
**Never.** Claim an edge, a win rate, or a return. Show a testimonial that implies profit.
**Done when.** A stranger can say what Rook refuses to do after ten seconds.

Sections (`src/sections/`): `Hero`, `HowItWorks`, `Features`, `Stats`, `Testimonials`, `Faq`, `Cta`,
`PricingPlans`, `Nav`, `Footer`. `Stats` may show only counts of *process* facts (rules enforced, decisions
journaled), never performance.

### `/pricing` — Pricing

**Job.** Show the intended commercial shape honestly.
**Primary action.** Join the waitlist (`/api/subscribe` — **currently discards the address; fix before
launch**).
**Must handle.** That nothing can be bought today; the four tiers are indicative.
**Never.** A "Start free trial" button that leads to a demo login with no billing behind it.
**Done when.** The page states, in the page itself, that the desk is free and paper-only while in beta.

### `/about` — About

**Job.** Say who built this and why the refusal-first design exists.
**Primary action.** Read the constitution's non-negotiables, in human words.
**Never.** A stock founder photo or a fabricated team.

### `/styleguide` — Style guide

**Job.** Prove the design system is real; be the reference a new component is checked against.
**Primary action.** None. It is a catalogue.
**Must handle.** Every token, every primitive, the drawer demo (on `Modal` after ADR-4), light/dark
behaviour if it ever exists.
**Never.** Be the only page that exercises a production dependency (that is exactly what HeroUI was).
**Done when.** Removing any primitive breaks a section of this page.

### `/login`, `/signup` — Auth (demo)

**Job.** Let someone into the desk without asking for a password they will reuse.
**Primary action.** Enter the desk.
**Must handle.** Validation errors inline (`validateLogin`/`validateSignup`), the fact that no account is
created, and a clear "demo" label.
**Never.** Imply real authentication. `POST /api/login` fabricates a name from the email — that is fine
*if the UI says so*. A pricing page implying paid accounts is not fine.
**Done when.** A user cannot mistake this for a real account.

---

## Desk

### `/app` — Today's desk

**Job.** Answer "is there anything worth doing right now, and if not, why not" in one screen.
**Primary action.** Open a setup, or read the scan's verdict that there is nothing.
**Must handle.** Empty scan; market `pre`/`closed`; kill switch on; all trades used; dataset labelled
sample; the session clock in ET.
**Never.** Show a setup that the gate would certainly block without saying so on the card.
**Done when.** The most common state — *nothing to do* — is as well designed as the active one.

### `/app/setup/:symbol` — Setup detail

**Job.** Turn one setup into one sized plan, with the numbers visible.
**Primary action.** "Check this plan" (→ verdict) — never "Trade".
**Must handle.** `expired` setup; symbol with no bars; a plan whose stop is above entry; sizing that fits
no share and therefore says *why*.
**Never.** Let the button say anything that implies execution.
**Done when.** A user can explain their max loss at the stop without scrolling.

### `/app/risk` — Risk gate

**Job.** Be the teaching surface: show all fifteen rules, the ones that pass, the first that fails, and
the arithmetic that failed.
**Primary action.** Change one input and re-check.
**Must handle.** Verdict for a plan that is already ticketed (R-13); the block reason in plain words
with the offending numbers; a "what would have to change" sentence.
**Never.** Offer a control that can raise a limit to pass a rule. Limits are edited in Setup, with intent.
**Done when.** The gate page can be given to a beginner as a lesson.

### `/app/journal` — Journal

**Job.** Make the record trustworthy and exportable.
**Primary action.** Read today, add a note, export.
**Must handle.** Empty journal; 2,000-row cap reached; schema migration; a `BLOCKED` row as prominent as
an `APPROVED` one; day notes ≤ 2,000 chars; row notes ≤ 280 (clamped).
**Never.** Lose a row on quota error or on a schema bump.
**Done when.** Export → re-import reproduces the journal byte-for-byte in the demo fixture.

### `/app/session/:symbol/:date` — Session review

**Job.** Show what happened to a paper trade, bar by bar, and what R it produced.
**Primary action.** Step through the session; read the review.
**Must handle.** No session for that date; a session that never filled; a flat-by exit.
**Never.** Recompute history with different numbers than the journal recorded.

### `/app/charts` — Charts

**Job.** A real charting workspace with the desk's own levels and setups drawn on it.
**Primary action.** Read a chart; add an indicator; open Ninth beside it.
**Must handle.** Vela's empty state; Pine addon loading and failing; a symbol with no bars; the offline
data label.
**Never.** Let the chart's price differ from the desk's price. Both come from `fixtures`/`market`.
**Done when.** Levels drawn by `drawSetupLevels` match the numbers on the setup card exactly.

### `/app/chat` — Ninth (full page)

**Job.** One assistant that answers from the desk, with the route and the evidence visible.
**Primary action.** Ask; run a slash command; confirm a pending action.
**Must handle.** No model configured (answers from the desk, says so); a blocked tool; a pending
confirmation with its 10-minute TTL; `/trace` showing scores and reasons; the kill switch.
**Never.** Show a tool result without its `refs`; present a learning as advice; execute anything on a
confirmation the human did not click.
**Done when.** With the model removed, the page still answers every desk question it claims to answer.

---

## `NinthPanel` — the docked variant

Same job as `/app/chat` at one-third the width, mounted on Charts via `lib/vela-ninth-plugin.tsx`.
Rules: no more than two tool calls visible at once; refs collapse to a chip; the confirmation card is
full-width and cannot be dismissed by scrolling.

---

## Copy rules (apply to every surface)

1. **No performance promises.** Not "win rate", not "edge", not "alpha". Process only.
2. **A refusal is content, not an error.** Never red-alert styling for a rule that did its job; use the
   neutral `Verdict` treatment and the rule label.
3. **Every number carries provenance.** `SourceBadge` (`seed`/`live`/`fallback`/`user`) or the number does
   not ship.
4. **Times are New York time, with the session date** — never the browser's timezone silently.
5. **"Paper" appears wherever a reasonable person could think money moved.**

## Accessibility contract

- One `<main id="main">`, `tabIndex={-1}`, focus moved on navigation (already implemented in `App.tsx`).
- Skip link first in the DOM (already implemented).
- Every icon-only control has an `aria-label` (kill switch, account, close).
- Verdicts are announced: the gate result region is `role="status"`.
- Charts provide a table fallback for the session's numbers; a canvas alone is not a data surface.
- `prefers-reduced-motion` honoured by `useReducedMotion` + `scrollToHash`.

## States every surface must define

For each page, four states exist and the fourth is usually forgotten:

| State | Requirement |
|---|---|
| loading | skeleton with the right shape, `aria-busy` |
| empty | says *why* it is empty and what to do next |
| error | what failed, what still works, how to retry |
| **stale** | data is from a previous session/day — shown, not silently rendered as current |

The stale state is the one that makes a trading desk trustworthy. The dataset already carries
`fetchedAt` and `SESSION_DATE`; the UI must compare them to now and say so.
