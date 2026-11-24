# Minara AI — complete research corpus

Everything Minara publishes, collected in one place, plus the read of it we use to build Rook.

Collected **2026-11-24**. Minara is a moving target; the harvest date matters more than the
version numbers below, because their docs are live-edited on GitBook.

## What is in here

| Path | What it is |
|---|---|
| [`raw/`](raw/) | **136 pages**, verbatim markdown, every English page of `minara.ai/docs` — product, trade, automation, strategy studio, academy, reference, support, technology. Unedited. |
| [`raw/INDEX.md`](raw/INDEX.md) | Table of every page with its title and word count. Start here to find the page you need. |
| [`skill-pack/`](skill-pack/) | The MIT-licensed `Minara-AI/minara-skills` repo: `SKILL.md`, `setup.md`, 17 `references/*.md`, 4 installer scripts, release workflow. Binary assets stripped. |
| [`01-product.md`](01-product.md) | What Minara is, every surface it ships, and how the pieces relate. |
| [`02-harness.md`](02-harness.md) | The agent runtime: turn pipeline, tools, money safety, memory, workspace, observability. |
| [`03-skills-and-cli.md`](03-skills-and-cli.md) | How their skill pack is built — the reusable part, dissected file by file. |
| [`04-api-data-models.md`](04-api-data-models.md) | Agent API, x402, the docs MCP server, the 50+ provider data stack, DMind. |
| [`05-automation-and-strategies.md`](05-automation-and-strategies.md) | Automations and Strategy Studio — Minara's two programmable products. |
| [`06-gap-analysis.md`](06-gap-analysis.md) | Rook as it stands vs Minara, feature by feature, with the honest deltas. |
| [`07-build-plan.md`](07-build-plan.md) | The plan: four phases, file-level tasks, tests, definition of done. |
| [`08-risks-and-non-goals.md`](08-risks-and-non-goals.md) | Regulatory, custody, and the things we should deliberately not copy. |
| [`sources.md`](sources.md) | Every URL used, with what it contributed. |

Prior work this extends rather than replaces:
[`../2026-11-24-minara-system-research.md`](../2026-11-24-minara-system-research.md) (the turn
pipeline and money-safety read) and [`../../004-ninth-harness/design.md`](../../004-ninth-harness/design.md)
(what Ninth already implements).

## How this was harvested (repeatable)

1. `https://minara.ai/llms.txt` — product index. `https://minara.ai/docs/llms.txt` — the docs
   index that lists a `.md` URL for **every** page.
2. Fetch each `.md` URL. GitBook serves clean markdown at `<page>.md`, with front-matter prose
   stripped and no HTML chrome. 136/136 succeeded, 1.1 MB total.
3. `git clone --depth 1 https://github.com/Minara-AI/minara-skills.git` for the skill pack.

Refresh recipe (from the repo root):

```sh
cd specs/research/minara-ai/raw
curl -sL https://minara.ai/docs/llms.txt \
  | grep -oE 'https://minara\.ai/docs/[^) ]*\.md' | sort -u > /tmp/urls.txt
while read -r u; do
  rel="${u#https://minara.ai/docs/}"; mkdir -p "$(dirname "$rel")"
  curl -sL -f -o "$rel" "$u" || echo "FAIL $u"
done < /tmp/urls.txt
```

Two more access paths worth knowing, both implemented by Minara and worth copying:

- **Docs MCP server**: `https://minara.ai/docs/~gitbook/mcp` — agents can search the docs over MCP.
- **Ask-the-docs**: `GET https://minara.ai/docs/<page>.md?ask=<question>&goal=<goal>` returns a
  synthesised answer with excerpts. Their own pages document this under "Agent Instructions".

## Reading order

- New to Minara → `01-product.md`, then skim `raw/get-started/how-minara-works.md`.
- Building a harness → `02-harness.md` + `../2026-11-24-minara-system-research.md`.
- Building a skill → `03-skills-and-cli.md` with `skill-pack/skills/minara/SKILL.md` open.
- Building an API → `04-api-data-models.md`.
- Deciding what Rook should do next → `06-gap-analysis.md` then `07-build-plan.md`.

## Provenance and licensing

- Docs text: Minara's published documentation, copied verbatim for internal research. Not
  relicensed here; do not republish `raw/` as our own.
- Skill pack: MIT (per their README badge; the repo carries no `LICENSE` file at the harvested
  commit, so attribution is by repo link — see `skill-pack/README.md`).
- Nothing in this directory is code we ship. Rook's implementation lives in `src/`.
