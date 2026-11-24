> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/support/faq/wallet-and-security/export-private-key.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Export your private key

Exporting your private key lets you import your Minara wallet into any compatible external wallet (MetaMask, Rabby, etc.) or recover it independently.

{% hint style="warning" %}
Your private key gives full control over your wallet. Never share it with anyone. Minara support will never ask for it. Each wallet allows a maximum of three successful exports in any 24-hour window.
{% endhint %}

## 1. Open Settings

Click your avatar in the top-right corner. In the left sidebar, select **Settings**.

Under the **Wallet** section, click **Export private key**.

<figure><img src="https://1511576976-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FV376SHLr8lDpX7dIqyDR%2Fuploads%2Fgit-blob-8121c41b8a8df68ee9ae926eea3f5dd5324c3ad1%2Fexport-key-settings.png?alt=media" alt="Settings panel showing the Export private key option under Wallet"><figcaption></figcaption></figure>

## 2. Select a wallet

Choose the wallet whose private key you want to export. Minara may hold multiple wallets — EVM Spot Wallet, Solana Spot Wallet, and any additional wallets you have created.

<figure><img src="https://1511576976-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FV376SHLr8lDpX7dIqyDR%2Fuploads%2Fgit-blob-c27c1f68e9de4e2575fd53923df8de1e807fc35f%2Fexport-key-select-wallet.png?alt=media" alt="Select Wallet dialog with EVM Spot Wallet, Solana Spot Wallet, Wallet A, and bot listed"><figcaption></figcaption></figure>

Click the wallet to select it, then click **Next**.

<figure><img src="https://1511576976-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FV376SHLr8lDpX7dIqyDR%2Fuploads%2Fgit-blob-2189a0de8de0feae7b0b012ca9a5d03d34931c78%2Fexport-key-wallet-selected.png?alt=media" alt="EVM Spot Wallet selected with radio button active"><figcaption></figcaption></figure>

## 3. Enable Authenticator App (first time only)

If you have not yet set up two-factor authentication on your account, Minara prompts you to do so before proceeding. You will see a QR code and a manual setup code.

Open your authenticator app (Google Authenticator, Authy, or any TOTP-compatible app), scan the QR code, and click **Next**.

{% hint style="info" %}
This step only appears once. After your authenticator app is linked, future exports skip directly to the verification step.
{% endhint %}

## 4. Enter your verification code

Enter the 6-digit code currently shown in your authenticator app. The code refreshes every 30 seconds — if it expires, wait for the next one.

## 5. Copy your private key

Your private key is shown but hidden by default. Make sure no one is looking at your screen, then click **Click to reveal**.

<figure><img src="https://1511576976-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FV376SHLr8lDpX7dIqyDR%2Fuploads%2Fgit-blob-96aec177b897329f9af4d138413d2fea9c89e6de%2Fexport-key-reveal.png?alt=media" alt="EVM Spot Wallet Private Key screen with hidden key and Click to reveal option"><figcaption></figcaption></figure>

Click **Copy** to copy the key to your clipboard. Store it somewhere secure — a password manager or encrypted storage. Do not save it in plain text.

Once you close this dialog, the key is no longer accessible through this screen. You can export again (up to three times per 24 hours) if needed.


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/support/faq/wallet-and-security/export-private-key.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
