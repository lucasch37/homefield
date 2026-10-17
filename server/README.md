# Home Hazard Report API

FastAPI backend for [the PRD](docs/prd.md). All implementation and tests live in `server/`. Satellite downloads and processing are left to the data pipeline team. The backend reads prepared local GeoTIFFs and never downloads satellite data during a report request.

## Run locally

Python 3.11+ is required. Run these commands from `server/`:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-dev.txt
```

Start the local server from `server/`:

```sh
.venv/bin/uvicorn app.main:app --reload --port 8000
```

The server reads `server/data/` by default. Keep this terminal running; `--reload` restarts the server when Python files change.

Open [interactive API docs](http://localhost:8000/docs), [OpenAPI JSON](http://localhost:8000/openapi.json), or [health](http://localhost:8000/health).

Address requests use Census geocoding. Coordinate requests use the delivered local county boundary and require no network. Both read the prepared pipeline files:

```sh
curl --get http://localhost:8000/hazards \
  --data-urlencode 'address=400 Broad St, Seattle, WA'
curl 'http://localhost:8000/hazards?lat=47.664&lon=-121.92'
```

To allow a frontend origin and listen on all interfaces:

```sh
DATA_DIR=./data CORS_ORIGINS=http://localhost:3000 \
  .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The delivered files live in `server/data/`, which is also the default `DATA_DIR`. If you previously set `DATA_DIR=../data`, change it to `./data` when running from `server/`. Missing files return `not_enough_data` with null measurements, and `/health` reports missing layers. `.env.example` documents configuration; environment files are not automatically loaded, so export their values in your shell or deployment settings.

## API contract

| Request | Behavior |
| --- | --- |
| `GET /hazards?address=...` | Geocode an address, check county, read all layers concurrently |
| `GET /hazards?lat=...&lon=...` | Check county for WGS84 coordinates, then read all layers |
| `GET /health` | Report `loaded`, `missing`, `error`, or `disabled` for each layer |

Provide exactly one address or a complete latitude/longitude pair. Blank addresses, addresses over 500 characters, conflicting queries, out-of-range coordinates, and nonfinite coordinates return 422. An unmatched address returns 404. Census service failures return 502, and its deadline returns 504. Errors use FastAPI's `{"detail": ...}` format (validation details may be a list).

Outside King County returns 200 with `in_king_county: false`, `hazards: null`, and a friendly message. Coordinate requests have `address: null`; there is no invented reverse-geocoded street address.

Successful reports follow the PRD schema, with an optional report `message` and per-card `action`/`message` fields. Every card includes `source.name`, `source.dates`, `source.resolution_m`, and `source.limitations`. Null means unavailable; zero is retained as a valid measurement. Missing or uncovered data returns `not_enough_data`; a corrupt file, invalid metadata, or timeout returns `error` for that layer alone. Cutting ground motion with `GROUND_MOTION_ENABLED=false` returns `not_available`.

Flood statuses follow the PRD exactly: fewer than 10 valid passes → `not_enough_data`; at least half wet → `permanent_water`; at least one wet → `flooded`; otherwise → `no_flooding_seen`. Wet dates are decoded using each TIFF's one-based epoch. The delivered files lack the complete valid-pass date coverage; responses explicitly disclose that limitation instead of inventing a coverage interval.

Heat returns `surface_temp_f`, `recent_relative_f`, `lowland_percentile`, `comparison_area`, year lists, clear observation count, relative change, and yearly relative heat. Values are decoded from tenths of °F. Comparisons use daily lowland medians and the delivered relative-heat distribution. The legacy `county_percentile` and `diff_from_median_f` fields stay null; consumers should use the named lowland comparison fields. Surface temperature is not air or indoor temperature.

Ground motion returns reliable signed velocity plus dated displacement history. Gaps in historical bands do not invalidate a usable velocity. `sign_convention_verified` is false because the delivered metadata requests verification. The backend does not infer vertical sinking, rising, safety, or earthquake risk.

`/health` returns 200 for service liveness even when data is missing, with top-level `status: "degraded"`. `loaded` means required files, CRS, band count, TIFF tags, and statistics can be opened and validated; datasets are opened per lookup, rather than kept as global file handles. Health lists paths relative to `DATA_DIR`. It does not exhaustively validate every pixel or the county boundary. Prepared files can be installed without an application restart.

## Pipeline integration

The current delivered format, including nested paths, band order, nodata, date offsets, statistics, and response fields, is documented in [docs/data-contract.md](docs/data-contract.md). No separate `metadata.json` is required. Offline builders and data-team inspection tools live in [../pipelines/](../pipelines/README.md) and share `server/data/` as their default output/input directory. This server uses its own one-pixel readers without importing those offline tools. There are no live NASA fallbacks.

County containment uses `data/king_county.geojson`, including polygon holes and boundary edges. Address geocoding uses Census's `geographies/onelineaddress` endpoint with `layers=Counties`, `benchmark=Public_AR_Current`, and `vintage=Current_Current`. If the boundary file is absent, county validation falls back to Census geographies and FIPS `53033`; a malformed installed boundary returns an error. See the [official Census API documentation](https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.html). Successful Census lookups use a bounded, five-minute, in-process cache. The default geocoder deadline is five seconds and layer deadline is two seconds, with layers running concurrently. These are response deadlines; Python cannot forcibly stop a GDAL read already running in a thread. Store the rasters on local disk.

## Test

```sh
.venv/bin/python -m pytest -q
```

Tests generate temporary GeoTIFFs matching the pipeline format, covering date offsets, unit scaling, relative-heat comparisons, optional history gaps, county polygons, upstream errors, deadlines, and layer isolation. Census responses are mocked. `tests/test_delivered_data.py` also checks the installed files through the API: Carnation's December 2025 wet date, Lake Washington's permanent-water classification, and UW ground motion. Those checks skip when the delivered data directory is absent. All tests run without network access or credentials.

## Deployment

From `server/`, build the included Docker image:

```sh
docker build -t home-hazard-api .
docker run --rm -p 8000:8000 home-hazard-api
```

The Docker image includes the delivered `data/` directory. To replace it at runtime, mount prepared files read-only at `/app/data` or set `DATA_DIR`. Set `CORS_ORIGINS` to the frontend's origin. The container honors `PORT` (default `8000`). On Render or Railway without Docker, set the service root to `server`, install `requirements.txt`, and start `uvicorn app.main:app --host 0.0.0.0 --port "$PORT"`.

The PRD assigns Grok written summaries, ephemeral voice tokens, and the voice client to the web application. This backend supplies their shared hazard JSON and needs no xAI or Earthdata credentials.
