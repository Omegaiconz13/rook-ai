> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/technology/dmind.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# DMind

Minara is powered by [DMind](https://dmind.ai/), an open-source research organization building large language models, benchmarks, datasets, and tools for Web3 and digital finance. DMind's models handle the finance-native parts of Minara: parsing on-chain data, reasoning about DeFi protocols, evaluating risk in transactions, and generating market research. These models are paired with general-purpose models such as Claude and GPT, which handle the tasks that fall outside finance.

## Why a domain-native model

General-purpose LLMs have four structural gaps in Web3.

Web3 content is underrepresented in their training data, so they often invent plausible but wrong answers about specific protocols, contract mechanics, or token economics. Cloud-only inference forces users to send wallet activity and trading intent to third-party servers. Chat-based products provide no help at the moment that matters most, which is when a user signs a transaction. And API round-trips are too slow for time-sensitive scenarios such as liquidations or MEV protection.

DMind builds models that close these gaps, with weights and training data published openly so anyone can audit them.

## What DMind ships

DMind has released seven open-source models across three generations, ranging from a 270M-parameter on-device safety model to a 21B cloud reasoning model. Alongside the models, DMind publishes an evaluation suite for Web3 understanding (1,917 expert-reviewed questions across 9 sub-domains, accepted to KDD 2026), and a TypeScript SDK for integrating DMind models into Web3 applications.

## How DMind powers Minara

Minara routes work across DMind's models based on what each task needs.

Transaction-time safety checks run on a small on-device model (DMind-3-Nano), so they work without a network round-trip. Strategy analysis and private research run on a local 4B model (DMind-3-Mini) that reasons about a user's specific holdings without sending them to the cloud. Market-wide research, cross-chain analysis, and long-form reports run on the 21B Oracle model in the cloud, which has a 256k context window and aggregates global data.

The split is not arbitrary. It is the [sovereign architecture](https://minara.ai/docs/technology/dmind/sovereign-architecture.md) that defines what runs where, and why.

{% hint style="info" %}
The final go/no-go decision on a transaction always happens on the user's device, never in the cloud. This is the safety anchor of the entire architecture.
{% endhint %}

## Read next

* [Sovereign architecture](https://minara.ai/docs/technology/dmind/sovereign-architecture.md). The Edge-Local-Cloud design behind DMind-3 and what it means for privacy.
* [Model family](https://minara.ai/docs/technology/dmind/model-family.md). What each of the seven models does and when it gets used.
* [DMind Benchmark](https://minara.ai/docs/technology/dmind/benchmark.md). The Web3 evaluation suite accepted to KDD 2026.
* [Training methods](https://minara.ai/docs/technology/dmind/training-methods.md). HPS, C³-SFT, and how the models are taught Web3-specific reasoning.

## Resources

* Website: [dmind.ai](https://dmind.ai/)
* GitHub: [github.com/DMindAI](https://github.com/DMindAI)
* Hugging Face: [huggingface.co/DMindAI](https://huggingface.co/DMindAI)
* Papers: [DMind Benchmark (arXiv:2504.16116)](https://arxiv.org/abs/2504.16116), [DMind-3 (arXiv:2602.11651)](https://arxiv.org/abs/2602.11651)


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/technology/dmind.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
