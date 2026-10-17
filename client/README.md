# Homefield frontend

A responsive Next.js report page for King County satellite hazard observations.

## Run locally

```sh
pnpm install
cp .env.example .env.local
pnpm dev
```

Set `BACKEND_URL` to your FastAPI service. It must implement `GET /hazards?address=...` using the PRD's report schema. A missing backend displays a friendly service-unavailable message; the app does not generate or substitute hazard observations.

Set `XAI_API_KEY` for the written Grok summary and voice follow-ups. Optionally set `XAI_TEXT_MODEL` to a text model enabled for your account. All credentials remain server-side. Restart the dev server after environment changes.

## Data flow

- `/api/report` proxies the configured backend, validates the location, and normalizes each hazard independently. Missing or malformed layers become card-level errors. An address outside King County stops the flow.
- `/api/summary` takes the currently displayed report and requests a plain-language summary separately, so summary errors do not hide observations.
- `/api/voice-token` creates a short-lived xAI token. The browser sends mono PCM16 microphone audio over the realtime WebSocket and answers `get_hazards` calls with the current report. Changing the address or leaving the page stops audio and closes the session.
- The MapLibre basemap uses CARTO's public style and OpenStreetMap data. A pin shows the geocoded address. There are no hazard raster overlays until data tiles are available.

The frontend needs a running backend and real processed satellite data for live reports. Voice and summary need an enabled xAI account. No accounts or saved reports are implemented.

## Check

```sh
pnpm exec tsc --noEmit
pnpm build
node --experimental-strip-types --test tests/report.test.mjs
```

Deploy `client/` as the Vercel project root and configure the environment variables above. Deploy the FastAPI backend separately.
