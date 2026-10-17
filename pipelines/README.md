# Data pipelines and inspection

This directory contains the data team's offline tools. The builders create prepared datasets; the validation tools inspect them. The application API runs from `server/app/`, and all prepared data stays in `server/data/`.

```text
pipelines/
├── paths.py                 # Shared data and cache locations
├── builders/                # Previously scripts/
│   ├── build_flood_history.py
│   ├── build_heat.py
│   └── build_ground_motion.py
├── validation/              # Previously backend/
│   ├── flood_lookup.py
│   ├── heat_lookup.py
│   ├── ground_lookup.py
│   └── api.py               # Optional data-team inspection API
└── .cache/                  # Ignored downloads and intermediate files
```

## Environment

Run the commands below from the repository root. Use a separate pipeline environment so download/processing dependencies do not become server deployment dependencies:

```sh
python3 -m venv pipelines/.venv
pipelines/.venv/bin/python -m pip install -r pipelines/requirements-build.txt
```

For inspection only, install `pipelines/requirements.txt` instead. `requirements-dev.txt` adds tools for the pipeline tests. The build environment adds Earthaccess, xarray, h5netcdf, and h5py. Flood and ground processing use Earthdata login as in the original scripts; heat uses the public services already configured in its builder. Importing a module or requesting `--help` does not start downloads or authentication.

## Build

```sh
pipelines/.venv/bin/python -m pipelines.builders.build_flood_history
pipelines/.venv/bin/python -m pipelines.builders.build_heat
pipelines/.venv/bin/python -m pipelines.builders.build_ground_motion
```

Outputs go directly to the server's existing layout:

| Builder | Prepared output | Working cache |
| --- | --- | --- |
| Flood | `server/data/flood/flood_history_<tile>.tif` | `pipelines/.cache/flood/dswx_wtr/` |
| Heat | `server/data/heat/heat_history.tif`, `heat_stats.json`; boundary at `server/data/king_county.geojson` | `pipelines/.cache/heat/` |
| Ground motion | `server/data/ground_motion/ground_motion.tif`, `ground_stats.json` | `pipelines/.cache/ground_motion/` |

The paths are anchored to the repository, so running from a different working directory does not move outputs. `DATA_DIR` overrides the shared prepared-data root; `PIPELINE_CACHE_DIR` overrides the cache root. Explicit relative overrides are interpreted relative to the working directory. Environment files are not automatically loaded.

Builders retain their processing algorithms and options:

```sh
# Rebuild flood rasters from existing cached water files.
pipelines/.venv/bin/python -m pipelines.builders.build_flood_history --skip-download

# Examine the remote ground acquisition plan (requires Earthdata access).
pipelines/.venv/bin/python -m pipelines.builders.build_ground_motion --plan

# Exploratory partial heat build into a separate directory.
DATA_DIR=/tmp/hazard-experiment pipelines/.venv/bin/python -m pipelines.builders.build_heat --years 2024 2025
```

Builders overwrite their target outputs. Use a separate `DATA_DIR` for experiments and partial heat histories; the application's full-history metadata checks expect the configured recent and early periods. Existing caches from the old layout are not moved automatically; place any reusable downloads under the cache locations above before rebuilding. See the [server data contract](../server/docs/data-contract.md) before publishing replacement files.

## Inspect

The original lookups are preserved for the data team's comparisons:

```sh
pipelines/.venv/bin/python -m pipelines.validation.flood_lookup
pipelines/.venv/bin/python -m pipelines.validation.heat_lookup
pipelines/.venv/bin/python -m pipelines.validation.ground_lookup
```

These read the same `server/data/` files. Their calculations intentionally retain the data team's behavior: heat averages a 5×5 neighborhood, ground motion averages a 3×3 neighborhood, and flood includes a `frequently_wet` category. Their exploratory labels and sign interpretations are not the application's report contract. `server/app/layers.py` uses containing-pixel reads with its own response models and verified limitations.

The optional inspection API preserves the previous data-team HTTP workflow:

```sh
pipelines/.venv/bin/uvicorn pipelines.validation.api:app --reload --port 8001
```

Open `http://localhost:8001/docs` or `/health` for that inspection service. The frontend should call the application server on port 8000, as described in [server/README.md](../server/README.md). The server Docker image excludes this entire offline tool directory and its processing dependencies.

## Tests

```sh
pipelines/.venv/bin/python -m pip install -r pipelines/requirements-dev.txt
pipelines/.venv/bin/python -m pytest pipelines/tests -q
```

Tests verify output paths, command entry points, a small local flood build, the shared county boundary location, and inspection against delivered data when available. They never download satellite data or rebuild the delivered files.
