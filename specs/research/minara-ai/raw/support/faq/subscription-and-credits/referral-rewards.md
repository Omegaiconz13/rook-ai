> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/support/faq/subscription-and-credits/referral-rewards.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Referral rewards

Invite your friends to join Minara and earn rewards together.

### Step by Step Guide

1. **Get your invite link**\
   You'll find them in the **Invites** section of your profile.
2. **Share with friends**\
   Send your link or code to people who haven't joined Minara yet.\
   When they register their account using your invite, it counts as a referral.
3. **Earn rewards**\
   You receive **Credits and Sparks** automatically based on the action of your invitees. (See "Reward Details" below for more details.)
4. **Track your progress**\
   See your total invites, paid conversions, and rewards at a glance in your **Profile** - **Invites**.

{% columns %}
{% column %}

<figure><img src="https://1511576976-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FV376SHLr8lDpX7dIqyDR%2Fuploads%2Fgit-blob-433a0875278935f6290f94c579b57c223b9f162f%2Fimage.png?alt=media" alt=""><figcaption></figcaption></figure>
{% endcolumn %}

{% column %}

<figure><img src="https://1511576976-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FV376SHLr8lDpX7dIqyDR%2Fuploads%2Fgit-blob-eae5456438da3e3820ba839a92f50065ea33c23b%2F%E5%9B%BE%E7%89%87.png?alt=media" alt=""><figcaption></figcaption></figure>
{% endcolumn %}
{% endcolumns %}

***

### Reward Tiers

Minara's referral program uses a tiered reward system, and your rewards as an inviter increase as you bring more users to Minara.

Each tier is determined by the **total number of invitees** who have successfully signed up through your link.

Inviter rewards vary by tier and are granted when an invitee purchases a **paid plan for the first time**.

<table><thead><tr><th width="152">Tier</th><th>Inviter Reward</th></tr></thead><tbody><tr><td>First 10 Invites</td><td><p><strong>Signup Reward:</strong> 200 Credits for each signup</p><p><strong>First Purchase Reward:</strong></p><ul><li>300 Credits</li><li>50% of the Sparks your invitee receives from their first paid plan</li></ul></td></tr><tr><td>11 to 50 Invites</td><td><p><strong>Signup Reward:</strong> None</p><p><strong>First Purchase Reward:</strong></p><ul><li>400 Credits</li><li>60% of the Sparks your invitee receives from their first paid plan</li></ul></td></tr><tr><td>Above 50 invites</td><td><p><strong>Signup Reward:</strong> None</p><p><strong>First Purchase Reward:</strong></p><ul><li>500 Credits</li><li>70% of the Sparks your invitee receives from their first paid plan</li></ul></td></tr></tbody></table>

{% hint style="info" %}
**Invitee rewards remain the same:** every invitee receives extra **200 Credits** upon signup.
{% endhint %}

The reward inviter receives is determined at the moment when a reward-triggering event occurs.

This means:

* If you have **11 signups** when one of your early invitees pays for their first time,\
  → you receive **Tier 2 rewards (400 Credits + 60% Sparks)** for that payment.
* If you have **51 signups** at that time,\
  → you receive **Tier 3 rewards (500 Credits + 70% Sparks)**.

> *Credits* can be used across Minara's features. Learn more about credits in [How credits work](https://minara.ai/docs/support/faq/subscription-and-credits/how-credits-work.md)\
> \&#xNAN;*Sparks* are special bonuses for limited events. Check out [What are Sparks?](https://minara.ai/docs/support/faq/subscription-and-credits/sparks.md) for more details

***

### 💬 FAQs

**Q1. Do I keep my rewards even if my plan has expired?**\
Yes. Earned Credits and Sparks remain in your account.

**Q2. How is the Sparks bonus split?**\
Your friend receives the full Sparks bonus based on their plan (as normal), and you receive 50 % of the amount they receive.

**Q3. Do reward credits expire?**

Reward credits do not expire. Credits are used in the following order whenever you spend them:

1. **Plan Credits** – your plan credits that refresh every month;
2. **Reward Credits** – credits you earn from referral rewards;
3. **Top-up Credits** – credits you purchase manually as add-ons.

**Q4. My invitee has paid. Why didn't I receive more rewards?**

Please note that rewards are only granted for the **invitee's first paid plan.** If you didn't receive rewards correctly, please submit a ticket in our Discord.

**Q5. Do invitee rewards change based on the inviter's tier?**

No. Invitee rewards always remain the same.

**Q6. Does the order in which people sign up matter?**

No. The rewards you receive as an inviter are determined by your tier at the time the reward event is triggered.

**Q7. Why didn't I receive signup Credits when inviting people?**

Please check your reward tier. Signup Credits for inviters are only granted in Tier 1 (the first 10 invitees). If you still believe your rewards are incorrect, please contact us through [Discord](https://discord.com/invite/minaraai).


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/support/faq/subscription-and-credits/referral-rewards.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
