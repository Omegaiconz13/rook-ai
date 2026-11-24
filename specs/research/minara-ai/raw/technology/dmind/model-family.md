> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/technology/dmind/model-family.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Model family

DMind has released seven open-source models across three generations, plus the DMind Benchmark dataset. All weights are public on Hugging Face under permissive licenses.

## DMind-3 (2026, current generation)

Three models that work together as the Edge-Local-Cloud stack. See [Sovereign architecture](https://minara.ai/docs/technology/dmind/sovereign-architecture.md) for how they fit together.

### DMind-3-Nano (270M)

A 270-million-parameter model that runs in browser extensions, wallet apps, and on mobile. It does deterministic safety checks at signing time, parsing calldata, identifying unlimited approvals, and flagging suspicious patterns. Fully on-device, no network required. Built around a standardized function-calling protocol.

### DMind-3-Mini (4B)

A 4-billion-parameter model that runs on a user's local machine, including consumer GPUs and recent Apple silicon. It handles private strategy reasoning and deep research using the user's portfolio as context. Trained with C³-SFT (see [Training methods](https://minara.ai/docs/technology/dmind/training-methods.md)) so it produces an answer, critiques itself, and revises before finalizing.

### DMind-3 (21B)

The 21-billion-parameter cloud model. Built on OpenAI's gpt-oss-20b base, with a custom Transformer and Multi-Scale RoPE position encoding for a 256k-token context window. Native BF16/FP16 precision. Trained on 500,000+ curated documents and multi-terabyte on-chain data. Runs in the cloud or a private VPC, not on user devices.

## DMind-2 series (2025)

DMind-2 was the transitional generation, focused on tool-calling and crypto investment analysis. Both models are still usable but are no longer the primary recommendation, since DMind-3 supersedes them.

### DMind-2-107B

A 107-billion-parameter flagship for crypto investment analysis with tool-calling support. The model can directly call on-chain data APIs, exchange APIs, and market data services.

### DMind-2-4B

A 4-billion-parameter lightweight version of the same family. Designed for local deployment with the same investment-analysis specialization in a smaller footprint.

## DMind-1 series (2025)

The first generation, and the first publicly released Web3-native LLM with open weights. Built on Alibaba's Qwen3 base models, fine-tuned on 13,276 expert-curated Web3 knowledge items distilled from 32.7GB of source documents.

### DMind-1 (32B)

The original Web3-native LLM. Built on Qwen3-32B. Trained in two stages: supervised fine-tuning with LoRA on the curated dataset, then RLHF with PPO using a Web3-specific reward model. On Web3 tasks it matches the performance of much larger general-purpose models at 10–30% of the token cost.

### DMind-1-mini (14B)

A distilled version built on Qwen3-14B, using both DMind-1 and a general SOTA model as dual teachers. The distillation works at three levels. The student learns the teacher's final outputs, the teacher's full probability distribution over each token, and the teacher's intermediate-layer representations. This is the most-downloaded model in the family, because most agent applications need a small, fast model rather than a flagship.

## At a glance

| Model        | Size | Where it runs             | Primary use                         |
| ------------ | ---- | ------------------------- | ----------------------------------- |
| DMind-3-Nano | 270M | Browser / wallet / mobile | Transaction safety checks           |
| DMind-3-Mini | 4B   | User device               | Private strategy and research       |
| DMind-3      | 21B  | Cloud / private VPC       | Market-wide research                |
| DMind-2-107B | 107B | Cloud                     | Investment analysis with tool calls |
| DMind-2-4B   | 4B   | Local                     | Lightweight investment analysis     |
| DMind-1      | 32B  | Cloud                     | First Web3-native LLM               |
| DMind-1-mini | 14B  | Cloud / local             | Distilled Web3 agent model          |

All seven models, plus the benchmark dataset, are available at [huggingface.co/DMindAI](https://huggingface.co/DMindAI).


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/technology/dmind/model-family.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
