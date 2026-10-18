"""
Data-team inspection API. The application API lives in server/app/main.py.

  # Run from the repository root, using the pipeline virtual environment:
  pipelines/.venv/bin/uvicorn pipelines.validation.api:app --reload --port 8001
  GET /hazards?address=400 Broad St, Seattle, WA
  GET /hazards?lat=47.664&lon=-121.920
  GET /health
"""
import glob
import json
import logging
import os
import threading

import rasterio
import requests
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from shapely.geometry import Point, shape
from shapely.ops import unary_union
from shapely.prepared import prep

from pipelines.paths import DATA_ROOT
from . import flood_lookup, ground_lookup, heat_lookup
from .flood_lookup import flood_history
from .ground_lookup import ground_at
from .heat_lookup import heat_at

log = logging.getLogger("hazards")

KING_COUNTY_PATH = os.path.join(DATA_ROOT, "king_county.geojson")
FLOOD_GLOB = os.path.join(flood_lookup.HISTORY_DIR, "flood_history_*.tif")
HEAT_TIF = os.path.join(heat_lookup.DATA_DIR, "heat_history.tif")
HEAT_STATS = os.path.join(heat_lookup.DATA_DIR, "heat_stats.json")
GROUND_TIF = os.path.join(ground_lookup.DATA_DIR, "ground_motion.tif")
GROUND_STATS = os.path.join(ground_lookup.DATA_DIR, "ground_stats.json")

CENSUS_URL = "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress"
CENSUS_TIMEOUT_S = 8

CORS_ORIGINS = [o.strip() for o in os.environ.get(
    "CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",") if o.strip()]

app = FastAPI(
    title="Data Inspection API",
    description="Internal data-team tools with neighborhood-averaged reference readings. "
                "Use server/app/main.py for application reports and verified limitations.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=os.environ.get("CORS_ORIGIN_REGEX"),
    allow_methods=["GET"],
    allow_headers=["*"],
)


def _load_king_county():
    with open(KING_COUNTY_PATH) as f:
        features = json.load(f)["features"]
    return prep(unary_union([shape(feat["geometry"]) for feat in features]))


try:
    _king_county = _load_king_county()
except Exception:
    log.exception("Could not load King County boundary from %s", KING_COUNTY_PATH)
    _king_county = None


def _read_json(path):
    try:
        with open(path) as f:
            return json.load(f)
    except Exception:
        return None


def _flood_source():
    return {
        "name": "NASA JPL OPERA DSWx-S1",
        "dates": "",
        "resolution_m": 30,
        "limitations": [
            "The delivered flood files do not record complete acquisition date coverage",
            "Passes are days apart and can miss a flood's peak",
            "Radar misses water under trees and tall crops",
            "Very smooth surfaces (runways, large lots, flat roofs) can look like water, "
            "so a single wet pass in a city may be a false alarm",
        ],
    }


def _heat_source():
    stats = _read_json(HEAT_STATS) or {}
    years, days = stats.get("years"), stats.get("dates_used")
    if years and days:
        dates = f"{len(days)} clear summer days (June to September), {years[0]} to {years[-1]}"
    else:
        dates = "Clear summer days"
    return {
        "name": "Landsat 8/9 Collection 2 surface temperature (NASA/USGS)",
        "dates": dates,
        "resolution_m": 30,
        "limitations": [
            "Ground and roof temperature around noon, not air or indoor temperature",
            "Clear days only, one time of day",
            "Native thermal detail is 100 m; values are averaged over a 150 m block",
        ],
    }


def _ground_source():
    stats = _read_json(GROUND_STATS) or {}
    nodes = stats.get("node_dates")
    return {
        "name": "NASA JPL OPERA DISP-S1",
        "dates": f"{nodes[0]} to {nodes[-1]}" if nodes else "",
        "resolution_m": 30,
        "limitations": [
            "Measured along the satellite's slanted view, not straight up and down",
            "Slow movement only, not earthquake shaking",
            "Unreliable in forests and farmland; reference dates change over time",
            "Covers Seattle, the Eastside and the Snoqualmie Valley only",
        ],
    }


def _flood(lat, lon):
    if not glob.glob(FLOOD_GLOB):
        raise FileNotFoundError(f"No flood history files match {FLOOD_GLOB}")
    return flood_history(lat, lon)


# rasterio dataset handles are not thread-safe, and FastAPI runs sync endpoints in a thread pool.
HAZARDS = [
    ("flood", _flood, _flood_source, threading.Lock()),
    ("heat", heat_at, _heat_source, threading.Lock()),
    ("ground_motion", ground_at, _ground_source, threading.Lock()),
]


def _lookup(name, fn, source_fn, lock, lat, lon):
    try:
        with lock:
            result = fn(lat, lon)
    except Exception:
        log.exception("%s lookup failed at %s, %s", name, lat, lon)
        result = {"status": "error"}
    try:
        result["source"] = source_fn()
    except Exception:
        log.exception("%s source block failed", name)
    return result


def _geocode(address):
    try:
        resp = requests.get(
            CENSUS_URL,
            params={"address": address, "benchmark": "Public_AR_Current", "format": "json"},
            timeout=CENSUS_TIMEOUT_S,
        )
        resp.raise_for_status()
        matches = resp.json()["result"]["addressMatches"]
    except Exception:
        log.exception("Census geocoder failed for %r", address)
        raise HTTPException(503, "The address lookup service isn't responding right now. Please try again in a moment.")
    if not matches:
        raise HTTPException(404, "We couldn't find that address. Check the spelling and include the city and state, "
                                 "for example \"400 Broad St, Seattle, WA\".")
    match = matches[0]
    return match["matchedAddress"], match["coordinates"]["y"], match["coordinates"]["x"]


@app.get("/hazards")
def hazards(
    address: str | None = Query(None, min_length=1, max_length=300),
    lat: float | None = Query(None, ge=-90, le=90),
    lon: float | None = Query(None, ge=-180, le=180),
):
    if address and address.strip():
        address, lat, lon = _geocode(address.strip())
    elif lat is not None and lon is not None:
        address = None
    else:
        raise HTTPException(400, "Provide either ?address=<text> or both ?lat=<number>&lon=<number>.")

    if _king_county is None:
        raise HTTPException(503, "The King County boundary file isn't loaded, so we can't check this location.")

    response = {"address": address, "lat": lat, "lon": lon}
    if not _king_county.covers(Point(lon, lat)):
        return {**response, "in_king_county": False, "hazards": None,
                "message": "This location is outside King County, WA. We only have hazard data for King County right now."}

    return {**response, "in_king_county": True,
            "hazards": {name: _lookup(name, fn, source_fn, lock, lat, lon) for name, fn, source_fn, lock in HAZARDS}}


def _check_raster(path):
    try:
        with rasterio.open(path) as src:
            return {"path": os.path.relpath(path, DATA_ROOT), "loaded": True, "bands": src.count}
    except Exception as e:
        return {"path": os.path.relpath(path, DATA_ROOT), "loaded": False, "error": str(e)}


def _check_json(path):
    ok = _read_json(path) is not None
    return {"path": os.path.relpath(path, DATA_ROOT), "loaded": ok, **({} if ok else {"error": "missing or invalid JSON"})}


@app.get("/health")
def health():
    files = {
        "king_county": [{"path": os.path.relpath(KING_COUNTY_PATH, DATA_ROOT), "loaded": _king_county is not None}],
        "flood": [_check_raster(p) for p in sorted(glob.glob(FLOOD_GLOB))],
        "heat": [_check_raster(HEAT_TIF), _check_json(HEAT_STATS)],
        "ground_motion": [_check_raster(GROUND_TIF), _check_json(GROUND_STATS)],
    }
    layers = {name: bool(entries) and all(e["loaded"] for e in entries) for name, entries in files.items()}
    return {"status": "ok" if all(layers.values()) else "degraded", "layers": layers, "files": files}
