# 08 — Risks and non-goals

Not legal advice. These are the categories a builder must get advice on before shipping anything that
looks like Minara, based on what their own docs reveal about where the hard edges are.

## Regulatory exposure, in order of severity

### 1. Custody (the reason Rook stays paper)

Minara holds a **custodial wallet** and lets a user's agent move funds across 19 chains, with a
credit-card on-ramp via MoonPay. That combination attracts, depending on jurisdiction: money
transmission / VASP licensing, KYC/AML obligations, sanctions screening, safeguarding-of-client-assets
rules, and on-ramp partner obligations passed down contractually.

Their own docs show the weight: separate pages for withdrawals, private-key export, 2FA reset, wallet
security, security incidents, data security, published audits, and a bug bounty. That is a compliance
surface, not a feature list.

**Rook's position:** no custody, no wallet, no keys, no deposits. This must stay a stated invariant and
be enforced by the absence of code, not by a policy paragraph. `08` in the plan's non-goals list is the
most important line in this directory.

### 2. Investment advice vs execution vs education

The line Minara walks: it produces **trade plans** and executes **user-approved orders**. It never
charges for a recommendation. Their safety page is explicit that the model deciding a trade looks
reasonable is *not* approval.

For Rook, the risk is the inverse and subtler: a paper desk that says "this setup scores 8/10" can read
as advice even with no execution. Mitigations already present in Rook and worth keeping strict:

- verdicts are about *process compliance*, never expected return;
- refusals are shown, not hidden, so the desk is visibly unexcited about most trades;
- journals record reasons, not predictions;
- "paper only, not advice" on every surface, including exports and the benchmark page.

### 3. Perps, leverage and prediction markets

Leveraged perps are restricted or banned for retail in many jurisdictions, and prediction markets are a
live legal question in several. Minara solves this by routing to offshore venues (Hyperliquid, Lighter)
and Polymarket. Rook's paper-only simulation sidesteps it entirely — and that is a feature to state
plainly, not apologise for.

### 4. Marketplace earnings

Paying strategy authors a share of subscriber revenue invites questions about whether the strategy is a
security, a managed service, or a collective investment scheme. Rook is not building this
(see non-goals). If it ever does, the answer is "publish, don't sell".

### 5. Data licensing

Minara integrates 50+ providers under contract and states provenance. Rook uses delayed Yahoo bars
from a labelled fixture. If Rook moves to live or bulk data, licensing is the first question, not the
last: redistribution of vendor data in an API response is usually prohibited.

## Agent-specific risks

### Prompt injection from documents

Minara names this explicitly: text inside a document, web page, or file **does not count as approval**.
Any agent that reads untrusted content will eventually be told to do something by that content. Rook
reads bars and user notes; the same rule must hold — a note in the journal, a filename, or a README
cannot authorise an action. The gate takes a typed plan object, never free text, which is the structural
fix.

### Confirmation theatre

An approval that can be satisfied by the model's own reasoning is not an approval. Minara calls
fabricating a user's confirmation an *instant safety failure*. Rook's equivalent: the gate must never be
consulted by Ninth to decide *whether* to ask, only *what* to answer. Approval is a UI event with a
human behind it.

### Model drift and provider coupling

Minara mitigates with a domain-native model family and a device-local final check. Rook's mitigation is
cheaper and stronger: the decision is a pure function with tests, and the model is optional (the Worker
returns 503 when no key is configured and Ninth "answers from the desk"). Keep the product fully
functional with the model disabled, and test that path.

### Overfitting presented as skill

Parameter optimisation on one short session produces impressive numbers and no edge. Rook's phase 4
plan refuses to ship an optimiser without a train/test split and an explicit warning. Minara's Academy
has whole pages on "reading backtest metrics" for the same reason.

## Brand, IP and copying

- **Do not** reuse Minara's name, marks, copy, or the phrase "AI CFO". The corpus in this directory is
  research; `raw/` must not be republished as Rook documentation.
- The **skill pack is MIT** (per their README; the harvested commit carries no `LICENSE` file). Copying
  the *structure* — one skill, lazy references, a detector script, a confirmation state machine — is
  both legal and the right engineering call. Copy the structure, write our own words.
- Their docs are copyrighted prose. Facts and interfaces are not, but sentences are. Everything in
  `01`–`08` is paraphrase for that reason.

## Non-goals (deliberate, not deferred)

1. **No custody.** Ever. It is the whole product.
2. **No live order routing** to Hyperliquid, Lighter, Polymarket, or any broker.
3. **No strategy DSL.** Vela + Pine analysis is enough; a DSL is a decade of maintenance.
4. **No LLM-generated executable strategies.** Generated code plus real capital is the combination the
   design exists to prevent.
5. **No marketplace or creator payouts.**
6. **No subscription metering** until there is something worth metering. A model proxy budget is enough.
7. **No x402 / on-chain payments.** Rook has no wallet and should not grow one.
8. **No model in the decision path.** Model output may summarise and explain; it may not produce a verdict.

## Open questions for a human, not for this document

- Which jurisdiction does Rook invoice in, and does a paper-only simulator there need a disclaimer
  beyond "not advice"?
- If Rook ever charges, is the charge for *software* (safe) or for *signals* (regulated in some places)?
- Is "Rook" clear of existing marks in financial software? A name search is cheap; a rebrand is not.
