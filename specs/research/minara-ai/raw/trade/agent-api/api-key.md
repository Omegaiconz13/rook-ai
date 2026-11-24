> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/trade/agent-api/api-key.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# API Key

The API Key method is available to **Pro** and **Partner** plan users. Generate keys from your Minara profile and include them in the `Authorization` header of every request.

***

## Requirements

The Minara Agent API is available exclusively to Pro and Partner plan subscribers. If you are on a free plan, navigate to the **API** tab in your profile to see the upgrade prompt.

If you downgrade your subscription, all active API keys are automatically paused and resume when you renew.

***

## Creating an API key

1. Go to your **Account Profile** at [minara.ai](https://minara.ai).
2. Select the **API Key** tab from the left menu and click **Create**.

<figure><img src="https://2791910906-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2Fkz0StyE54EpnCuzTSwSy%2Fuploads%2Fgit-blob-e958890ebd6c1a7f641d9465187db4fd0dc13c2b%2FScreen%20Shot%202026-01-26%20at%2010.42.53%20PM.png?alt=media" alt="API Key tab in Minara account profile showing Create button"><figcaption></figcaption></figure>

3. Enter a name and description to identify the key's usage.

<figure><img src="https://2791910906-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2Fkz0StyE54EpnCuzTSwSy%2Fuploads%2Fgit-blob-35297773ccb48ce65cebfc244c55f3247d4e45d4%2FScreen%20Shot%202026-01-26%20at%2010.36.10%20PM-creat-api-key.png?alt=media" alt="Create API key dialog with name and description fields"><figcaption></figcaption></figure>

4. Once created, your API key is displayed. Copy and store it securely — it will not be shown again.

<figure><img src="https://2791910906-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2Fkz0StyE54EpnCuzTSwSy%2Fuploads%2Fgit-blob-83ddb03771ed5004a627ea69541f9ada83b3212f%2FScreen%20Shot%202026-01-26%20at%2010.36.28%20PM.png?alt=media" alt="Newly created API key displayed for copying"><figcaption></figcaption></figure>

***

## Managing API keys

| Action         | Details                                                                                |
| -------------- | -------------------------------------------------------------------------------------- |
| **View keys**  | Keys are listed with only the last 4 characters visible. Click to reveal the full key. |
| **Key limit**  | Up to 5 API keys per Pro/Partner account.                                              |
| **Delete key** | Requires 2FA confirmation. Deletion is permanent.                                      |

***

## Authentication

Include your API key in the `Authorization` header of every request:

```
Authorization: Bearer <YOUR_API_KEY>
```

**Example:**

```bash
curl -H "Authorization: Bearer sk-minara-xxxxxxxx" \
  https://api.minara.ai/v1/developer/chat
```

{% hint style="warning" %}
Treat your API keys like passwords. Never expose them in client-side code or public repositories.
{% endhint %}

***

## Billing

All API calls consume **credits** from your Minara account. If credits run out, API requests pause until replenished.

***

## API reference

Base URL: `https://api.minara.ai`

### Chat

**`POST /v1/developer/chat`**

## Developer Chat

> Developer chat endpoint supporting streaming, non-streaming, and asynchronous (background) response modes, with optional requestId-based idempotency.

```json
{"openapi":"3.0.0","info":{"title":"Minara Agent API","version":"1.0"},"servers":[{"url":"https://api-developer.minara.ai"}],"security":[{"BearerAuth":[]}],"components":{"securitySchemes":{"BearerAuth":{"type":"http","scheme":"bearer","bearerFormat":"API-KEY","description":"Format: Authorization: Bearer <YOUR_API_KEY>"}},"schemas":{"ChatRequest":{"type":"object","required":["mode","message"],"properties":{"mode":{"type":"string","enum":["fast","expert"],"description":"Required. Model mode: 'fast' for quick responses, 'expert' for in-depth analysis."},"stream":{"type":"boolean","default":false,"description":"Optional. Set to true for streaming (SSE), false (default) for standard JSON response. Cannot be combined with background."},"background":{"type":"boolean","default":false,"description":"Optional. Set to true to run a non-streaming request asynchronously and poll the result later. Requires stream: false."},"requestId":{"type":"string","pattern":"^[A-Za-z0-9._:-]+$","minLength":1,"maxLength":128,"description":"Optional. Client-generated idempotency key, unique within the API key. 1-128 chars matching ^[A-Za-z0-9._:-]+$."},"chatId":{"type":"string","description":"Optional. Existing chat to continue. A new chat is created if omitted."},"message":{"$ref":"#/components/schemas/Message"}}},"Message":{"type":"object","required":["role","content"],"properties":{"role":{"type":"string","enum":["user"],"description":"Required. Message sender role, must be 'user'."},"content":{"type":"string","description":"Required. The user's query content."}}},"ChatResponse":{"type":"object","properties":{"id":{"type":"string","description":"Server-assigned request id. Present when a requestId was supplied."},"requestId":{"type":"string","description":"Your idempotency key, echoed when one was provided."},"chatId":{"type":"string","description":"Unique conversation ID."},"messageId":{"type":"string","description":"Unique message ID for this response."},"content":{"type":"string","description":"The AI-generated response content."},"usage":{"type":"object","description":"Usage statistics for the request."}}},"ChatAcceptedResponse":{"type":"object","properties":{"id":{"type":"string","description":"Server-assigned request id (e.g. bg_abc123)."},"requestId":{"type":"string","description":"Your idempotency key, if one was provided."},"chatId":{"type":"string","description":"Chat the request belongs to."},"status":{"type":"string","enum":["queued"],"description":"Initial status of the accepted asynchronous request."}}}}},"paths":{"/v1/developer/chat":{"post":{"summary":"Developer Chat","description":"Developer chat endpoint supporting streaming, non-streaming, and asynchronous (background) response modes, with optional requestId-based idempotency.","operationId":"developerChat","requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/ChatRequest"}}}},"responses":{"200":{"description":"Successful response (stream/background not set, or a completed idempotent replay).","content":{"application/json":{"schema":{"$ref":"#/components/schemas/ChatResponse"}},"text/event-stream":{"schema":{"type":"string","description":"Server-Sent Events (SSE) stream. Each event line starts with `data:`.\nThe final message is formed by concatenating chunk/delta content in order.\n"}}}},"202":{"description":"Accepted. Returned for background requests, or when an idempotent request is still running.","content":{"application/json":{"schema":{"$ref":"#/components/schemas/ChatAcceptedResponse"}}}},"400":{"description":"Bad Request. E.g. combining background=true with stream=true."},"401":{"description":"Unauthorized - Invalid or missing API key"},"409":{"description":"Conflict. The requestId was already used with a different request, or has expired and cannot be reused."}}}}}}
```

| Parameter         | Type    | Required | Description                                                |
| ----------------- | ------- | -------- | ---------------------------------------------------------- |
| `mode`            | string  | Yes      | `fast` for quick responses, `expert` for in-depth analysis |
| `stream`          | boolean | Yes      | `true` for SSE streaming, `false` for standard JSON        |
| `message.role`    | string  | Yes      | Must be `user`                                             |
| `message.content` | string  | Yes      | The query content                                          |

**Example:**

```bash
curl -X POST https://api.minara.ai/v1/developer/chat \
  -H "Authorization: Bearer <YOUR_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "fast",
    "stream": false,
    "message": { "role": "user", "content": "Analyze the recent price action of SOL." }
  }'
```

***

### Intent to swap transaction

**`POST /v1/developer/intent-to-swap-tx`**

## Intent to Swap Transaction

> Convert natural language trading intent into an executable swap transaction payload. Compatible with OKX DEX by default.

```json
{"openapi":"3.0.0","info":{"title":"Minara Agent API","version":"1.0"},"servers":[{"url":"https://api-developer.minara.ai"}],"security":[{"BearerAuth":[]}],"components":{"securitySchemes":{"BearerAuth":{"type":"http","scheme":"bearer","bearerFormat":"API-KEY","description":"Format: Authorization: Bearer <YOUR_API_KEY>"}},"schemas":{"IntentToSwapRequest":{"type":"object","required":["intent","walletAddress"],"properties":{"intent":{"type":"string","description":"Required. Natural language swap intent (e.g., 'swap 0.1 ETH to USDC')."},"walletAddress":{"type":"string","description":"Required. User wallet address (0x...)."},"chain":{"type":"string","description":"Optional. Chain name (e.g., 'base', 'ethereum', 'bsc', 'arbitrum', 'optimism')."}}},"SwapTransactionResponse":{"type":"object","properties":{"intent":{"type":"object","description":"Parsed user intent","properties":{"chain":{"type":"string","description":"Chain name (e.g., 'base')."},"inputTokenAddress":{"type":"string","nullable":true,"description":"Input token contract address (null for native token)."},"inputTokenSymbol":{"type":"string","description":"Input token symbol (e.g., 'ETH')."},"outputTokenAddress":{"type":"string","description":"Output token contract address."},"outputTokenSymbol":{"type":"string","description":"Output token symbol (e.g., 'USDC')."},"amount":{"type":"string","description":"Token amount in wei/smallest unit."},"userWalletAddress":{"type":"string","description":"User's wallet address."}}},"quote":{"type":"object","description":"Swap quote and pricing information","properties":{"fromTokenAmount":{"type":"string","description":"Input token amount in smallest unit."},"toTokenAmount":{"type":"string","description":"Expected output token amount in smallest unit."},"estimatedGas":{"type":"string","description":"Estimated gas cost for the transaction."},"priceImpact":{"type":"string","description":"Price impact percentage."},"tradeFee":{"type":"string","description":"Trading fee amount."}}},"inputToken":{"type":"object","description":"Input token details","properties":{"address":{"type":"string","description":"Token contract address."},"symbol":{"type":"string","description":"Token symbol."},"decimals":{"type":"string","description":"Token decimals."},"unitPrice":{"type":"string","description":"Token unit price in USD."}}},"outputToken":{"type":"object","description":"Output token details","properties":{"address":{"type":"string","description":"Token contract address."},"symbol":{"type":"string","description":"Token symbol."},"decimals":{"type":"string","description":"Token decimals."},"unitPrice":{"type":"string","description":"Token unit price in USD."}}},"unsignedTx":{"type":"object","description":"Unsigned transaction ready to be signed and broadcasted","properties":{"chainType":{"type":"string","description":"Chain type (e.g., 'evm')."},"from":{"type":"string","description":"Sender address."},"to":{"type":"string","description":"Contract address to call."},"data":{"type":"string","description":"Encoded transaction data."},"value":{"type":"string","description":"Native token value to send (in wei)."},"gas":{"type":"string","description":"Gas limit."},"gasPrice":{"type":"string","description":"Gas price (legacy)."},"maxPriorityFeePerGas":{"type":"string","description":"Max priority fee per gas (EIP-1559)."}}},"approval":{"type":"object","description":"Token approval information (required for ERC20 token swaps)","properties":{"isRequired":{"type":"boolean","description":"Whether token approval is required before swap."},"tokenAddress":{"type":"string","description":"Token contract address that needs approval."},"spenderAddress":{"type":"string","description":"Spender address (DEX router) that needs approval."},"requiredAmount":{"type":"string","description":"Minimum token amount that needs to be approved."},"approveAmount":{"type":"string","description":"Recommended approval amount."},"currentAllowance":{"type":"string","description":"Current approved allowance for the spender."},"message":{"type":"string","description":"Human-readable approval status message."}}}}}}},"paths":{"/v1/developer/intent-to-swap-tx":{"post":{"summary":"Intent to Swap Transaction","description":"Convert natural language trading intent into an executable swap transaction payload. Compatible with OKX DEX by default.","operationId":"intentToSwap","requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/IntentToSwapRequest"}}}},"responses":{"200":{"description":"Swap transaction generated","content":{"application/json":{"schema":{"$ref":"#/components/schemas/SwapTransactionResponse"}}}},"401":{"description":"Unauthorized - Invalid or missing API key"}}}}}}
```

Convert natural language trading intent into an executable swap transaction payload, compatible with OKX DEX by default.

| Parameter       | Type   | Required | Description                                                 |
| --------------- | ------ | -------- | ----------------------------------------------------------- |
| `intent`        | string | Yes      | Natural language swap intent (e.g., "swap 0.1 ETH to USDC") |
| `walletAddress` | string | Yes      | User wallet address (0x...)                                 |
| `chain`         | string | No       | Chain name (e.g., "base", "ethereum", "arbitrum")           |

**Example:**

```bash
curl -X POST https://api.minara.ai/v1/developer/intent-to-swap-tx \
  -H "Authorization: Bearer <YOUR_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "intent": "swap 0.1 ETH to USDC",
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
    "chain": "base"
  }'
```

***

### Perpetual trading suggestion

**`POST /v1/developer/perp-trading-suggestion`**

## Perpetual Trading Suggestion

> Get AI-powered perpetual trading suggestions with long/short recommendations, entry price, stop loss, take profit levels, and confidence score based on comprehensive market analysis.

```json
{"openapi":"3.0.0","info":{"title":"Minara Agent API","version":"1.0"},"servers":[{"url":"https://api-developer.minara.ai"}],"security":[{"BearerAuth":[]}],"components":{"securitySchemes":{"BearerAuth":{"type":"http","scheme":"bearer","bearerFormat":"API-KEY","description":"Format: Authorization: Bearer <YOUR_API_KEY>"}},"schemas":{"PerpTradingRequest":{"type":"object","required":["symbol"],"properties":{"symbol":{"type":"string","description":"Required. Trading symbol (e.g., 'BTC', 'ETH', 'SOL')."},"style":{"type":"string","enum":["scalping","day-trading","swing-trading"],"default":"scalping","description":"Optional. Trading style: 'scalping', 'day-trading', or 'swing-trading'. Default: 'scalping'."},"marginUSD":{"type":"number","default":1000,"description":"Optional. Margin in USD. Default: 1000."},"leverage":{"type":"number","default":10,"minimum":1,"maximum":40,"description":"Optional. Leverage multiplier (max: 40). Default: 10."},"strategy":{"type":"string","default":"max-profit","description":"Optional. Strategy type. Default: 'max-profit'. More strategies coming soon."}}},"PerpTradingResponse":{"type":"object","properties":{"entryPrice":{"type":"number","description":"Recommended entry price."},"side":{"type":"string","enum":["long","short"],"description":"Trading side recommendation."},"stopLossPrice":{"type":"number","description":"Recommended stop loss price."},"takeProfitPrice":{"type":"number","description":"Recommended take profit price."},"confidence":{"type":"number","minimum":0,"maximum":100,"description":"Confidence score (0-100)."},"reasons":{"type":"array","items":{"type":"string"},"description":"Analysis reasons based on technical indicators."},"risks":{"type":"array","items":{"type":"string"},"description":"Risk factors to consider."}}}}},"paths":{"/v1/developer/perp-trading-suggestion":{"post":{"summary":"Perpetual Trading Suggestion","description":"Get AI-powered perpetual trading suggestions with long/short recommendations, entry price, stop loss, take profit levels, and confidence score based on comprehensive market analysis.","operationId":"perpTradingSuggestion","requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/PerpTradingRequest"}}}},"responses":{"200":{"description":"Perpetual trading suggestion","content":{"application/json":{"schema":{"$ref":"#/components/schemas/PerpTradingResponse"}}}},"401":{"description":"Unauthorized - Invalid or missing API key"}}}}}}
```

Get AI-powered perpetual trading suggestions with long/short recommendations, entry, stop loss, take profit, and confidence score.

| Parameter   | Type   | Required | Description                                   |
| ----------- | ------ | -------- | --------------------------------------------- |
| `symbol`    | string | Yes      | Trading symbol (e.g., "BTC", "ETH", "SOL")    |
| `style`     | string | No       | `scalping`, `day-trading`, or `swing-trading` |
| `marginUSD` | number | No       | Margin in USD                                 |
| `leverage`  | number | No       | Leverage multiplier (max: 40)                 |
| `strategy`  | string | No       | Strategy type                                 |

**Example:**

```bash
curl -X POST https://api.minara.ai/v1/developer/perp-trading-suggestion \
  -H "Authorization: Bearer <YOUR_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTC",
    "style": "day-trading",
    "marginUSD": 1000,
    "leverage": 10
  }'
```

***

### Prediction market analysis

**`POST /v1/developer/prediction-market-ask`**

## Prediction Market Analysis

> AI-powered prediction market analysis. Analyze prediction market events and get probability estimates for each outcome with detailed reasoning.

```json
{"openapi":"3.0.0","info":{"title":"Minara Agent API","version":"1.0"},"servers":[{"url":"https://api-developer.minara.ai"}],"security":[{"BearerAuth":[]}],"components":{"securitySchemes":{"BearerAuth":{"type":"http","scheme":"bearer","bearerFormat":"API-KEY","description":"Format: Authorization: Bearer <YOUR_API_KEY>"}},"schemas":{"PredictionMarketRequest":{"type":"object","required":["link","mode"],"properties":{"link":{"type":"string","description":"Required. Prediction market page link (e.g., Polymarket event URL)."},"mode":{"type":"string","enum":["fast","expert"],"description":"Required. Chat mode: 'fast' or 'expert'."},"only_result":{"type":"boolean","default":false,"description":"Optional. Only return prediction probabilities without reasoning. Default: false."},"customPrompt":{"type":"string","description":"Optional. Custom instructions to guide the analysis. Use this to specify focus areas, risk preferences, or analysis style."}}},"PredictionMarketResponse":{"type":"object","properties":{"predictions":{"type":"array","description":"Array of prediction outcomes. Each outcome represents an event option with its yes/no probabilities.","items":{"type":"object","properties":{"outcome":{"type":"string","description":"Outcome name (event option, e.g., candidate name, team name)."},"yesProb":{"type":"number","description":"Probability of YES for this outcome (0-1)."},"noProb":{"type":"number","description":"Probability of NO for this outcome (0-1)."}}}},"reasoning":{"type":"string","description":"AI reasoning and analysis (empty if only_result=true)."}}}}},"paths":{"/v1/developer/prediction-market-ask":{"post":{"summary":"Prediction Market Analysis","description":"AI-powered prediction market analysis. Analyze prediction market events and get probability estimates for each outcome with detailed reasoning.","operationId":"predictionMarketAsk","requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/PredictionMarketRequest"}}}},"responses":{"200":{"description":"Prediction market analysis","content":{"application/json":{"schema":{"$ref":"#/components/schemas/PredictionMarketResponse"}}}},"401":{"description":"Unauthorized - Invalid or missing API key"}}}}}}
```

AI-powered probability estimates for prediction market outcomes.

| Parameter      | Type    | Required | Description                                    |
| -------------- | ------- | -------- | ---------------------------------------------- |
| `link`         | string  | Yes      | Prediction market event URL (e.g., Polymarket) |
| `mode`         | string  | Yes      | `fast` or `expert`                             |
| `only_result`  | boolean | No       | Return probabilities only, without reasoning   |
| `customPrompt` | string  | No       | Custom instructions to guide the analysis      |

**Example:**

```bash
curl -X POST https://api.minara.ai/v1/developer/prediction-market-ask \
  -H "Authorization: Bearer <YOUR_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "link": "https://polymarket.com/event/example",
    "mode": "fast"
  }'
```


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/trade/agent-api/api-key.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
