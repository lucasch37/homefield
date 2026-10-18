# Homefield frontend

Next.js app for the Home Hazard Report: address search, map, three hazard cards, a written summary, and Grok Voice follow-up questions.

## Run locally

Start the FastAPI server first (see [../server/README.md](../server/README.md)), then:

```sh
pnpm install
cp .env.example .env.local   # add XAI_API_KEY for Grok
pnpm dev
```

Open http://localhost:3000/search. The "Try a place" links include the demo points (the December 10, 2025 flood near Carnation, SODO vs Discovery Park heat, UW ground motion). The search box also accepts coordinates such as `47.664, -121.92`.

## Environment

| Variable | Needed for | Notes |
| --- | --- | --- |
| `BACKEND_URL` | Reports | FastAPI base URL. Defaults to `http://127.0.0.1:8000` in development; required in production. |
| `XAI_API_KEY` | Grok summary and voice | Server only. Without it, the summary is written from the data and voice says it isn't connected. |
| `XAI_TEXT_MODEL` | Grok summary | Defaults to `grok-4.7`; set it to a text model your xAI account can use. |
| `XAI_BASE_URL`, `XAI_REALTIME_URL` | Tests only | Point the app at local stand-ins. Leave unset in production. |

Restart the server after changing environment variables.

## How it works

- `/api/report` forwards `?address=` or `?lat=&lon=` to FastAPI `/hazards` and normalizes each hazard on its own, so one broken layer only affects its card.
- `/api/summary` turns the report into fixed fact sentences (`lib/facts.ts`), asks Grok to reword them, and rejects any reply that adds a number, uses the word "safe", or runs long. If Grok is missing, slow, or fails that check, the summary is the fact sentences themselves, labeled "From the satellite data".
- `/api/voice-token` creates a 5-minute xAI token (same-origin requests only). The browser streams microphone PCM to Grok Voice; when Grok calls `get_hazards`, the browser answers with the same fact sentences, or looks up another address the user names.
- Every number on the cards, charts, summary, and voice answers comes from the `/hazards` response; tests check this against real responses in `tests/fixtures/`.

## Check

```sh
pnpm typecheck
pnpm lint
pnpm test               # unit tests, no network
pnpm build
pnpm test:integration   # production build against local stand-ins for FastAPI and xAI
```

Deploy `client/` as the Vercel project root with the variables above.
