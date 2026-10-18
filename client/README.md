# Homefield frontend

Next.js app for the Home Hazard Report: address search, map, three hazard cards, a Gemini-written summary, and Grok Voice follow-up questions.

## Run locally

Start the FastAPI server first (see [../server/README.md](../server/README.md)), then:

```sh
pnpm install
cp .env.example .env.local   # add GEMINI_API_KEY and XAI_API_KEY
pnpm dev
```

Open http://localhost:3000/search. The "Try a place" links include the demo points (the December 10, 2025 flood near Carnation, SODO vs Discovery Park heat, UW ground motion). The search box also accepts coordinates such as `47.664, -121.92`.

## Environment

| Variable | Needed for | Notes |
| --- | --- | --- |
| `BACKEND_URL` | Reports | FastAPI base URL. Defaults to `http://127.0.0.1:8000` in development; required in production. |
| `GEMINI_API_KEY` | Written summary | Server only. Without it, the summary is written straight from the data. |
| `GEMINI_MODEL` | Written summary | Optional. Defaults to `gemini-flash-latest`; if the model isn't available, another Gemini Flash model is used. |
| `XAI_API_KEY` | Grok Voice | Server only. Without it, voice says it isn't connected. |
| `NEXT_PUBLIC_ZILLOW_AFFILIATE_PARAMS`, `NEXT_PUBLIC_REDFIN_AFFILIATE_PARAMS` | Partner links | Optional query string added to the Zillow/Redfin links (your partner ID). Defaults to Homefield UTM tags. Set before `pnpm build`. |
| `GEMINI_BASE_URL`, `XAI_BASE_URL`, `XAI_REALTIME_URL` | Tests only | Point the app at local stand-ins. Leave unset in production. |

The Gemini and xAI variables can also live in the repository-root `.env`; values in `client/.env.local` or the real environment win. Restart the app after changing them.

### Connecting Gemini and Grok

1. Get a Gemini API key at aistudio.google.com, and an xAI key at console.x.ai with voice (realtime) access and credits.
2. Put `GEMINI_API_KEY=...` and `XAI_API_KEY=...` in `client/.env.local` (or the repo-root `.env`) and restart `pnpm dev`.
3. Open http://localhost:3000/api/ai-status. It returns `{"voice": {...}, "summary": {...}}`, each with `"connected": true` or the exact reason it isn't (missing key, rejected key, quota or credits, model unavailable, or service unreachable). The voice panel and the summary show the same reasons.

## How it works

- `/api/report` forwards `?address=` or `?lat=&lon=` to FastAPI `/hazards` and normalizes each hazard on its own, so one broken layer only affects its card.
- `/api/summary` turns the report into fixed fact sentences (`lib/facts.ts`), asks Gemini (low thinking, about 2 to 3 seconds) to reword them, and rejects any reply that adds a number, uses the word "safe", or runs long, after one corrective retry. If Gemini is missing, slow, or fails that check, the summary is the fact sentences themselves, labeled "From the satellite data".
- `/api/voice-token` creates a 5-minute xAI token (same-origin requests only). The browser streams microphone PCM to Grok Voice; when Grok calls `get_hazards`, the browser answers with the same fact sentences, or looks up another address the user names.
- After a search with a street address, Zillow and Redfin links appear under the search button. Zillow opens its search for that exact address (`/homes/<address>_rb/`). Redfin has no address search URL, so `/api/listing-link` asks Redfin's location lookup for the home's page and redirects there, or to the ZIP code's page if the lookup fails. Coordinate searches show no links.
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
