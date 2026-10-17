"""
Build a 2013-2025 summer surface-temperature history for King County from Landsat 8/9
Collection 2 Level-2 (NASA/USGS), served by Microsoft Planetary Computer. No login needed.

For every clear summer day, each pixel's temperature is compared with the median of lowland
King County on that same day ("relative heat"). That removes day-to-day weather, so days and
years can be compared, and a place's change over time can be measured.

Outputs (in OUT_DIR):
  heat_history.tif    int16, tenths of a degree F, -32768 = no data
                      band 1  recent surface temperature (mean of RECENT_YEARS)
                      band 2  recent relative heat vs lowland median (RECENT_YEARS)
                      band 3  early relative heat (EARLY_YEARS)
                      band 4  number of clear days used (a count, not tenths)
                      band 5+ relative heat for each year in YEARS (one band per year)
  heat_stats.json     years, dates used, percentiles of recent relative heat in the lowlands
  ../king_county.geojson county boundary shared by the server
  Cached scenes live separately in pipelines/.cache/heat/.

Usage:
  python -m pipelines.builders.build_heat                     # all years
  python -m pipelines.builders.build_heat --years 2024 2025   # exploratory partial build
"""

# Support both `python -m pipelines...` and running this file directly.
if __package__ in {None, ""}:
    import sys
    from pathlib import Path

    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import argparse
import json
import math
import os
import time
import warnings

import numpy as np
import rasterio
import requests
from rasterio.features import geometry_mask
from rasterio.transform import from_origin
from rasterio.vrt import WarpedVRT
from rasterio.warp import Resampling, transform_bounds, transform_geom

from pipelines.paths import CACHE_ROOT, DATA_ROOT

OUT_DIR = DATA_ROOT / "heat"
CACHE_DIR = CACHE_ROOT / "heat"
CRS = "EPSG:32610"  # UTM zone 10N, the Landsat grid for this area
RES = 30
YEARS = list(range(2013, 2026))
RECENT_YEARS = [2023, 2024, 2025]
EARLY_YEARS = [2013, 2014, 2015, 2016]
MAX_CLOUD = 10             # scene cloud cover %, from the catalog
MIN_LOWLAND_CLEAR = 0.5    # skip a day if under half of lowland King County is clear
LOWLAND_EAST_LON = -121.9  # "lowland" = county land west of this line, where most residents live
NODATA = -32768

STAC = "https://planetarycomputer.microsoft.com/api/stac/v1/search"
TOKEN_URL = "https://planetarycomputer.microsoft.com/api/sas/v1/token/landsat-c2-l2"
COUNTY = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer/1/query"
# QA_PIXEL bits to throw out: fill, dilated cloud, cirrus, cloud, cloud shadow, snow, water
BAD_BITS = (1 << 0) | (1 << 1) | (1 << 2) | (1 << 3) | (1 << 4) | (1 << 5) | (1 << 7)

_token = {"value": None, "time": 0}


def get(method, url, **kw):
    """HTTP with retries; Planetary Computer sometimes rate-limits (403/429)."""
    for attempt in range(8):
        r = requests.request(method, url, timeout=120, **kw)
        if r.status_code == 200:
            return r
        print(f"  {r.status_code} from {url.split('/')[2]}, retrying in 30s")
        time.sleep(30)
    r.raise_for_status()


def token():
    if time.time() - _token["time"] > 20 * 60:  # tokens expire; refresh every 20 minutes
        _token.update(value=get("GET", TOKEN_URL).json()["token"], time=time.time())
    return _token["value"]


def county_geometry():
    gj = get("GET", COUNTY, params={"where": "GEOID='53033'", "outFields": "NAME", "outSR": 4326, "f": "geojson"}).json()
    DATA_ROOT.mkdir(parents=True, exist_ok=True)
    with open(DATA_ROOT / "king_county.geojson", "w") as f:
        json.dump(gj, f)
    return gj["features"][0]["geometry"]


def outer_bounds(geom):
    rings = geom["coordinates"] if geom["type"] == "Polygon" else [r for p in geom["coordinates"] for r in p]
    xs = [x for ring in rings for x, _ in ring]
    ys = [y for ring in rings for _, y in ring]
    return min(xs), min(ys), max(xs), max(ys)


def target_grid(geom):
    west, south, east, north = transform_bounds("EPSG:4326", CRS, *outer_bounds(geom))
    left = math.floor((west - 15) / RES) * RES + 15  # line up with the Landsat pixel grid
    top = math.ceil((north - 15) / RES) * RES + 15
    return from_origin(left, top, RES, RES), math.ceil((east - left) / RES), math.ceil((top - south) / RES)


def find_scenes(years):
    body = {
        "collections": ["landsat-c2-l2"],
        "intersects": {"type": "Point", "coordinates": [-122.2, 47.5]},
        "datetime": f"{min(years)}-06-01/{max(years)}-09-30",
        "query": {"eo:cloud_cover": {"lt": MAX_CLOUD}, "landsat:wrs_path": {"eq": "046"},
                  "landsat:wrs_row": {"eq": "027"}, "platform": {"in": ["landsat-8", "landsat-9"]}},
        "limit": 250,
    }
    items = get("POST", STAC, json=body).json()["features"]
    items = [i for i in items if 6 <= int(i["properties"]["datetime"][5:7]) <= 9
             and int(i["properties"]["datetime"][:4]) in years]
    return sorted(items, key=lambda i: i["properties"]["datetime"])


def read_scene(item, transform, width, height):
    """Clear-sky surface temperature (F) on the target grid, NaN where not usable."""
    band = item["assets"]["lwir11"]["raster:bands"][0]
    out = {}
    for key in ("lwir11", "qa_pixel"):
        for attempt in range(4):
            try:
                with rasterio.Env(GDAL_HTTP_MAX_RETRY=5, GDAL_HTTP_RETRY_DELAY=10,
                                  GDAL_DISABLE_READDIR_ON_OPEN="EMPTY_DIR"):
                    with rasterio.open(item["assets"][key]["href"] + "?" + token()) as src:
                        with WarpedVRT(src, crs=CRS, transform=transform, width=width, height=height,
                                       resampling=Resampling.nearest) as vrt:
                            out[key] = vrt.read(1)
                break
            except rasterio.errors.RasterioIOError as e:
                print(f"  read failed ({e}); retrying in 30s")
                _token["time"] = 0
                time.sleep(30)
        else:
            raise RuntimeError(f"could not read {item['id']}")
    dn, qa = out["lwir11"], out["qa_pixel"]
    temp_f = ((dn * band["scale"] + band["offset"]) - 273.15) * 9 / 5 + 32
    clear = (dn != band["nodata"]) & ((qa & BAD_BITS) == 0)
    return np.where(clear, temp_f, np.nan).astype("float32")


def cached_scene(item, transform, width, height):
    path = os.path.join(CACHE_DIR, item["id"] + ".npz")
    if os.path.exists(path):
        tenths = np.load(path)["t"]
        return np.where(tenths == NODATA, np.nan, tenths / 10).astype("float32")
    print(f"  downloading {item['id']}")
    temp = read_scene(item, transform, width, height)
    np.savez_compressed(path, t=np.where(np.isfinite(temp), np.round(temp * 10), NODATA).astype("int16"))
    return temp


def to_tenths(a):
    return np.where(np.isfinite(a), np.round(a * 10), NODATA).astype("int16")


def mean_or_nan(total, count):
    return np.where(count > 0, total / np.maximum(count, 1), np.nan)


def main(argv=None):
    parser = argparse.ArgumentParser(description="Build heat history into server/data/heat/.")
    parser.add_argument("--years", type=int, nargs="+", default=YEARS, help="Years to process (default: full history)")
    years = parser.parse_args(argv).years
    os.makedirs(OUT_DIR, exist_ok=True)
    os.makedirs(CACHE_DIR, exist_ok=True)

    geom = county_geometry()
    transform, width, height = target_grid(geom)
    shape = (height, width)
    in_county = ~geometry_mask([transform_geom("EPSG:4326", CRS, geom)], out_shape=shape, transform=transform)
    west_box = {"type": "Polygon", "coordinates": [[[-123, 46.8], [LOWLAND_EAST_LON, 46.8],
                                                    [LOWLAND_EAST_LON, 48.1], [-123, 48.1], [-123, 46.8]]]}
    lowland = in_county & ~geometry_mask([transform_geom("EPSG:4326", CRS, west_box)], out_shape=shape,
                                         transform=transform)

    items = find_scenes(years)
    print(f"{len(items)} clear summer scenes found for {years[0]}-{years[-1]}")

    def acc():
        return [np.zeros(shape, "float32"), np.zeros(shape, "uint8")]

    recent_temp, recent_rel, early_rel = acc(), acc(), acc()
    total_days = np.zeros(shape, "uint8")
    year_bands, used = {}, []

    for year in years:
        year_acc = acc()
        for item in [i for i in items if i["properties"]["datetime"].startswith(str(year))]:
            day = item["properties"]["datetime"][:10]
            temp = cached_scene(item, transform, width, height)
            clear_share = float(np.isfinite(temp[lowland]).mean())
            if clear_share < MIN_LOWLAND_CLEAR:
                print(f"{day}: skipped, only {clear_share:.0%} of lowland county clear")
                continue
            median = float(np.nanmedian(temp[lowland]))
            rel = temp - median
            ok = np.isfinite(rel) & in_county
            used.append({"date": day, "lowland_median_f": round(median, 1), "clear_share": round(clear_share, 2)})
            print(f"{day}: lowland median {median:.1f} F, {clear_share:.0%} clear")

            targets = [year_acc]
            if year in RECENT_YEARS:
                targets.append(recent_rel)
                recent_temp[0][ok] += temp[ok]
                recent_temp[1][ok] += 1
            if year in EARLY_YEARS:
                targets.append(early_rel)
            for total, count in targets:
                total[ok] += rel[ok]
                count[ok] += 1
            total_days[ok] += 1
        year_bands[year] = to_tenths(mean_or_nan(*year_acc))

    recent_rel_f = mean_or_nan(*recent_rel)
    values = recent_rel_f[lowland & np.isfinite(recent_rel_f)]
    stats = {
        "years": years, "recent_years": RECENT_YEARS, "early_years": EARLY_YEARS,
        "lowland_definition": f"King County west of longitude {LOWLAND_EAST_LON}",
        "recent_relative_percentiles_f": [round(float(v), 2) for v in np.percentile(values, range(101))] if values.size else [],
        "dates_used": used,
    }
    with open(os.path.join(OUT_DIR, "heat_stats.json"), "w") as f:
        json.dump(stats, f)

    bands = [to_tenths(mean_or_nan(*recent_temp)), to_tenths(recent_rel_f), to_tenths(mean_or_nan(*early_rel)),
             total_days.astype("int16")] + [year_bands[y] for y in years]
    profile = dict(driver="GTiff", width=width, height=height, count=len(bands), dtype="int16", crs=CRS,
                   transform=transform, nodata=NODATA, compress="deflate", predictor=2, zlevel=9, tiled=True)
    with rasterio.open(os.path.join(OUT_DIR, "heat_history.tif"), "w", **profile) as dst:
        for i, b in enumerate(bands, start=1):
            dst.write(b, i)
        dst.update_tags(years=",".join(map(str, years)))
    print(f"heat_history.tif written: {len(used)} days used, {len(bands)} bands")


if __name__ == "__main__":
    warnings.simplefilter("ignore", RuntimeWarning)
    main()
