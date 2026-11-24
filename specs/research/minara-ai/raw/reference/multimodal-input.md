> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/reference/multimodal-input.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Multimodal input

You can upload images and files directly in the chat input alongside your prompt. Minara reads the content and incorporates it into its response.

**Limits:** up to 5 files per upload, 10 MB per file.

**Supported formats:** images (PNG, JPG, etc.), Excel/CSV, PDF.

***

## How to use it

Click the attachment icon in the chat input, select your files, then type your question or instruction. Minara processes the files together with your text and responds in one message.

For best results, enable **Quality mode** when working with large or complex files.

***

## What you can do with it

**Chart analysis**

Upload a candlestick chart screenshot — raw or with your own annotations (trend lines, arrows, support/resistance levels). Minara reads the price structure and evaluates the logic of any annotations you've added.

**Tweet or news screenshot review**

Upload a screenshot of a tweet or news article. For tweets, Minara assesses the account and content for credibility signals. For news articles, Minara extracts the source, claims, and context, and flags anything that may be missing or misrepresented.

**Excel/CSV analysis**

Upload trading records or a dataset. Minara reads the structure, identifies patterns, summarizes P\&L drivers, and suggests improvements based on the data.

**PDF summary**

Upload a whitepaper or report. Minara summarizes the key claims, evaluates technical feasibility, tokenomics (if applicable), team credibility, and highlights risks.

***

## Tips

* Pair files with a specific question — the more precise your prompt, the more useful the response.
* You can upload multiple related files at once and ask questions that span all of them.
* Well-formatted spreadsheets and text-selectable PDFs produce better results than scanned images of documents.


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/reference/multimodal-input.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
