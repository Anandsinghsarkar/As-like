# All AI

One responsive console for every model exposed by an OmniRoute or OpenAI-compatible AI gateway.

## Included

- searchable live model catalog
- Smart Router model selection
- standard multi-turn AI chat
- side-by-side comparison for up to four models
- local conversation history
- server-side gateway credentials
- responsive desktop and mobile interface
- clear preview state when a gateway has not been connected yet

The UI includes a representative preview catalog and is ready to display the full live catalog returned by the connected gateway. Model availability depends on the provider accounts and credentials configured in OmniRoute.

## Configure the gateway

Copy `.env.example` to `.env.local` and set:

```bash
AI_GATEWAY_BASE_URL=http://localhost:20128
AI_GATEWAY_API_KEY=your-server-side-key
AI_ROUTER_MODEL=auto
```

`AI_GATEWAY_BASE_URL` may point to the gateway root or its `/v1` path. The app reads models from `/v1/models` and sends chat requests to `/v1/chat/completions`.

Never expose provider keys in browser code. This project keeps the gateway key inside server route handlers.

## Development

Requirements: Node.js 22.13 or newer.

```bash
npm ci
npm run dev
```

Production build:

```bash
npm run build
```

## Main files

- `components/all-ai-studio.tsx` — interactive chat, comparison, history and model picker
- `app/api/models/route.ts` — live model discovery
- `app/api/chat/route.ts` — secure multi-model proxy
- `lib/catalog.ts` — fallback catalog and model normalization
- `lib/gateway.ts` — gateway URL and authentication helpers
