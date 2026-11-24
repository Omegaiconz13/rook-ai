> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/trade/agent-api/api-reference-x402.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# API Reference (x402)

### Developer x402 API

Technical specifications for Minara's x402 endpoints using the Pay-As-You-Go model.

**Base URL**: `https://x402.minara.ai`

## Chat (Base Chain)

> Ask Minara AI - Intelligent crypto assistant

```json
{"openapi":"3.0.0","info":{"title":"Minara x402 API","version":"1.0"},"servers":[{"url":"https://x402.minara.ai"}],"security":[{"x402Payment":[]}],"components":{"securitySchemes":{"x402Payment":{"type":"apiKey","in":"header","name":"x-payment-response","description":"Payment proof token obtained from x402 payment challenge flow. Required after completing payment."}},"schemas":{"ChatRequest":{"type":"object","required":["userQuery"],"properties":{"userQuery":{"type":"string","description":"Required. User query content."}}},"ChatResponse":{"type":"object","properties":{"content":{"type":"string","description":"AI response content."}}},"BadRequestError":{"type":"object","properties":{"error":{"type":"string"},"message":{"type":"string"}}},"UnauthorizedError":{"type":"object","properties":{"error":{"type":"string"},"message":{"type":"string"}}},"PaymentRequiredError":{"type":"object","properties":{"error":{"type":"string"},"message":{"type":"string"},"paymentInstructions":{"type":"object","properties":{"amount":{"type":"string","description":"Payment amount required."},"currency":{"type":"string","description":"Payment currency (e.g., USDC)."},"recipient":{"type":"string","description":"Payment recipient address."},"chain":{"type":"string","description":"Blockchain for payment."}}}}}}},"paths":{"/x402/chat":{"post":{"summary":"Chat (Base Chain)","description":"Ask Minara AI - Intelligent crypto assistant","operationId":"x402Chat","tags":["AI"],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/ChatRequest"}}}},"responses":{"201":{"description":"Successful response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/ChatResponse"}}}},"400":{"description":"Bad Request - Invalid parameters","content":{"application/json":{"schema":{"$ref":"#/components/schemas/BadRequestError"}}}},"401":{"description":"Unauthorized - Invalid payment response token","content":{"application/json":{"schema":{"$ref":"#/components/schemas/UnauthorizedError"}}}},"402":{"description":"Payment Required","content":{"application/json":{"schema":{"$ref":"#/components/schemas/PaymentRequiredError"}}}}}}}}}
```

## Chat Expert (Base Chain)

> Ask Minara AI - Intelligent crypto assistant

```json
{"openapi":"3.0.0","info":{"title":"Minara x402 API","version":"1.0"},"servers":[{"url":"https://x402.minara.ai"}],"security":[{"x402Payment":[]}],"components":{"securitySchemes":{"x402Payment":{"type":"apiKey","in":"header","name":"x-payment-response","description":"Payment proof token obtained from x402 payment challenge flow. Required after completing payment."}},"schemas":{"ChatRequest":{"type":"object","required":["userQuery"],"properties":{"userQuery":{"type":"string","description":"Required. User query content."}}},"ChatResponse":{"type":"object","properties":{"content":{"type":"string","description":"AI response content."}}},"PaymentRequiredError":{"type":"object","properties":{"error":{"type":"string"},"message":{"type":"string"},"paymentInstructions":{"type":"object","properties":{"amount":{"type":"string","description":"Payment amount required."},"currency":{"type":"string","description":"Payment currency (e.g., USDC)."},"recipient":{"type":"string","description":"Payment recipient address."},"chain":{"type":"string","description":"Blockchain for payment."}}}}}}},"paths":{"/x402/chat/expert":{"post":{"summary":"Chat Expert (Base Chain)","description":"Ask Minara AI - Intelligent crypto assistant","operationId":"x402ChatExpert","tags":["AI"],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/ChatRequest"}}}},"responses":{"201":{"description":"Successful response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/ChatResponse"}}}},"400":{"description":"Bad Request - Invalid parameters"},"401":{"description":"Unauthorized - Invalid payment response token"},"402":{"description":"Payment Required","content":{"application/json":{"schema":{"$ref":"#/components/schemas/PaymentRequiredError"}}}}}}}}}
```

## Chat (Polygon Chain)

> Ask Minara AI - Intelligent crypto assistant

```json
{"openapi":"3.0.0","info":{"title":"Minara x402 API","version":"1.0"},"servers":[{"url":"https://x402.minara.ai"}],"security":[{"x402Payment":[]}],"components":{"securitySchemes":{"x402Payment":{"type":"apiKey","in":"header","name":"x-payment-response","description":"Payment proof token obtained from x402 payment challenge flow. Required after completing payment."}},"schemas":{"ChatRequest":{"type":"object","required":["userQuery"],"properties":{"userQuery":{"type":"string","description":"Required. User query content."}}},"ChatResponse":{"type":"object","properties":{"content":{"type":"string","description":"AI response content."}}},"BadRequestError":{"type":"object","properties":{"error":{"type":"string"},"message":{"type":"string"}}},"UnauthorizedError":{"type":"object","properties":{"error":{"type":"string"},"message":{"type":"string"}}},"PaymentRequiredError":{"type":"object","properties":{"error":{"type":"string"},"message":{"type":"string"},"paymentInstructions":{"type":"object","properties":{"amount":{"type":"string","description":"Payment amount required."},"currency":{"type":"string","description":"Payment currency (e.g., USDC)."},"recipient":{"type":"string","description":"Payment recipient address."},"chain":{"type":"string","description":"Blockchain for payment."}}}}}}},"paths":{"/x402/polygon/chat":{"post":{"summary":"Chat (Polygon Chain)","description":"Ask Minara AI - Intelligent crypto assistant","operationId":"x402PolygonChat","tags":["AI"],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/ChatRequest"}}}},"responses":{"201":{"description":"Successful response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/ChatResponse"}}}},"400":{"description":"Bad Request - Invalid parameters","content":{"application/json":{"schema":{"$ref":"#/components/schemas/BadRequestError"}}}},"401":{"description":"Unauthorized - Invalid payment response token","content":{"application/json":{"schema":{"$ref":"#/components/schemas/UnauthorizedError"}}}},"402":{"description":"Payment Required","content":{"application/json":{"schema":{"$ref":"#/components/schemas/PaymentRequiredError"}}}}}}}}}
```

## Chat Expert (Polygon Chain)

> Ask Minara AI - Intelligent crypto assistant

```json
{"openapi":"3.0.0","info":{"title":"Minara x402 API","version":"1.0"},"servers":[{"url":"https://x402.minara.ai"}],"security":[{"x402Payment":[]}],"components":{"securitySchemes":{"x402Payment":{"type":"apiKey","in":"header","name":"x-payment-response","description":"Payment proof token obtained from x402 payment challenge flow. Required after completing payment."}},"schemas":{"ChatRequest":{"type":"object","required":["userQuery"],"properties":{"userQuery":{"type":"string","description":"Required. User query content."}}},"ChatResponse":{"type":"object","properties":{"content":{"type":"string","description":"AI response content."}}},"PaymentRequiredError":{"type":"object","properties":{"error":{"type":"string"},"message":{"type":"string"},"paymentInstructions":{"type":"object","properties":{"amount":{"type":"string","description":"Payment amount required."},"currency":{"type":"string","description":"Payment currency (e.g., USDC)."},"recipient":{"type":"string","description":"Payment recipient address."},"chain":{"type":"string","description":"Blockchain for payment."}}}}}}},"paths":{"/x402/polygon/chat/expert":{"post":{"summary":"Chat Expert (Polygon Chain)","description":"Ask Minara AI - Intelligent crypto assistant","operationId":"x402PolygonChatExpert","tags":["AI"],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/ChatRequest"}}}},"responses":{"201":{"description":"Successful response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/ChatResponse"}}}},"400":{"description":"Bad Request - Invalid parameters"},"401":{"description":"Unauthorized - Invalid payment response token"},"402":{"description":"Payment Required","content":{"application/json":{"schema":{"$ref":"#/components/schemas/PaymentRequiredError"}}}}}}}}}
```

## Chat (Solana Chain)

> Ask Minara AI - Intelligent crypto assistant

```json
{"openapi":"3.0.0","info":{"title":"Minara x402 API","version":"1.0"},"servers":[{"url":"https://x402.minara.ai"}],"security":[{"x402Payment":[]}],"components":{"securitySchemes":{"x402Payment":{"type":"apiKey","in":"header","name":"x-payment-response","description":"Payment proof token obtained from x402 payment challenge flow. Required after completing payment."}},"schemas":{"ChatRequest":{"type":"object","required":["userQuery"],"properties":{"userQuery":{"type":"string","description":"Required. User query content."}}},"ChatResponse":{"type":"object","properties":{"content":{"type":"string","description":"AI response content."}}},"PaymentRequiredError":{"type":"object","properties":{"error":{"type":"string"},"message":{"type":"string"},"paymentInstructions":{"type":"object","properties":{"amount":{"type":"string","description":"Payment amount required."},"currency":{"type":"string","description":"Payment currency (e.g., USDC)."},"recipient":{"type":"string","description":"Payment recipient address."},"chain":{"type":"string","description":"Blockchain for payment."}}}}}}},"paths":{"/x402/solana/chat":{"post":{"summary":"Chat (Solana Chain)","description":"Ask Minara AI - Intelligent crypto assistant","operationId":"x402SolanaChat","tags":["AI"],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/ChatRequest"}}}},"responses":{"201":{"description":"Successful response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/ChatResponse"}}}},"400":{"description":"Bad Request - Invalid parameters"},"401":{"description":"Unauthorized - Invalid payment response token"},"402":{"description":"Payment Required","content":{"application/json":{"schema":{"$ref":"#/components/schemas/PaymentRequiredError"}}}}}}}}}
```

## Chat Expert (Solana Chain)

> Ask Minara AI - Intelligent crypto assistant

```json
{"openapi":"3.0.0","info":{"title":"Minara x402 API","version":"1.0"},"servers":[{"url":"https://x402.minara.ai"}],"security":[{"x402Payment":[]}],"components":{"securitySchemes":{"x402Payment":{"type":"apiKey","in":"header","name":"x-payment-response","description":"Payment proof token obtained from x402 payment challenge flow. Required after completing payment."}},"schemas":{"ChatRequest":{"type":"object","required":["userQuery"],"properties":{"userQuery":{"type":"string","description":"Required. User query content."}}},"ChatResponse":{"type":"object","properties":{"content":{"type":"string","description":"AI response content."}}},"PaymentRequiredError":{"type":"object","properties":{"error":{"type":"string"},"message":{"type":"string"},"paymentInstructions":{"type":"object","properties":{"amount":{"type":"string","description":"Payment amount required."},"currency":{"type":"string","description":"Payment currency (e.g., USDC)."},"recipient":{"type":"string","description":"Payment recipient address."},"chain":{"type":"string","description":"Blockchain for payment."}}}}}}},"paths":{"/x402/solana/chat/expert":{"post":{"summary":"Chat Expert (Solana Chain)","description":"Ask Minara AI - Intelligent crypto assistant","operationId":"x402SolanaChatExpert","tags":["AI"],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/ChatRequest"}}}},"responses":{"201":{"description":"Successful response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/ChatResponse"}}}},"400":{"description":"Bad Request - Invalid parameters"},"401":{"description":"Unauthorized - Invalid payment response token"},"402":{"description":"Payment Required","content":{"application/json":{"schema":{"$ref":"#/components/schemas/PaymentRequiredError"}}}}}}}}}
```

## Perpetual Trading Suggestion

> Get AI-powered perpetual trading suggestions with long/short recommendations, entry price, stop loss, take profit levels, and confidence score.

```json
{"openapi":"3.0.0","info":{"title":"Minara x402 API","version":"1.0"},"servers":[{"url":"https://x402.minara.ai"}],"security":[{"x402Payment":[]}],"components":{"securitySchemes":{"x402Payment":{"type":"apiKey","in":"header","name":"x-payment-response","description":"Payment proof token obtained from x402 payment challenge flow. Required after completing payment."}},"schemas":{"PerpTradingRequest":{"type":"object","required":["symbol"],"properties":{"symbol":{"type":"string","description":"Required. Trading symbol (e.g., 'BTC', 'ETH', 'SOL')."},"style":{"type":"string","enum":["scalping","day-trading","swing-trading"],"default":"scalping","description":"Optional. Trading style: 'scalping', 'day-trading', or 'swing-trading'. Default: 'scalping'."},"marginUSD":{"type":"number","default":1000,"description":"Optional. Margin in USD. Default: 1000."},"leverage":{"type":"number","default":10,"minimum":1,"maximum":40,"description":"Optional. Leverage multiplier (max: 40). Default: 10."},"strategy":{"type":"string","default":"max-profit","description":"Optional. Strategy type. Default: 'max-profit'. More strategies coming soon."}}},"PerpTradingResponse":{"type":"object","properties":{"entryPrice":{"type":"number","description":"Recommended entry price."},"side":{"type":"string","enum":["long","short"],"description":"Trading side recommendation."},"stopLossPrice":{"type":"number","description":"Recommended stop loss price."},"takeProfitPrice":{"type":"number","description":"Recommended take profit price."},"confidence":{"type":"number","minimum":0,"maximum":100,"description":"Confidence score (0-100)."},"reasons":{"type":"array","items":{"type":"string"},"description":"Analysis reasons based on technical indicators."},"risks":{"type":"array","items":{"type":"string"},"description":"Risk factors to consider."}}},"PaymentRequiredError":{"type":"object","properties":{"error":{"type":"string"},"message":{"type":"string"},"paymentInstructions":{"type":"object","properties":{"amount":{"type":"string","description":"Payment amount required."},"currency":{"type":"string","description":"Payment currency (e.g., USDC)."},"recipient":{"type":"string","description":"Payment recipient address."},"chain":{"type":"string","description":"Blockchain for payment."}}}}}}},"paths":{"/x402/perp-trading-suggestion":{"post":{"summary":"Perpetual Trading Suggestion","description":"Get AI-powered perpetual trading suggestions with long/short recommendations, entry price, stop loss, take profit levels, and confidence score.","operationId":"x402PerpTradingSuggestion","tags":["Trading"],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/PerpTradingRequest"}}}},"responses":{"201":{"description":"Successful response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/PerpTradingResponse"}}}},"400":{"description":"Bad Request - Invalid parameters"},"401":{"description":"Unauthorized - Invalid payment response token"},"402":{"description":"Payment Required","content":{"application/json":{"schema":{"$ref":"#/components/schemas/PaymentRequiredError"}}}}}}}}}
```

## Intent to Swap Transaction

> Convert natural language trading intent into an executable swap transaction payload. Compatible with OKX DEX by default.

```json
{"openapi":"3.0.0","info":{"title":"Minara x402 API","version":"1.0"},"servers":[{"url":"https://x402.minara.ai"}],"security":[{"x402Payment":[]}],"components":{"securitySchemes":{"x402Payment":{"type":"apiKey","in":"header","name":"x-payment-response","description":"Payment proof token obtained from x402 payment challenge flow. Required after completing payment."}},"schemas":{"IntentToSwapRequest":{"type":"object","required":["intent","walletAddress"],"properties":{"intent":{"type":"string","description":"Required. Natural language swap intent (e.g., 'swap 0.1 ETH to USDC')."},"walletAddress":{"type":"string","description":"Required. User wallet address (0x...)."},"chain":{"type":"string","description":"Optional. Chain name (e.g., 'base', 'ethereum', 'bsc', 'arbitrum', 'optimism')."}}},"SwapTransactionResponse":{"type":"object","properties":{"transaction":{"type":"object","description":"Swap transaction details","properties":{"chain":{"type":"string","description":"Chain name."},"inputTokenAddress":{"type":"string","description":"Input token contract address."},"inputTokenSymbol":{"type":"string","description":"Input token symbol."},"outputTokenAddress":{"type":"string","description":"Output token contract address."},"outputTokenSymbol":{"type":"string","description":"Output token symbol."},"amount":{"type":"string","description":"Transaction amount."},"amountPercentage":{"type":"number","description":"Amount percentage."},"slippagePercent":{"type":"string","description":"Slippage percentage."}}}}},"PaymentRequiredError":{"type":"object","properties":{"error":{"type":"string"},"message":{"type":"string"},"paymentInstructions":{"type":"object","properties":{"amount":{"type":"string","description":"Payment amount required."},"currency":{"type":"string","description":"Payment currency (e.g., USDC)."},"recipient":{"type":"string","description":"Payment recipient address."},"chain":{"type":"string","description":"Blockchain for payment."}}}}}}},"paths":{"/x402/intent-to-swap-tx":{"post":{"summary":"Intent to Swap Transaction","description":"Convert natural language trading intent into an executable swap transaction payload. Compatible with OKX DEX by default.","operationId":"x402IntentToSwap","tags":["Trading"],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/IntentToSwapRequest"}}}},"responses":{"201":{"description":"Successful response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/SwapTransactionResponse"}}}},"400":{"description":"Bad Request - Invalid parameters"},"401":{"description":"Unauthorized - Invalid payment response token"},"402":{"description":"Payment Required","content":{"application/json":{"schema":{"$ref":"#/components/schemas/PaymentRequiredError"}}}}}}}}}
```

## Prediction Market Analysis (Base Chain)

> AI-powered prediction market analysis. Analyze prediction market events and get probability estimates for each outcome with detailed reasoning.

```json
{"openapi":"3.0.0","info":{"title":"Minara x402 API","version":"1.0"},"servers":[{"url":"https://x402.minara.ai"}],"security":[{"x402Payment":[]}],"components":{"securitySchemes":{"x402Payment":{"type":"apiKey","in":"header","name":"x-payment-response","description":"Payment proof token obtained from x402 payment challenge flow. Required after completing payment."}},"schemas":{"PredictionMarketRequest":{"type":"object","required":["link","mode"],"properties":{"link":{"type":"string","description":"Required. Prediction market page link (e.g., Polymarket event URL)."},"mode":{"type":"string","enum":["fast","expert"],"description":"Required. Chat mode: 'fast' or 'expert'."},"only_result":{"type":"boolean","default":false,"description":"Optional. Only return prediction probabilities without reasoning. Default: false."},"customPrompt":{"type":"string","description":"Optional. Custom instructions to guide the analysis. Use this to specify focus areas, risk preferences, or analysis style."}}},"PredictionMarketResponse":{"type":"object","properties":{"predictions":{"type":"array","description":"Array of prediction outcomes. Each outcome represents an event option with its yes/no probabilities.","items":{"type":"object","properties":{"outcome":{"type":"string","description":"Outcome name (event option, e.g., candidate name, team name)."},"yesProb":{"type":"number","description":"Probability of YES for this outcome (0-1)."},"noProb":{"type":"number","description":"Probability of NO for this outcome (0-1)."}}}},"reasoning":{"type":"string","description":"AI reasoning and analysis (empty if only_result=true)."}}},"BadRequestError":{"type":"object","properties":{"error":{"type":"string"},"message":{"type":"string"}}},"UnauthorizedError":{"type":"object","properties":{"error":{"type":"string"},"message":{"type":"string"}}},"PaymentRequiredError":{"type":"object","properties":{"error":{"type":"string"},"message":{"type":"string"},"paymentInstructions":{"type":"object","properties":{"amount":{"type":"string","description":"Payment amount required."},"currency":{"type":"string","description":"Payment currency (e.g., USDC)."},"recipient":{"type":"string","description":"Payment recipient address."},"chain":{"type":"string","description":"Blockchain for payment."}}}}}}},"paths":{"/x402/prediction-market-ask":{"post":{"summary":"Prediction Market Analysis (Base Chain)","description":"AI-powered prediction market analysis. Analyze prediction market events and get probability estimates for each outcome with detailed reasoning.","operationId":"x402PredictionMarketAsk","tags":["Prediction"],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/PredictionMarketRequest"}}}},"responses":{"201":{"description":"Successful response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/PredictionMarketResponse"}}}},"400":{"description":"Bad Request - Invalid parameters","content":{"application/json":{"schema":{"$ref":"#/components/schemas/BadRequestError"}}}},"401":{"description":"Unauthorized - Invalid payment response token","content":{"application/json":{"schema":{"$ref":"#/components/schemas/UnauthorizedError"}}}},"402":{"description":"Payment Required","content":{"application/json":{"schema":{"$ref":"#/components/schemas/PaymentRequiredError"}}}}}}}}}
```

## Endpoints

### Chat (Base Chain)

**Endpoint:** `POST /x402/chat`

#### Request

**Headers:**

* `x-payment-response` (required) - Payment proof token from x402 protocol
* `Content-Type: application/json`

**Body Parameters:**

| Parameter   | Type   | Required | Description        |
| ----------- | ------ | -------- | ------------------ |
| `userQuery` | string | Yes      | User query content |

#### Example Request

```bash
curl -X POST https://x402.minara.ai/x402/chat \
  -H "x-payment-response: <payment_proof_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userQuery": "What is the current price of BTC and what are the key support levels?"
  }'
```

#### Response

**Status:** 201 Created

```json
{
  "content": "BTC is currently trading at $98,450. Key support levels are at $96,500 and $94,200. The recent breakout above $97,000 with strong volume suggests bullish continuation..."
}
```

***

### Chat Expert (Base Chain)

**Endpoint:** `POST /x402/chat/expert`

Ask Minara AI - Intelligent crypto assistant on Base chain with expert mode

#### Request

**Headers:**

* `x-payment-response` (required) - Payment proof token from x402 protocol
* `Content-Type: application/json`

**Body Parameters:**

| Parameter   | Type   | Required | Description        |
| ----------- | ------ | -------- | ------------------ |
| `userQuery` | string | Yes      | User query content |

#### Example Request

```bash
curl -X POST https://x402.minara.ai/x402/chat/expert \
  -H "x-payment-response: <payment_proof_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userQuery": "Provide a comprehensive analysis of ETH including on-chain metrics and trading strategy"
  }'
```

#### Response

**Status:** 201 Created

```json
{
  "content": "Comprehensive ETH Analysis:\n\n**Price Action**: ETH is trading at $3,420, consolidating near the $3,400-$3,500 range...\n\n**On-Chain Metrics**: Active addresses increased 12% week-over-week, indicating growing network activity...\n\n**Trading Strategy**: Consider accumulating on dips to $3,300 support with targets at $3,600 and $3,850..."
}
```

***

### Chat (Solana Chain)

**Endpoint:** `POST /x402/solana/chat`

#### Request

**Headers:**

* `x-payment-response` (required) - Payment proof token from x402 protocol
* `Content-Type: application/json`

**Body Parameters:**

| Parameter   | Type   | Required | Description        |
| ----------- | ------ | -------- | ------------------ |
| `userQuery` | string | Yes      | User query content |

#### Example Request

```bash
curl -X POST https://x402.minara.ai/x402/solana/chat \
  -H "x-payment-response: <payment_proof_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userQuery": "Show me the top trending tokens on Solana right now"
  }'
```

#### Response

**Status:** 201 Created

```json
{
  "content": "Top trending Solana tokens:\n1. WIF - up 24% with $45M 24h volume\n2. BONK - up 18% with strong community activity\n3. JUP - consolidating after recent pump, volume at $38M..."
}
```

### Chat Expert (Solana Chain)

**Endpoint:** `POST /x402/solana/chat/expert`

Ask Minara AI - Intelligent crypto assistant on Solana chain with expert mode

#### Request

**Headers:**

* `x-payment-response` (required) - Payment proof token from x402 protocol
* `Content-Type: application/json`

**Body Parameters:**

| Parameter   | Type   | Required | Description        |
| ----------- | ------ | -------- | ------------------ |
| `userQuery` | string | Yes      | User query content |

#### Example Request

```bash
curl -X POST https://x402.minara.ai/x402/solana/chat/expert \
  -H "x-payment-response: <payment_proof_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userQuery": "Analyze the liquidity distribution and whale movements for JUP token"
  }'
```

#### Response

**Status:** 201 Created

```json
{
  "content": "**JUP Token Deep Analysis**\n\n**Liquidity Distribution**: Total liquidity across major DEXs is $125M, with 65% concentrated in the $0.85-$0.92 range...\n\n**Whale Activity**: Top 10 holders control 34% of supply. Detected 3 significant whale transactions in the last 24h totaling $4.2M in buys...\n\n**Risk Assessment**: Moderate liquidity risk above $1.00 mark. Consider this in position sizing..."
}
```

***

### Chat (Polygon Chain)

**Endpoint:** `POST /x402/polygon/chat`

Ask Minara AI - Intelligent crypto assistant on Polygon chain

#### Request

**Headers:**

* `x-payment-response` (required) - Payment proof token from x402 protocol
* `Content-Type: application/json`

**Body Parameters:**

| Parameter   | Type   | Required | Description        |
| ----------- | ------ | -------- | ------------------ |
| `userQuery` | string | Yes      | User query content |

#### Example Request

```bash
curl -X POST https://x402.minara.ai/x402/polygon/chat \
  -H "x-payment-response: <payment_proof_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userQuery": "What is the current price of BTC and what are the key support levels?"
  }'
```

#### Response

**Status:** 201 Created

```json
{
  "content": "BTC is currently trading at $98,450. Key support levels are at $96,500 and $94,200. The recent breakout above $97,000 with strong volume suggests bullish continuation..."
}
```

***

### Chat Expert (Polygon Chain)

**Endpoint:** `POST /x402/polygon/chat/expert`

Ask Minara AI - Intelligent crypto assistant on Polygon chain with expert mode

#### Request

**Headers:**

* `x-payment-response` (required) - Payment proof token from x402 protocol
* `Content-Type: application/json`

**Body Parameters:**

| Parameter   | Type   | Required | Description        |
| ----------- | ------ | -------- | ------------------ |
| `userQuery` | string | Yes      | User query content |

#### Example Request

```bash
curl -X POST https://x402.minara.ai/x402/polygon/chat/expert \
  -H "x-payment-response: <payment_proof_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userQuery": "Provide a comprehensive analysis of ETH including on-chain metrics and trading strategy"
  }'
```

#### Response

**Status:** 201 Created

```json
{
  "content": "**Comprehensive ETH Analysis**\n\n**Price Action**: ETH is trading at $3,420, consolidating near the $3,400-$3,500 range...\n\n**On-Chain Metrics**: Active addresses increased 12% week-over-week, indicating growing network activity...\n\n**Trading Strategy**: Consider accumulating on dips to $3,300 support with targets at $3,600 and $3,850..."
}
```

***

## Trading Endpoints

### Intent to Swap Transaction

**Endpoint:** `POST /x402/intent-to-swap-tx`

Convert natural language trading intent into an executable swap transaction payload. Compatible with OKX DEX by default.

#### Request

**Headers:**

* `x-payment-response` (required) - Payment proof token from x402 protocol
* `Content-Type: application/json`

**Body Parameters:**

| Parameter       | Type   | Required | Description                                                          |
| --------------- | ------ | -------- | -------------------------------------------------------------------- |
| `intent`        | string | Yes      | Natural language swap intent (e.g., "swap 0.1 ETH to USDC")          |
| `walletAddress` | string | Yes      | User wallet address (0x...)                                          |
| `chain`         | string | No       | Chain name (e.g., "base", "ethereum", "bsc", "arbitrum", "optimism") |

#### Example Request

```bash
curl -X POST https://x402.minara.ai/x402/intent-to-swap-tx \
  -H "x-payment-response: <payment_proof_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "intent": "swap 0.1 ETH to USDC",
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
    "chain": "base"
  }'
```

#### Response

**Status:** 201 Created

```json
{
  "transaction": {
    "chain": "base",
    "inputTokenAddress": "0x4200000000000000000000000000000000000006",
    "inputTokenSymbol": "ETH",
    "outputTokenAddress": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "outputTokenSymbol": "USDC",
    "amount": "0.1",
    "amountPercentage": 100,
    "slippagePercent": "0.5"
  }
}
```

***

### Perpetual Trading Suggestion

**Endpoint:** `POST /x402/perp-trading-suggestion`

Get AI-powered perpetual trading suggestions with long/short recommendations, entry price, stop loss, take profit levels, and confidence score based on comprehensive market analysis.

#### Request

**Headers:**

* `x-payment-response` (required) - Payment proof token from x402 protocol
* `Content-Type: application/json`

**Body Parameters:**

| Parameter   | Type   | Required | Default      | Description                                                  |
| ----------- | ------ | -------- | ------------ | ------------------------------------------------------------ |
| `symbol`    | string | Yes      | -            | Trading symbol (e.g., "BTC", "ETH", "SOL")                   |
| `style`     | string | No       | "scalping"   | Trading style: "scalping", "day-trading", or "swing-trading" |
| `marginUSD` | number | No       | 1000         | Margin in USD                                                |
| `leverage`  | number | No       | 10           | Leverage multiplier (max: 40)                                |
| `strategy`  | string | No       | "max-profit" | Strategy type (more strategies coming soon)                  |

#### Example Request

```bash
curl -X POST https://x402.minara.ai/x402/perp-trading-suggestion \
  -H "x-payment-response: <payment_proof_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTC",
    "style": "day-trading",
    "marginUSD": 1000,
    "leverage": 10,
    "strategy": "max-profit"
  }'
```

#### Response

**Status:** 201 Created

```json
{
  "entryPrice": 98450,
  "side": "long",
  "stopLossPrice": 96200,
  "takeProfitPrice": 102800,
  "confidence": 78,
  "reasons": [
    "BTC broke above key resistance at $97,500 with strong volume",
    "RSI at 62 indicates bullish momentum without being overbought",
    "MACD showing bullish crossover on 4H timeframe",
    "Volume profile shows accumulation at current levels"
  ],
  "risks": [
    "Potential pullback at $100,000 psychological resistance",
    "High volatility expected around upcoming Fed meeting",
    "Funding rates on major exchanges trending higher"
  ]
}
```

***

### Prediction Market Analysis (Base Chain)

**Endpoint:** `POST /x402/prediction-market-ask`

AI-powered prediction market analysis. Analyze prediction market events and get probability estimates for each outcome with detailed reasoning.

#### Request

**Headers:**

* `x-payment-response` (required) - Payment proof token from x402 protocol
* `Content-Type: application/json`

**Body Parameters:**

| Parameter      | Type    | Required | Default | Description                                              |
| -------------- | ------- | -------- | ------- | -------------------------------------------------------- |
| `link`         | string  | Yes      | -       | Prediction market page link (e.g., Polymarket event URL) |
| `mode`         | string  | Yes      | -       | Chat mode: "fast" or "expert"                            |
| `only_result`  | boolean | No       | false   | Only return prediction probabilities without reasoning   |
| `customPrompt` | string  | No       | -       | Custom instructions to guide the analysis                |

#### Example Request

```bash
curl -X POST https://x402.minara.ai/x402/prediction-market-ask \
  -H "x-payment-response: <payment_proof_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "link": "https://polymarket.com/event/will-there-be-another-us-government-shutdown-by-january-31",
    "mode": "fast",
    "only_result": false,
    "customPrompt": "Focus on recent news and sentiment analysis. Be more conservative in probability estimates."
  }'
```

#### Response

**Status:** 201 Created

```json
{
  "predictions": [
    {
      "outcome": "Donald Trump",
      "yesProb": 0.65,
      "noProb": 0.35
    },
    {
      "outcome": "Kamala Harris",
      "yesProb": 0.3,
      "noProb": 0.7
    }
  ],
  "reasoning": "Based on recent polling data and historical trends, Trump maintains a slight lead in key swing states. However, the race remains highly competitive with significant uncertainty..."
}
```

***

### Prediction Market Analysis (Polygon Chain)

**Endpoint:** `POST /x402/polygon/prediction-market-ask`

AI-powered prediction market analysis on Polygon chain. Same functionality as Base chain endpoint.

#### Request

**Headers:**

* `x-payment-response` (required) - Payment proof token from x402 protocol
* `Content-Type: application/json`

**Body Parameters:**

Same as Base chain endpoint above.

#### Example Request

```bash
curl -X POST https://x402.minara.ai/x402/polygon/prediction-market-ask \
  -H "x-payment-response: <payment_proof_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "link": "https://polymarket.com/event/will-there-be-another-us-government-shutdown-by-january-31",
    "mode": "fast",
    "only_result": false
  }'
```

#### Response

**Status:** 201 Created

Same response format as Base chain endpoint.

***

## Error Responses

### 402 Payment Required

Initial request without payment credentials will return:

```json
{
  "error": "payment_required",
  "message": "Payment required to access this resource",
  "paymentInstructions": {
    "amount": "0.20",
    "currency": "USDC",
    "recipient": "0x...",
    "chain": "base"
  }
}
```

### 401 Unauthorized

Invalid or expired payment proof:

```json
{
  "error": "unauthorized",
  "message": "Invalid payment response token"
}
```

### 400 Bad Request

Invalid request parameters:

```json
{
  "error": "bad_request",
  "message": "Missing required parameter: userQuery"
}
```

***

## Rate Limits

x402 endpoints are rate-limited per wallet address:

* **AI Endpoints:** 60 requests per minute
* **Trading Endpoints:** 30 requests per minute

Exceeding rate limits will return:

```json
{
  "error": "rate_limit_exceeded",
  "message": "Too many requests. Please try again in 30 seconds.",
  "retryAfter": 30
}
```

***

## Notes

* All x402 endpoints require the `x-payment-response` header after completing the payment challenge
* Prices are subject to change based on network conditions
* For more information on x402 protocol, see [x402 Documentation](https://x402scan.com/server)


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/trade/agent-api/api-reference-x402.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
