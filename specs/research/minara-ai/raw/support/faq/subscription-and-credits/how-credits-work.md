> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/support/faq/subscription-and-credits/how-credits-work.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# How credits work

We use credits to measure your usage on Minara. Whenever you perform actions that involve AI processing or specific workflow execution, credits are deducted based on token consumption.

#### When Are Credits Deducted?

Credits are deducted when a message or task is completed or manually stopped. Including:

1. Regular chats with Minara
2. Deep Research report generation
3. Workflow creation and execution (applicable to specific nodes)

If a response or task is interrupted due to a system error, **no credits will be deducted**.

#### How Many Credits Does Each Action Use?

Credit usage depends on the model you select.

#### Workflow Execution Rules

> **Note**: For now, credits are only deducted for Minara nodes. However, please note that all running workflows will be paused if credits run out.

| **Node Type** | **Credit Usage**            |
| ------------- | --------------------------- |
| Monitor       | Currently free              |
| Trade         | Free                        |
| Notify        | Currently free              |
| Minara Call   | Based on actual tokens used |

#### My credits decreased unexpectedly.

Check whether you have any active workflows. Each time a workflow runs, it deducts credits for the Minara nodes it contains. Workflows running on a schedule or trigger consume credits every time they execute. To stop the deductions, open Workflow and close any workflows you no longer need.

#### Understanding your credits cap

Your credits cap is the maximum balance your account can hold at any time. It is set by your subscription plan:

| **Plan** | **Credits Cap** |
| -------- | --------------- |
| Lite     | 1,400           |
| Starter  | 4,000           |
| Pro      | 20,000          |

<figure><img src="https://1511576976-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FV376SHLr8lDpX7dIqyDR%2Fuploads%2Fgit-blob-863e5e2729907d1b3dc68ecdda0d22e3053e6692%2Fcredits-cap-plans.png?alt=media" alt="Manage page showing Lite, Starter, and Pro plans with their respective credits allocations"><figcaption></figcaption></figure>

Referring friends to Minara increases both your credits balance and your credits cap. Rewards scale with how many invitees you have, and the larger reward comes when an invitee upgrades to a paid plan.

| Invitee count | Reward                                                                                        |
| ------------- | --------------------------------------------------------------------------------------------- |
| First 10      | 200 Credits per signup, plus 300 Credits + 50% Spark when the invitee upgrades to a paid plan |
| 11–50         | 400 Credits + 60% Spark when the invitee upgrades to a paid plan                              |
| More than 50  | 500 Credits + 70% Spark when the invitee upgrades to a paid plan                              |

To share your referral link, tap **Share Minara with friends** from the bottom navigation bar in the app. You can track invitee status under **My Invites** on the referral page.

If you have referral credits and then use features that consume credits (workflows, strategies, chat), your cap and balance may decrease together. The referral bonus raises your cap temporarily, and usage draws it down alongside your balance. This is expected behavior. We are working on improving how this is shown in the UI. If you have suggestions, share them with us in the [community](https://discord.com/invite/minaraai).

#### **Need More Credits?**

Minara refreshes your credits at the start of each monthly plan cycle. You can upgrade your plan (which takes effect immediately) or purchase a top-up credit pack (available only with an active subscription).


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/support/faq/subscription-and-credits/how-credits-work.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
