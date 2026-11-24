> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/get-started/subscribe.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Subscribe

A paid plan raises your credit limit, unlocks more active workflows, and gives you the full feature set. See [Credits](https://minara.ai/docs/reference/credits.md) for what each plan includes and how credits are metered.

You can pay two ways: with crypto from your Minara Spot wallet, or with a card through Stripe. Both start from the same plan picker.

## Choose a plan

Click the plan label or `Upgrade` in the top bar.

<figure><img src="https://2791910906-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2Fkz0StyE54EpnCuzTSwSy%2Fuploads%2Fgit-blob-ad0e3fd97a26ccfffc2b58a8cc50f88c6dea03f3%2Fsubscribe-manage-plans.png?alt=media" alt="Manage dialog showing the Lite, Starter, and Pro plans with prices, a Pay annually toggle, and a Subscribe button on each"><figcaption></figcaption></figure>

In the `Manage` dialog, switch between `Individual` and `Business`, toggle `Pay annually` if you want annual billing, and click `Subscribe` on the plan you want.

<figure><img src="https://2791910906-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2Fkz0StyE54EpnCuzTSwSy%2Fuploads%2Fgit-blob-ed89adf11c31ebd343d44725493a6513d2a87dde%2Fimage.png?alt=media" alt=""><figcaption></figcaption></figure>

A confirmation dialog opens with the plan and price. Pick a payment method: `Pay with Minara Wallet` (crypto) or `Pay with Stripe` (card). The plan takes effect immediately, and Minara prorates the charge for the rest of the current billing period.

## Pay with crypto (Minara Wallet)

Crypto subscriptions are charged from your **Spot** wallet balance, not your Perps wallet. Fund the Spot wallet before you subscribe.

### 1. Deposit USDC to your Spot wallet

Click your avatar, select `Wallet`, and open the `Spot` tab. Click `Deposit`.

<figure><img src="https://2791910906-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2Fkz0StyE54EpnCuzTSwSy%2Fuploads%2Fgit-blob-5e2c8eae064f8d8d44d7d38a04d2129d3f18020a%2Fsubscribe-spot-wallet-deposit.png?alt=media" alt="Wallet panel on the Spot tab showing the balance, holdings, and the highlighted Deposit button"><figcaption></figcaption></figure>

Select a chain and send USDC to the address shown. Scan the QR code or click `Copy` to get the address.

{% hint style="warning" %}
For subscription payments, deposit USDC on a non-EVM chain. We recommend **Solana**. Deposits can take around 15 minutes to credit your Spot wallet.
{% endhint %}

<figure><img src="https://2791910906-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2Fkz0StyE54EpnCuzTSwSy%2Fuploads%2Fgit-blob-aaef2aff268f0a38fa50749cd771aade5fff026f%2Fsubscribe-deposit-solana.png?alt=media" alt="Deposit dialog with Solana selected as the chain, a QR code, and the deposit address with a Copy button"><figcaption></figcaption></figure>

<figure><img src="https://2791910906-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2Fkz0StyE54EpnCuzTSwSy%2Fuploads%2Fgit-blob-40762b7cbb05cf67de5bfe1112eb4c16b10fd98d%2Fimage.png?alt=media" alt=""><figcaption></figcaption></figure>

### 2. Pay with your wallet balance

Once the deposit lands, open the plan picker again, click `Subscribe` on your plan, and choose `Pay with Minara Wallet`. Review the amount and the payment execution cost, then click `Confirm`.

<figure><img src="https://2791910906-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2Fkz0StyE54EpnCuzTSwSy%2Fuploads%2Fgit-blob-1ee393bae9d81e5c90673dd36574935c91493123%2Fsubscribe-pay-with-wallet.png?alt=media" alt="Pay with Minara Wallet dialog showing the plan, price, payment execution cost, and an Insufficient Payable Balance message"><figcaption></figcaption></figure>

{% hint style="info" %}
`Insufficient Payable Balance` means your Spot wallet does not hold enough USDC. Deposit more, or wait for a pending deposit to credit, then try again.
{% endhint %}

## Pay with card (Stripe)

In the confirmation dialog, click `Pay with Stripe` and complete the card checkout. You do not need to fund a wallet to pay by card.

<figure><img src="https://2791910906-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2Fkz0StyE54EpnCuzTSwSy%2Fuploads%2Fgit-blob-7d28271d27e2487e85623dafc6bc0cbce60381d0%2Fsubscribe-confirm-stripe.png?alt=media" alt="Subscribe confirmation dialog showing the plan and price, with the Pay with Stripe button highlighted next to Pay with Minara Wallet"><figcaption></figcaption></figure>


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/get-started/subscribe.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
