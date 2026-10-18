"""
Look up 2016-2025 ground motion for one location from ground_motion.tif + ground_stats.json.

  from pipelines.validation.ground_lookup import ground_at
  ground_at(47.65626, -122.2981)

Values are line-of-sight (toward/away from the satellite), mostly vertical for this geometry.
Negative = moving away from the satellite, consistent with sinking.
"""

# Support both `python -m pipelines...` and running this file directly.
if __package__ in {None, ""}:
    import sys
    from pathlib import Path

    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import json
import os
import warnings

import numpy as np
import rasterio
from pyproj import Transformer

from pipelines.paths import DATA_ROOT

DATA_DIR = DATA_ROOT / "ground_motion"
RADIUS_PX = 1           # 3x3 block (90 m x 90 m)
MIN_VALID_PX = 3        # need at least this many reliable pixels in the block
STABLE_MM_PER_YR = 3.0  # slower than this is within the measurement noise

_state = {}


def _load():
    src = rasterio.open(os.path.join(DATA_DIR, "ground_motion.tif"))
    with open(os.path.join(DATA_DIR, "ground_stats.json")) as f:
        stats = json.load(f)
    _state.update(src=src, stats=stats, to_grid=Transformer.from_crs("EPSG:4326", src.crs, always_xy=True))


def _period_years(stats):
    first, last = (np.datetime64(d) for d in (stats["node_dates"][0], stats["node_dates"][-1]))
    return float((last - first) / np.timedelta64(1, "D")) / 365.25


def ground_at(lat, lon):
    if not _state:
        _load()
    src, stats = _state["src"], _state["stats"]
    x, y = _state["to_grid"].transform(lon, lat)
    b = src.bounds
    if not (b.left <= x < b.right and b.bottom < y <= b.top):
        return {"status": "outside_coverage"}

    row, col = src.index(x, y)
    window = ((max(row - RADIUS_PX, 0), row + RADIUS_PX + 1), (max(col - RADIUS_PX, 0), col + RADIUS_PX + 1))
    block = src.read(window=window)  # (bands, h, w)
    good = (block[1] == 1) & np.isfinite(block[0])
    if good.sum() < MIN_VALID_PX:
        return {"status": "not_enough_data"}

    with warnings.catch_warnings():
        warnings.simplefilter("ignore", RuntimeWarning)
        velocity = float(np.nanmean(block[0][good]))
        series = [float(np.nanmean(band[good])) for band in block[2:]]  # NaN after a data gap

    if velocity <= -STABLE_MM_PER_YR:
        label = "moving away from the satellite, consistent with slow sinking"
    elif velocity >= STABLE_MM_PER_YR:
        label = "moving toward the satellite, consistent with slow rising"
    else:
        label = "stable: no measurable movement"

    return {
        "status": "ok",
        "velocity_mm_per_yr": round(velocity, 1),
        "estimated_total_change_mm": round(velocity * _period_years(stats), 1),
        "label": label,
        "series_mm": [{"date": d, "mm": round(v, 1)} for d, v in zip(stats["node_dates"], series) if np.isfinite(v)],
        "period": f"{stats['node_dates'][0]} to {stats['node_dates'][-1]}",
    }


if __name__ == "__main__":
    for name, lat, lon in [("UW / Union Bay (former landfill)", 47.65626, -122.2981),
                           ("Downtown Seattle", 47.6062, -122.3321),
                           ("Downtown Bellevue", 47.6101, -122.2015),
                           ("Lake Washington (water)", 47.62, -122.26)]:
        print(name, ground_at(lat, lon))
