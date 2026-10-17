"""
Build a flood-history map for King County from NASA JPL OPERA DSWx-S1 (Sentinel-1 radar).

Output: flood_history_<tile>.tif, one per map tile, each with 4 bands:
  1 observed  - number of passes with a valid reading at this pixel
  2 wet       - number of passes where it was water (open water or flooded vegetation)
  3 first_wet - day number of the first wet pass (0 = never wet)
  4 last_wet  - day number of the most recent wet pass (0 = never wet)
Day numbers are Pacific-time days since EPOCH, where EPOCH itself is day 1.

Usage:
  pip install earthaccess rasterio numpy pyproj
  python build_flood_history.py                  # search, download, build
  python build_flood_history.py --skip-download  # rebuild from files already downloaded
"""
import glob
import os
import re
import sys
from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo

import numpy as np
import rasterio

BBOX = (-122.55, 47.08, -121.06, 47.78)  # King County, roughly (west, south, east, north)
START, END = "2024-09-01", "2026-10-16"
FLOOD_MONTHS = None  # all months; set to {11, 12, 1, 2, 3} for flood season only (about half the download)
EPOCH = date(2024, 9, 1)
DATA_DIR = "dswx_wtr"
OUT_DIR = "."
WATER = (1, 3)    # 1 = open water, 3 = flooded vegetation
VALID = (0, 1, 3)  # any other value = no reliable reading or not covered on that pass
NAME = re.compile(r"_(T\w{5})_(\d{8}T\d{6})Z_(\d{8}T\d{6})Z_")
PACIFIC = ZoneInfo("America/Los_Angeles")


def local_day(acq):
    """Acquisition time (UTC string) -> Pacific-time day number. A 02:00 UTC pass is the evening before."""
    t = datetime.strptime(acq, "%Y%m%dT%H%M%S").replace(tzinfo=timezone.utc).astimezone(PACIFIC)
    return (t.date() - EPOCH).days + 1


def find_urls():
    import earthaccess
    results = earthaccess.search_data(short_name="OPERA_L3_DSWX-S1_V1", bounding_box=BBOX, temporal=(START, END))
    best = {}
    for g in results:
        for url in g.data_links():
            if not url.endswith("_B01_WTR.tif"):
                continue
            tile, acq, prod = NAME.search(url).groups()
            if FLOOD_MONTHS and int(acq[4:6]) not in FLOOD_MONTHS:
                continue
            key = (tile, acq)
            if key not in best or prod > best[key][0]:  # keep only the newest reprocessed version
                best[key] = (prod, url)
    return [url for _, url in best.values()]


def build(files):
    by_tile = {}
    for f in files:
        tile, acq, _ = NAME.search(os.path.basename(f)).groups()
        by_tile.setdefault(tile, []).append((acq, f))

    for tile, items in sorted(by_tile.items()):
        items.sort()
        with rasterio.open(items[0][1]) as src:
            profile, shape = src.profile.copy(), src.shape
        observed = np.zeros(shape, np.uint16)
        wet = np.zeros(shape, np.uint16)
        first = np.zeros(shape, np.uint16)
        last = np.zeros(shape, np.uint16)

        for acq, f in items:
            with rasterio.open(f) as src:
                a = src.read(1)
            if a.shape != shape:
                print(f"skipping {os.path.basename(f)}: unexpected grid size")
                continue
            day = local_day(acq)
            w = np.isin(a, WATER)
            observed += np.isin(a, VALID)
            wet += w
            first[(first == 0) & w] = day
            last[w] = day

        profile.update(count=4, dtype="uint16", nodata=None, compress="deflate", photometric="minisblack")
        out = os.path.join(OUT_DIR, f"flood_history_{tile}.tif")
        with rasterio.open(out, "w", **profile) as dst:
            for i, band in enumerate((observed, wet, first, last), start=1):
                dst.write(band, i)
            dst.update_tags(epoch=EPOCH.isoformat(), bands="observed,wet,first_wet,last_wet")
        print(f"{out}: {len(items)} passes, {int((wet > 0).sum())} pixels wet at least once")


if __name__ == "__main__":
    if "--skip-download" in sys.argv:
        files = glob.glob(os.path.join(DATA_DIR, "*_B01_WTR.tif"))
    else:
        import earthaccess
        earthaccess.login(persist=True)  # asks for your Earthdata username/password the first time
        urls = find_urls()
        print(f"{len(urls)} water-layer files to download")
        earthaccess.download(urls, DATA_DIR)
        wanted = {os.path.basename(u) for u in urls}
        files = [f for f in glob.glob(os.path.join(DATA_DIR, "*_B01_WTR.tif")) if os.path.basename(f) in wanted]
    build(files)
