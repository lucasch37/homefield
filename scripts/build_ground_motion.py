"""
Build a 2016-2025 ground-motion map for Seattle and the Eastside from NASA JPL OPERA DISP-S1
(frame 16951), reading only the needed window of each file over the internet.

How it works:
  Each DISP-S1 file holds displacement from a "reference date" to a later date. The reference
  date resets roughly yearly (a "ministack"). To get one continuous 2016-2025 history, we take,
  for each reference date, the file that ends exactly on the next reference date, and add the
  segments together ("chaining"). That needs one file per segment instead of all 119.

Outputs (in OUT_DIR):
  ground_motion.tif   float32, frame's own UTM grid, 30 m pixels
                      band 1  velocity, mm/yr (straight-line fit through the chained history)
                      band 2  valid (1 = reliable per NASA's recommended_mask, else 0)
                      band 3+ cumulative displacement in mm at each chain date (first date = 0)
  ground_stats.json   chain dates, frame, window, sign note
  ground_cache/       one file per segment read; reruns skip these

Usage (Python 3.12 environment):
  pip install earthaccess xarray h5netcdf h5py pyproj rasterio numpy
  python build_ground_motion.py --plan     # print which files are needed, read nothing (~1 min)
  python build_ground_motion.py            # full run (~2 min per file; safe to rerun if stopped)
"""
import json
import os
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime

import numpy as np

FRAME = "F16951"
WINDOW = (-122.45, 47.38, -121.90, 47.78)  # west, south, east, north: Seattle, Eastside, Snoqualmie Valley
VARIABLE = "short_wavelength_displacement"  # what the ASF portal's velocity map uses; float32, half the size
OUT_DIR = "."
CACHE_DIR = "ground_cache"
WORKERS = 3
MIN_SEGMENTS = 6  # of 8: how many segments a pixel needs to get a velocity
NAME = re.compile(r"_(F\d+)_VV_(\d{8})T\d{6}Z_(\d{8})T\d{6}Z_v[\d.]+_(\d{8}T\d{6})Z")


def plan_chain(granules):
    """Pick one file per reference date so the segments chain end-to-start."""
    files = {}
    for g in granules:
        name = g["umm"]["GranuleUR"]
        m = NAME.search(name)
        if not m or m[1] != FRAME:
            continue
        ref, sec, prod = m[2], m[3], m[4]
        if (ref, sec) not in files or prod > files[(ref, sec)][0]:  # keep the newest reprocessed copy
            files[(ref, sec)] = (prod, g)

    refs = sorted({ref for ref, _ in files})
    chain, warnings = [], []
    for i, ref in enumerate(refs):
        secs = sorted(sec for r, sec in files if r == ref)
        if i + 1 < len(refs):
            target = refs[i + 1]
            if target in secs:
                end = target
            else:
                earlier = [s for s in secs if s <= target]
                end = earlier[-1] if earlier else secs[-1]
                warnings.append(f"segment from {ref}: no file ends on {target}, using {end} (small gap)")
        else:
            end = secs[-1]  # last segment: go to the newest date
        chain.append((ref, end, files[(ref, end)][1]))
    return chain, warnings


def read_segment(item, x_slice, y_slice):
    """Read the window of one file; cached so reruns skip it."""
    ref, end, granule = item
    path = os.path.join(CACHE_DIR, f"{FRAME}_{ref}_{end}.npz")
    if os.path.exists(path):
        return np.load(path)["d"]
    import earthaccess
    import xarray as xr
    t0 = time.time()
    f = earthaccess.open([granule], show_progress=False)[0]
    ds = xr.open_dataset(f, engine="h5netcdf")
    data = ds[VARIABLE].sel(x=x_slice, y=y_slice).values.astype("float32")
    np.savez_compressed(path, d=data)
    print(f"  read {ref} -> {end} in {time.time() - t0:.0f}s")
    return data


def decimal_year(day):
    d = datetime.strptime(day, "%Y%m%d")
    start = datetime(d.year, 1, 1)
    return d.year + (d - start).days / 365.25


def main():
    import earthaccess
    earthaccess.login(persist=True)
    granules = earthaccess.search_data(short_name="OPERA_L3_DISP-S1_V1", granule_name=f"*{FRAME}*", count=500)
    chain, warnings = plan_chain(granules)
    print(f"{len(granules)} files for {FRAME}; chain needs {len(chain)} of them:")
    for ref, end, _ in chain:
        print(f"  {ref} -> {end}")
    for w in warnings:
        print("  warning:", w)
    if "--plan" in sys.argv:
        return

    import rasterio
    import xarray as xr
    from pyproj import CRS, Transformer
    from rasterio.transform import from_origin

    os.makedirs(CACHE_DIR, exist_ok=True)

    # Grid, window, and the reliability mask come from the newest file.
    last = chain[-1][2]
    ds = xr.open_dataset(earthaccess.open([last], show_progress=False)[0], engine="h5netcdf")
    crs = CRS.from_wkt(ds["spatial_ref"].attrs["crs_wkt"])
    to_frame = Transformer.from_crs("EPSG:4326", crs, always_xy=True)
    x0, y0 = to_frame.transform(WINDOW[0], WINDOW[1])
    x1, y1 = to_frame.transform(WINDOW[2], WINDOW[3])
    x_slice, y_slice = slice(x0, x1), slice(y1, y0)  # y runs north to south
    xs = ds["x"].sel(x=x_slice).values
    ys = ds["y"].sel(y=y_slice).values
    mask_path = os.path.join(CACHE_DIR, f"{FRAME}_mask.npz")
    if os.path.exists(mask_path):
        mask = np.load(mask_path)["m"]
    else:
        print("reading reliability mask")
        mask = ds["recommended_mask"].sel(x=x_slice, y=y_slice).values
        np.savez_compressed(mask_path, m=mask)
    print(f"window: {len(ys)} x {len(xs)} pixels")

    with ThreadPoolExecutor(WORKERS) as ex:
        segments = list(ex.map(lambda item: read_segment(item, x_slice, y_slice), chain))

    # Chain: cumulative displacement (meters) at each node date. A gap in any segment leaves the
    # later cumulative values unknown (NaN) for that pixel, so the chart shows a shorter history there.
    node_dates = [chain[0][0]] + [end for _, end, _ in chain]
    cumulative = [np.zeros_like(segments[0])]
    for seg in segments:
        cumulative.append(cumulative[-1] + seg)
    stack = np.stack(cumulative)  # (nodes, y, x), meters

    # Velocity from whichever segments have data: total measured movement / total measured time.
    # A pixel needs at least MIN_SEGMENTS of the segments, so one gap doesn't throw it away.
    years = np.array([decimal_year(end) - decimal_year(ref) for ref, end, _ in chain])
    seg_stack = np.stack(segments)
    seg_ok = np.isfinite(seg_stack)
    for (ref, end, _), ok in zip(chain, seg_ok):
        print(f"  segment {ref} -> {end}: {ok.mean():.0%} of window has data")
    moved = np.where(seg_ok, seg_stack, 0).sum(axis=0)
    measured_years = np.tensordot(years, seg_ok.astype("float32"), axes=1)
    enough = seg_ok.sum(axis=0) >= MIN_SEGMENTS
    with np.errstate(invalid="ignore", divide="ignore"):
        velocity_mm = np.where(enough, moved / measured_years * 1000, np.nan).astype("float32")
    finite = np.isfinite(velocity_mm)
    valid = (finite & (mask == 1)).astype("float32")
    print(f"pixels with velocity: {finite.mean():.0%}; also passing NASA's mask: {valid.mean():.0%}")

    bands = [velocity_mm, valid] + [(c * 1000).astype("float32") for c in stack]
    transform = from_origin(xs[0] - 15, ys[0] + 15, 30, 30)  # coordinates are pixel centers
    profile = dict(driver="GTiff", width=len(xs), height=len(ys), count=len(bands), dtype="float32",
                   crs=crs.to_wkt(), transform=transform, nodata=np.nan, compress="deflate", predictor=3,
                   tiled=True)
    with rasterio.open(os.path.join(OUT_DIR, "ground_motion.tif"), "w", **profile) as dst:
        for i, b in enumerate(bands, start=1):
            dst.write(b, i)

    stats = {
        "frame": FRAME, "variable": VARIABLE, "window": WINDOW,
        "node_dates": [f"{d[:4]}-{d[4:6]}-{d[6:]}" for d in node_dates],
        "sign_note": "line-of-sight; negative = moving away from the satellite (consistent with sinking). "
                     "Verify against the ASF portal before showing users.",
        "chain_warnings": warnings,
    }
    with open(os.path.join(OUT_DIR, "ground_stats.json"), "w") as f:
        json.dump(stats, f)
    share = float(valid.mean())
    print(f"ground_motion.tif written: {len(node_dates)} dates, {share:.0%} of window reliable, "
          f"velocity 5th-95th percentile {np.nanpercentile(velocity_mm[valid == 1], 5):.1f} to "
          f"{np.nanpercentile(velocity_mm[valid == 1], 95):.1f} mm/yr")


if __name__ == "__main__":
    main()
