import json
from datetime import date

import numpy as np
import pytest
import rasterio
from rasterio.transform import from_origin

WET_DAY = (date(2025, 12, 10) - date(2024, 9, 1)).days + 1


@pytest.fixture
def prepared_data(tmp_path):
    """Temporary files matching the delivered pipeline format; never runtime fallbacks."""
    for layer in ("flood", "heat", "ground_motion"):
        (tmp_path / layer).mkdir()
    (tmp_path / "heat" / "heat_stats.json").write_text(json.dumps({
        "years": [2013, 2025], "recent_years": [2025], "early_years": [2013],
        "lowland_definition": "King County west of longitude -121.9",
        "recent_relative_percentiles_f": [i / 5 - 10 for i in range(101)],
        "dates_used": [{"date": "2013-07-03"}, {"date": "2025-07-12"}],
    }))
    (tmp_path / "ground_motion" / "ground_stats.json").write_text(json.dumps({
        "frame": "TEST", "variable": "short_wavelength_displacement",
        "node_dates": ["2016-07-07", "2025-10-12"],
        "sign_note": "Unverified test sign convention", "chain_warnings": [],
    }))
    write_pixel(tmp_path / "flood" / "flood_history_TEST.tif", [140, 1, WET_DAY, WET_DAY], nodata=None)
    write_heat(tmp_path / "heat" / "heat_history.tif")
    write_pixel(tmp_path / "ground_motion" / "ground_motion.tif", [-2.5, 1, 0, -25], nodata=float("nan"))
    (tmp_path / "king_county.geojson").write_text(json.dumps({
        "type": "FeatureCollection", "features": [{"type": "Feature", "properties": {}, "geometry": {
            "type": "Polygon", "coordinates": [[[-122, 47], [-121, 47], [-121, 48], [-122, 48], [-122, 47]]]
        }}]
    }))
    return tmp_path


def write_pixel(path, values, *, nodata=-9999, crs="EPSG:4326", affine=None, tags=None):
    with rasterio.open(path, "w", driver="GTiff", width=1, height=1,
                       count=len(values), dtype="float64", crs=crs,
                       transform=affine or from_origin(-121.925, 47.669, 0.01, 0.01),
                       nodata=nodata) as dataset:
        dataset.write(np.array(values, dtype="float64").reshape(len(values), 1, 1))
        if path.name.startswith("flood_history_"):
            dataset.update_tags(epoch="2024-09-01", bands="observed,wet,first_wet,last_wet")
        if tags:
            dataset.update_tags(**tags)


def write_heat(path, temperature=950, relative=50, early=20, days=40, **kwargs):
    write_pixel(path, [temperature, relative, early, days, early, relative],
                nodata=-32768, tags={"years": "2013,2025"}, **kwargs)
