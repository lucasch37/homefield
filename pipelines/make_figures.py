"""
Draw the /data page figures from HomeField's processed data (run from the repo root).

  pip install rasterio numpy pyproj matplotlib requests pillow
  python pipelines/make_figures.py

Writes to client/public/data-figures/:
  flood_snoqualmie_dec2025_dark.png  Snoqualmie Valley before/during the December 2025 flood
  heat_map_seattle.png        13-year summer heat relative to lowland King County
  heat_trends.png             year-by-year relative heat, SODO vs Discovery Park
  ground_motion_seattle.png   ground velocity, Seattle and the Eastside
  ground_motion_uw.png        2016-2025 movement at the UW east campus spot
"""
import glob
import io
import json
import os
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

import matplotlib
import matplotlib.ticker
import numpy as np
from matplotlib.colors import ListedColormap
from matplotlib.patches import Patch
import rasterio
import requests
from PIL import Image
from pyproj import Transformer
from rasterio.transform import from_bounds
from rasterio.warp import Resampling, reproject

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402

BG, PANEL, LINE, TXT, SUB, ACCENT = "#05030A", "#0B0614", "#1F1632", "#EDE7FA", "#B8A9D9", "#C4B5FD"
plt.rcParams.update({
    "figure.facecolor": BG, "axes.facecolor": BG, "savefig.facecolor": BG,
    "text.color": TXT, "axes.labelcolor": SUB, "axes.edgecolor": LINE,
    "xtick.color": SUB, "ytick.color": SUB,
})

DATA = os.path.join("server", "data")
OUT = os.path.join("client", "public", "data-figures")
HEAT_TIF = os.path.join(DATA, "heat", "heat_history.tif")
HEAT_STATS = os.path.join(DATA, "heat", "heat_stats.json")
GROUND_TIF = os.path.join(DATA, "ground_motion", "ground_motion.tif")
GROUND_STATS = os.path.join(DATA, "ground_motion", "ground_stats.json")
DSWX_DIR = os.path.expanduser(os.path.join("~", "Downloads", "FloodData", "dswx_wtr"))
NODATA = -32768

FLOOD_BOUNDS = (-122.06, 47.60, -121.85, 47.78)  # Snoqualmie Valley, Duvall to below Carnation
FLOOD_WIDTH = 800
FLOOD_BEFORE, FLOOD_DURING = "20251205T0153", "20251210T0201"  # Sentinel-1 pass start times (UTC)
WATER, FLOODED_VEG, WTR_FILL = 1, 3, 255

MAP_BOUNDS = (-122.44, 47.50, -122.08, 47.74)  # west, south, east, north: Seattle + Eastside
SIZE = (1100, 1000)
PLACES = {
    "SODO": (47.5800, -122.3350),
    "Discovery Park": (47.6600, -122.4200),
    "UW east campus": (47.65626, -122.2981),
    "Bellevue": (47.6101, -122.2015),
    "Duvall": (47.7423, -121.9857),
    "Carnation": (47.6479, -121.9140),
}
CREDIT_FLOOD = ("NASA JPL OPERA DSWx-S1 (30 m). Contains modified Copernicus Sentinel data processed by ESA. "
                "Basemap: Esri.")
CREDIT_HEAT = "Landsat 8/9 Collection 2 surface temperature, 45 clear summer days 2013-2025 (NASA/USGS). Basemap: Esri."
CREDIT_GROUND = ("NASA JPL OPERA DISP-S1, frame F16951, 2016-2025. Contains modified Copernicus Sentinel data "
                 "processed by ESA. Basemap: Esri.")


def web_mercator_grid(bounds, size):
    to_m = Transformer.from_crs("EPSG:4326", "EPSG:3857", always_xy=True)
    x0, y0 = to_m.transform(bounds[0], bounds[1])
    x1, y1 = to_m.transform(bounds[2], bounds[3])
    return (x0, y0, x1, y1), from_bounds(x0, y0, x1, y1, size[0], size[1]), to_m


def basemap(merc_bounds, size):
    try:
        r = requests.get(
            "https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/export",
            params={"bbox": ",".join(map(str, merc_bounds)), "bboxSR": 3857, "imageSR": 3857,
                    "size": f"{size[0]},{size[1]}", "format": "png", "f": "image"}, timeout=60)
        return np.array(Image.open(io.BytesIO(r.content)).convert("RGB")) / 255
    except Exception as e:
        print(f"  (no basemap: {e})")
        return np.ones((size[1], size[0], 3)) * 0.12


def to_mercator(path, band, transform, size, valid_band=None, scale=1.0, nodata=None):
    with rasterio.open(path) as src:
        data = src.read(band).astype("float32")
        if nodata is not None:
            data[data == nodata] = np.nan
        if valid_band:
            data[src.read(valid_band) != 1] = np.nan
        data *= scale
        out = np.full((size[1], size[0]), np.nan, "float32")
        reproject(data, out, src_transform=src.transform, src_crs=src.crs, src_nodata=np.nan,
                  dst_transform=transform, dst_crs="EPSG:3857", dst_nodata=np.nan, resampling=Resampling.average)
    return out


def label_places(ax, to_m, merc, names, size=SIZE):
    x0, y0, x1, y1 = merc
    for name in names:
        lat, lon = PLACES[name]
        x, y = to_m.transform(lon, lat)
        px, py = (x - x0) / (x1 - x0) * size[0], (y1 - y) / (y1 - y0) * size[1]
        ax.plot(px, py, "o", ms=7, mfc=ACCENT, mec=BG, zorder=5)
        ax.text(px + 12, py - 10, name, fontsize=10, weight="bold", zorder=5,
                color=TXT, bbox=dict(fc=PANEL, ec=LINE, alpha=0.9, pad=1.5))


def map_figure(values, cmap, vmin, vmax, title, cbar_label, credit, places, filename):
    merc, transform, to_m = web_mercator_grid(MAP_BOUNDS, SIZE)
    base = basemap(merc, SIZE)
    fig, ax = plt.subplots(figsize=(11, 10.5), dpi=150)
    ax.imshow(base)
    im = ax.imshow(np.ma.masked_invalid(values), cmap=cmap, vmin=vmin, vmax=vmax, alpha=0.85)
    label_places(ax, to_m, merc, places)
    ax.set_xticks([]), ax.set_yticks([])
    ax.set_title(title, fontsize=15, weight="bold", color=TXT)
    cb = fig.colorbar(im, ax=ax, orientation="horizontal", fraction=0.04, pad=0.03)
    cb.set_label(cbar_label, fontsize=11, color=TXT)
    cb.outline.set_edgecolor(LINE)
    fig.text(0.5, 0.015, credit, ha="center", fontsize=8, color=SUB)
    fig.savefig(os.path.join(OUT, filename), dpi=150, bbox_inches="tight", facecolor=BG)
    plt.close(fig)
    print("  wrote", filename)


def point_values(path, lat, lon, radius, nodata=None, valid_band=None):
    with rasterio.open(path) as src:
        x, y = Transformer.from_crs("EPSG:4326", src.crs, always_xy=True).transform(lon, lat)
        row, col = src.index(x, y)
        win = ((row - radius, row + radius + 1), (col - radius, col + radius + 1))
        block = src.read(window=win).astype("float64")
        if nodata is not None:
            block[block == nodata] = np.nan
        if valid_band:
            block[:, block[valid_band - 1] != 1] = np.nan
        flat = block.reshape(block.shape[0], -1)
        return [float(np.nanmean(b)) if np.isfinite(b).any() else np.nan for b in flat]


def flood_mosaic(pass_prefix, transform, size):
    paths = sorted(glob.glob(os.path.join(DSWX_DIR, f"OPERA_L3_DSWx-S1_*_{pass_prefix}*_WTR.tif")))
    if not paths:
        raise FileNotFoundError(f"no DSWx-S1 granules for pass {pass_prefix} in {DSWX_DIR}")
    out = np.full((size[1], size[0]), WTR_FILL, "uint8")
    for path in paths:
        tile = np.full_like(out, WTR_FILL)
        with rasterio.open(path) as src:
            reproject(src.read(1), tile, src_transform=src.transform, src_crs=src.crs, src_nodata=WTR_FILL,
                      dst_transform=transform, dst_crs="EPSG:3857", dst_nodata=WTR_FILL,
                      resampling=Resampling.nearest)
        take = (out == WTR_FILL) & np.isin(tile, (0, WATER, FLOODED_VEG))
        out[take] = tile[take]
    start = os.path.basename(paths[0]).split("_")[4]
    when = datetime.strptime(start, "%Y%m%dT%H%M%SZ").replace(tzinfo=timezone.utc)
    return out, when.astimezone(ZoneInfo("America/Los_Angeles"))


def flood_figure():
    merc, _, to_m = web_mercator_grid(FLOOD_BOUNDS, (1, 1))
    size = (FLOOD_WIDTH, round(FLOOD_WIDTH * (merc[3] - merc[1]) / (merc[2] - merc[0])))
    merc, transform, to_m = web_mercator_grid(FLOOD_BOUNDS, size)
    base = basemap(merc, size)
    before, before_at = flood_mosaic(FLOOD_BEFORE, transform, size)
    during, during_at = flood_mosaic(FLOOD_DURING, transform, size)

    both = (before != WTR_FILL) & (during != WTR_FILL)
    wet = lambda cls: np.isin(cls, (WATER, FLOODED_VEG)) & both  # noqa: E731
    ratio = wet(during).sum() / max(wet(before).sum(), 1)

    water_color, veg_color = "#3D8BFF", "#2DD4BF"
    cmap = ListedColormap([water_color, veg_color])
    fig, axes = plt.subplots(1, 2, figsize=(13, 8.6), dpi=150)
    panels = [(before, f"{before_at:%B} {before_at.day}, {before_at.year}: before the storm", "Normal river channel"),
              (during, f"{during_at:%B} {during_at.day}, {during_at.year}: flood",
               f"About {ratio:.1f}× the water area of {before_at:%b} {before_at.day}")]
    for ax, (cls, title, note) in zip(axes, panels):
        ax.imshow(base)
        shown = np.ma.masked_where(~np.isin(cls, (WATER, FLOODED_VEG)), (cls == FLOODED_VEG).astype("uint8"))
        ax.imshow(shown, cmap=cmap, vmin=0, vmax=1, interpolation="nearest")
        label_places(ax, to_m, merc, ["Duvall", "Carnation"], size)
        ax.set_xticks([]), ax.set_yticks([])
        ax.set_title(title, fontsize=13, weight="bold", color=TXT)
        ax.text(0.02, 0.02, note, transform=ax.transAxes, fontsize=10, color=TXT,
                bbox=dict(fc=PANEL, ec=LINE, alpha=0.9, pad=3))
    fig.suptitle("The Snoqualmie Valley flood, seen by Sentinel-1 radar through storm clouds",
                 fontsize=15, weight="bold", color=TXT)
    fig.legend(handles=[Patch(color=water_color, label="Open water"), Patch(color=veg_color, label="Flooded vegetation")],
               loc="lower center", ncol=2, frameon=False, fontsize=11, labelcolor=TXT, bbox_to_anchor=(0.5, 0.035))
    passes = f"radar passes at {before_at:%-I:%M %p} and {during_at:%-I:%M %p} Pacific"
    fig.text(0.5, 0.015, f"{CREDIT_FLOOD} {passes[0].upper()}{passes[1:]}.", ha="center", fontsize=8, color=SUB)
    fig.subplots_adjust(left=0.02, right=0.98, top=0.9, bottom=0.1, wspace=0.05)
    fig.savefig(os.path.join(OUT, "flood_snoqualmie_dec2025_dark.png"), dpi=150, bbox_inches="tight", facecolor=BG)
    plt.close(fig)
    print("  wrote flood_snoqualmie_dec2025_dark.png")


def heat_figures():
    with open(HEAT_STATS) as f:
        stats = json.load(f)
    years = stats["years"]
    _, transform, _ = web_mercator_grid(MAP_BOUNDS, SIZE)
    rel = to_mercator(HEAT_TIF, 2, transform, SIZE, scale=0.1, nodata=NODATA)
    map_figure(rel, "RdBu_r", -15, 15,
               "Summer surface heat vs. lowland King County, 2023-2025",
               "°F hotter (red) or cooler (blue) than the lowland median on the same clear days",
               CREDIT_HEAT, ["SODO", "Discovery Park", "UW east campus", "Bellevue"], "heat_map_seattle.png")

    fig, ax = plt.subplots(figsize=(10, 5), dpi=150)
    for name, color in [("SODO", "#FF8A80"), ("Discovery Park", "#7FB8FF")]:
        vals = point_values(HEAT_TIF, *PLACES[name], radius=2, nodata=NODATA)[4:4 + len(years)]
        ax.plot(years, [v / 10 for v in vals], "o-", color=color, lw=2.5, label=name)
    ax.axhline(0, color=LINE, lw=1, ls="--")
    ax.xaxis.set_major_locator(matplotlib.ticker.MaxNLocator(integer=True))
    ax.set_ylabel("°F vs. lowland King County median")
    ax.set_title("Summer surface heat, year by year (Landsat, 2013-2025)", fontsize=14, weight="bold", color=TXT)
    for t in ax.legend(frameon=False, fontsize=11).get_texts():
        t.set_color(TXT)
    ax.spines[["top", "right"]].set_visible(False)
    fig.text(0.5, -0.02, "Each point averages that summer's clear Landsat days over a 150 m block. "
                         "Discovery Park has cooled about 10°F relative to its surroundings since 2013-2016.",
             ha="center", fontsize=8.5, color=SUB)
    fig.savefig(os.path.join(OUT, "heat_trends.png"), dpi=150, bbox_inches="tight", facecolor=BG)
    plt.close(fig)
    print("  wrote heat_trends.png")


def ground_figures():
    with open(GROUND_STATS) as f:
        stats = json.load(f)
    _, transform, _ = web_mercator_grid(MAP_BOUNDS, SIZE)
    vel = to_mercator(GROUND_TIF, 1, transform, SIZE, valid_band=2)
    map_figure(vel, "RdBu", -10, 10,
               "Ground motion, Seattle and the Eastside, 2016-2025",
               "mm per year: red = moving away from the satellite (consistent with sinking), blue = toward",
               CREDIT_GROUND, ["UW east campus", "Bellevue", "SODO"], "ground_motion_seattle.png")

    dates = np.array(stats["node_dates"], dtype="datetime64[D]")
    values = point_values(GROUND_TIF, *PLACES["UW east campus"], radius=1, valid_band=2)
    velocity, series = values[0], values[2:]
    fig, ax = plt.subplots(figsize=(10, 5), dpi=150)
    ax.plot(dates, series, "o-", color="#FF8A80", lw=2.5)
    ax.fill_between(dates, series, 0, color="#FF8A80", alpha=0.15)
    ax.axhline(0, color=LINE, lw=1, ls="--")
    ax.set_ylabel("Movement since July 2016 (mm)")
    ax.set_title("UW east campus: steady movement away from the satellite since 2016", fontsize=14, weight="bold", color=TXT)
    ax.spines[["top", "right"]].set_visible(False)
    fig.text(0.5, -0.02, f"NASA OPERA DISP-S1 line-of-sight displacement, 90 m block at 47.65626, -122.2981: "
                         f"about {velocity:.1f} mm per year, consistent with sinking.", ha="center", fontsize=8.5, color=SUB)
    fig.savefig(os.path.join(OUT, "ground_motion_uw.png"), dpi=150, bbox_inches="tight", facecolor=BG)
    plt.close(fig)
    print("  wrote ground_motion_uw.png")


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    print("flood:")
    flood_figure()
    print("heat:")
    heat_figures()
    print("ground motion:")
    ground_figures()
