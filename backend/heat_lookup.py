"""
Look up summer surface-heat history for one location from heat_history.tif + heat_stats.json.

  from heat_lookup import heat_at
  heat_at(47.5800, -122.3350)

"Relative heat" = how many degrees F hotter (+) or cooler (-) this spot's surface is than the
median of lowland King County on the same clear summer day, averaged over days.
"""
import json
import os
import warnings

import numpy as np
import rasterio
from pyproj import Transformer

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "heat")
RADIUS_PX = 2       # average a 5x5 block (150 m x 150 m) so one roof or tree doesn't decide the result
CHANGE_THRESHOLD_F = 3.0  # smaller changes are within the noise of the measurement
NODATA = -32768

_state = {}


def _load():
    src = rasterio.open(os.path.join(DATA_DIR, "heat_history.tif"))
    with open(os.path.join(DATA_DIR, "heat_stats.json")) as f:
        stats = json.load(f)
    _state.update(src=src, stats=stats, to_grid=Transformer.from_crs("EPSG:4326", src.crs, always_xy=True))


def _block_means(src, row, col):
    window = ((max(row - RADIUS_PX, 0), row + RADIUS_PX + 1), (max(col - RADIUS_PX, 0), col + RADIUS_PX + 1))
    data = src.read(window=window).astype("float64")
    data[data == NODATA] = np.nan
    with np.errstate(invalid="ignore"), warnings.catch_warnings():
        warnings.simplefilter("ignore", RuntimeWarning)  # bands with no valid pixels stay NaN
        means = np.nanmean(data.reshape(data.shape[0], -1), axis=1)
    return means


def _label(percentile):
    if percentile >= 90:
        return "much hotter than most of lowland King County"
    if percentile >= 70:
        return "hotter than most of lowland King County"
    if percentile >= 30:
        return "typical for lowland King County"
    return "cooler than most of lowland King County"


def heat_at(lat, lon):
    if not _state:
        _load()
    src, stats = _state["src"], _state["stats"]
    x, y = _state["to_grid"].transform(lon, lat)
    b = src.bounds
    if not (b.left <= x < b.right and b.bottom < y <= b.top):
        return {"status": "outside_coverage"}

    m = _block_means(src, *src.index(x, y))
    recent_temp, recent_rel, early_rel, days = m[0], m[1], m[2], m[3]
    if np.isnan(recent_rel) or np.isnan(days) or days < 1:
        return {"status": "not_enough_data"}

    result = {
        "status": "ok",
        "recent_surface_temp_f": round(float(recent_temp) / 10, 1),
        "recent_relative_f": round(float(recent_rel) / 10, 1),
        "clear_days_used": int(round(days)),
        "recent_years": stats["recent_years"],
    }
    pct = stats["recent_relative_percentiles_f"]
    if pct:
        result["lowland_percentile"] = int(np.searchsorted(pct, recent_rel / 10).clip(0, 100))
        result["label"] = _label(result["lowland_percentile"])

    if not np.isnan(early_rel):
        change = round(float(recent_rel - early_rel) / 10, 1)
        result["change_since_early_f"] = change
        result["early_years"] = stats["early_years"]
        if change >= CHANGE_THRESHOLD_F:
            result["change_label"] = "hotter relative to its surroundings than it used to be"
        elif change <= -CHANGE_THRESHOLD_F:
            result["change_label"] = "cooler relative to its surroundings than it used to be"
        else:
            result["change_label"] = "about the same as it used to be"

    result["yearly_relative_f"] = [
        {"year": year, "relative_f": round(float(v) / 10, 1)}
        for year, v in zip(stats["years"], m[4:]) if not np.isnan(v)
    ]
    return result


if __name__ == "__main__":
    for name, lat, lon in [("SODO (industrial, Seattle)", 47.5800, -122.3350),
                           ("Discovery Park (Seattle)", 47.6600, -122.4200),
                           ("Carnation", 47.6479, -121.9140),
                           ("Lake Washington (water)", 47.62, -122.26)]:
        print(name, heat_at(lat, lon))
