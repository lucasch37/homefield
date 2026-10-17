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
