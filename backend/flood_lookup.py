"""
Look up the flood history for one location from the flood_history_<tile>.tif files.

  from flood_lookup import flood_history
  flood_history(47.664, -121.920)
"""
import glob
import os
from datetime import date, timedelta

import rasterio
from pyproj import Transformer

HISTORY_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "flood")
EPOCH = date(2024, 9, 1)  # must match build_flood_history.py
MIN_OBSERVED = 10          # fewer valid passes than this = not enough data to say anything
PERMANENT_SHARE = 0.5      # wet on at least half of passes = river or lake, not a flood
FREQUENT_SHARE = 0.05      # wet on 5%+ of passes = floods or stays wet often (starting guess, tune it)

_tiles = []


def _load():
    for path in sorted(glob.glob(os.path.join(HISTORY_DIR, "flood_history_*.tif"))):
        src = rasterio.open(path)
        _tiles.append((src, Transformer.from_crs("EPSG:4326", src.crs, always_xy=True)))


def _to_date(day):
    return (EPOCH + timedelta(days=int(day) - 1)).isoformat() if day else None


def flood_history(lat, lon):
    if not _tiles:
        _load()
    best = None
    for src, to_tile in _tiles:  # map tiles overlap slightly; keep the best-observed one
        x, y = to_tile.transform(lon, lat)
        b = src.bounds
        if not (b.left <= x < b.right and b.bottom < y <= b.top):
            continue
        row, col = src.index(x, y)
        values = [int(v) for v in src.read(window=((row, row + 1), (col, col + 1)))[:, 0, 0]]
        if best is None or values[0] > best[0]:
            best = values

    if best is None:
        return {"status": "outside_coverage"}
    observed, wet, first, last = best
    result = {"observed_passes": observed, "wet_passes": wet,
              "first_wet": _to_date(first), "last_wet": _to_date(last)}
    share = wet / observed if observed else 0
    if observed < MIN_OBSERVED:
        result["status"] = "not_enough_data"
    elif share >= PERMANENT_SHARE:
        result["status"] = "permanent_water"
    elif share >= FREQUENT_SHARE:
        result["status"] = "frequently_wet"
    elif wet > 0:
        result["status"] = "flooded"
    else:
        result["status"] = "no_flooding_seen"
    return result


if __name__ == "__main__":
    for name, lat, lon in [("Carnation valley floor", 47.664, -121.920),
                           ("Seattle Center", 47.6205, -122.3493),
                           ("Lake Washington", 47.62, -122.26)]:
        print(name, flood_history(lat, lon))
