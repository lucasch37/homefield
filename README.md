# HomeField

King County home hazard reports from prepared satellite observations. Type an address and HomeField shows what NASA-backed satellite data has **observed** there (flooding, summer surface heat, and slow ground movement), with the source, dates, resolution, and limits of every result.

![The Snoqualmie Valley on December 6 and December 10, 2025, seen by Sentinel-1 radar](docs/images/flood_snoqualmie_dec2025.png)

## Repository layout

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
docs/               Product specifications and README images
```

Use [server/README.md](server/README.md) to run the application API, and [pipelines/README.md](pipelines/README.md) to build or inspect datasets. The original `scripts/` builders and `backend/` inspection code have moved under `pipelines/`; there is one application backend in `server/app/`. Product specifications may show the original proposed layout; the current structure and commands are documented here.

## Running locally

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

## Data

Every number in the app comes from three NASA-backed satellite datasets, processed ahead of time into small summary files in `server/data/`, so a lookup takes about a second and never depends on a NASA server during use.

| | Flood | Heat | Ground motion |
| --- | --- | --- | --- |
| **Satellite** | Sentinel-1 radar | Landsat 8 and 9 (thermal) | Sentinel-1 radar (InSAR) |
| **Product** | NASA JPL OPERA DSWx-S1 | Landsat Collection 2 Level-2 surface temperature (NASA/USGS) | NASA JPL OPERA DISP-S1 |
| **Period** | Sep 2024 to Oct 2026 | Summers 2013 to 2025 | Jul 2016 to Oct 2025 |
| **Detail** | 30 m pixels | 30 m pixels (100 m native thermal) | 30 m pixels |
| **Data processed** | 1,158 water maps (3 tiles) | 45 clear summer days | 8 chained files (of 119) |
| **Coverage** | All of King County | All of King County | Seattle, the Eastside, Snoqualmie Valley |
| **What we report** | How often a spot was underwater, and when | Surface heat relative to lowland King County, and its 13-year trend | Sinking or rising in mm per year since 2016 |

### Flood history

**Source:** NASA JPL OPERA Dynamic Surface Water Extent from Sentinel-1 (DSWx-S1), collection `OPERA_L3_DSWX-S1_V1`, from NASA Earthdata (PO.DAAC).

Floods here happen under full cloud cover, and Sentinel-1's radar sees through clouds and darkness. Calm water reflects the radar pulse away from the satellite and shows up dark; flooded fields and forests bounce it back strongly. NASA turns each pass into a water map labeling every 30 m pixel as not water, open water, flooded vegetation, or no reliable reading.

We processed every pass over King County from September 2, 2024 to October 12, 2026: **1,158 water maps** across three tiles (T10TET: 384, T10TFT: 358, T10UFU: 416). For each pixel we count the passes with a valid reading, the passes showing water, and the first and last wet dates (in Pacific time). At lookup:

| Status | Rule | Meaning |
| --- | --- | --- |
| `permanent_water` | wet on at least 50% of passes | river or lake |
| `frequently_wet` | wet on 5% to 50% of passes | floods or stays wet often |
| `flooded` | wet at least once | flooded at least once |
| `no_flooding_seen` | never wet | no flooding observed on any pass |
| `not_enough_data` | fewer than 10 valid passes | radar couldn't read this spot reliably |

**Limits:** passes are days apart and can miss a flood's peak; the December 10, 2025 pass came about 10 hours before the Snoqualmie crested. Radar misses water under dense trees and tall crops, and very smooth surfaces (runways, large lots, flat roofs) can look like water. "No flooding seen" never means "safe."

### Summer heat

![Summer surface heat across Seattle and the Eastside relative to lowland King County](docs/images/heat_map_seattle.png)

**Source:** Landsat 8 and 9 Collection 2 Level-2 surface temperature (band `lwir11`), NASA/USGS, via Microsoft Planetary Computer.

We used every clear summer scene (June to September, under 10% cloud) on the path that covers all of King County in one image (path 046, row 027): **45 days from 2013 to 2025**. Clouds, shadow, snow, and water are removed with Landsat's quality band.

One clear July day can be 20°F hotter than another everywhere, so raw temperatures can't be compared across days. For each day, every pixel is measured relative to the median of lowland King County (the county west of longitude −121.9, where most residents live) on that same day:

$$\Delta T_{\text{pixel}} = T_{\text{pixel}} - \operatorname{median}(T_{\text{lowland}})$$

That relative heat is averaged for recent summers (2023 to 2025), early summers (2013 to 2016), and each year. Lookups average a 150 m block around the address, and report recent surface temperature, degrees hotter or cooler than lowland King County, a percentile rank, the change since 2013 to 2016 (under 3°F counts as "about the same"), and a year-by-year series.

![Year-by-year relative heat for SODO and Discovery Park, 2013 to 2025](docs/images/heat_trends.png)

**Limits:** this is ground and roof temperature at about 11:50 AM on clear days, not air or indoor temperature. Native thermal detail is 100 m.

### Ground motion

![Ground motion across Seattle and the Eastside, 2016 to 2025](docs/images/ground_motion_seattle.png)

**Source:** NASA JPL OPERA Surface Displacement from Sentinel-1 (DISP-S1), collection `OPERA_L3_DISP-S1_V1`, frame F16951, layer `short_wavelength_displacement`, from the Alaska Satellite Facility (ASF DAAC).

By comparing radar passes of the same place over time, InSAR measures how far the ground moved toward or away from the satellite, down to millimeters. NASA publishes it in batches that each start from their own reference date, which resets about yearly. Instead of downloading all 119 files for the frame (about 51 GB), we **chained 8 files** (one per batch, each ending where the next begins) into one record from July 7, 2016 to October 12, 2025, reading only the Seattle and Eastside window of each over the network.

Velocity is total measured movement divided by total measured time across every segment with data. A pixel needs at least 6 of 8 segments and must pass NASA's reliability mask; about 35% of the window qualifies. Lookups average a 90 m block, and under 3 mm per year either way counts as stable.

![Movement at the UW east campus spot, 2016 to 2025](docs/images/ground_motion_uw.png)

**Limits:** movement is measured along the satellite's slanted line of sight, so negative values are *consistent with* sinking rather than a direct vertical measurement. It captures slow movement only, not earthquake shaking. There's no reliable data over water, forest, farmland, or among downtown Seattle's high-rises, and south King County (Kent, Auburn, Federal Way, Enumclaw) is outside this frame for now.

### Validation

We checked every layer against places where we already knew the answer.

| Place | Layer | Result | Expected |
| --- | --- | --- | --- |
| Snoqualmie Valley near Carnation (47.664, −121.920) | Flood | Wet on Dec 10, 2025; 1 of 281 valid passes | Flooded in the Dec 2025 flood of record |
| Lake Washington | Flood | Wet on 281 of 281 passes: `permanent_water` | A lake |
| Seattle Center | Flood | 0 of 196 passes | Dry |
| SODO industrial area | Heat | 105.6°F, +17.3°F vs lowland, 98th percentile | One of the hottest surfaces in the city |
| Discovery Park | Heat | −8.9°F vs lowland; 9.7°F cooler relative to its surroundings than in 2013 to 2016 | A large green park |
| UW east campus (47.65626, −122.2981) | Ground motion | −15.8 mm per year, about −14 cm since 2016 | Matches NASA's ASF Displacement Portal |
| Downtown Bellevue | Ground motion | 0.1 mm per year: stable | Stable |

### Supporting data

- **Geocoding:** US Census Geocoder (`onelineaddress`, benchmark `Public_AR_Current`).
- **County boundary:** US Census TIGERweb, King County (GEOID 53033).

### Rebuilding the data

Builders live in `pipelines/builders/`; see [pipelines/README.md](pipelines/README.md). Flood and ground motion need a NASA Earthdata account (ground motion also needs ASF access approved and Python 3.12); heat needs no account. Raw downloads stay in `pipelines/.cache/` and are never committed.

### Credits

Contains modified Copernicus Sentinel data processed by the European Space Agency, analyzed by NASA JPL/Caltech's OPERA project (DSWx-S1, DISP-S1), and distributed by NASA Earthdata, PO.DAAC and ASF DAAC. Landsat data courtesy of the U.S. Geological Survey and NASA. Basemaps in figures: Esri.

## Checks

```sh
cd server && .venv/bin/python -m pytest -q
cd client && pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm test:integration
```

## Deploy

- **API:** build `server/Dockerfile` (it includes `server/data/`) on Render, Railway, or similar. Set `CORS_ORIGINS` to the site's origin.
- **Web:** deploy `client/` on Vercel with `BACKEND_URL` (the API's public URL), `GEMINI_API_KEY`, and `XAI_API_KEY`.
- **Domain:** point homefield.casa at the Vercel project.
