# Home Hazard Report

King County home hazard reports from prepared satellite observations.

```text
client/             Frontend
server/
├── app/            Application FastAPI service
├── data/           Prepared flood, heat, and ground-motion datasets
└── tests/          API and raster-reader tests
pipelines/
├── builders/       Offline data downloads and processing
├── validation/     Data-team lookup tools and optional inspection API
├── make_figures.py Draws the /data page figures into client/public/data-figures/
└── .cache/         Ignored raw downloads and intermediate files
docs/               Product specifications
```

Use [server/README.md](server/README.md) to run the application API, and [pipelines/README.md](pipelines/README.md) to build or inspect datasets. The original `scripts/` builders and `backend/` inspection code have moved under `pipelines/`; there is one application backend in `server/app/`. Product specifications may show the original proposed layout; the current structure and commands are documented here.

From the repository root, start the API:

```sh
cd server
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/uvicorn app.main:app --reload --port 8000
```

Open [API docs](http://localhost:8000/docs) or [health](http://localhost:8000/health). The delivered files remain under `server/data/`, following the [data contract](server/docs/data-contract.md). Pipeline environments and caches are separate from server deployment.

In a second terminal, start the frontend. In development it connects to the API at `http://127.0.0.1:8000` by default; set `BACKEND_URL` in `client/.env.local` to use another server, `GEMINI_API_KEY` for the written summary, and `XAI_API_KEY` for Grok Voice:

```sh
cd client
cp .env.example .env.local
pnpm install
pnpm dev
```

Open [the address search](http://localhost:3000/search) and try an address or one of the demo places. The browser only talks to the Next.js app: `/api/report` forwards to FastAPI `/hazards`, `/api/summary` has Gemini write the summary, and `/api/voice-token` hands the browser a short-lived Grok Voice token. The keys and backend URL stay on the server. Without a Gemini key the summary is written directly from the data; without an xAI key everything except voice still works.

[The data tab](http://localhost:3000/data) explains the satellite sources behind each hazard with figures drawn from the processed data. The figures are committed PNGs; to redraw them, run from the repository root:

```sh
pip install rasterio numpy pyproj matplotlib requests pillow
python pipelines/make_figures.py
```

## Checks

```sh
cd server && .venv/bin/python -m pytest -q
cd client && pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm test:integration
```

## Deploy

- **API:** build `server/Dockerfile` (it includes `server/data/`) on Render, Railway, or similar. Set `CORS_ORIGINS` to the site's origin.
- **Web:** deploy `client/` on Vercel with `BACKEND_URL` (the API's public URL), `GEMINI_API_KEY`, and `XAI_API_KEY`.
- **Domain:** point homefield.casa at the Vercel project.
