import json
from datetime import date

import pytest
import rasterio
from rasterio.transform import from_origin
from rasterio.warp import transform

from app.layers import RasterLayers
from conftest import WET_DAY, write_heat, write_pixel


@pytest.mark.parametrize("values,status", [
    ([9, 1, WET_DAY, WET_DAY], "not_enough_data"),
    ([10, 0, 0, 0], "no_flooding_seen"),
    ([10, 1, WET_DAY, WET_DAY], "flooded"),
    ([10, 5, WET_DAY, WET_DAY], "permanent_water"),
    ([10, 10, WET_DAY, WET_DAY], "permanent_water"),
    ([0, 0, 0, 0], "not_enough_data"),
])
def test_flood_classification(prepared_data, values, status):
    write_pixel(prepared_data / "flood" / "flood_history_TEST.tif", values, nodata=None)
    result = RasterLayers(prepared_data).lookup("flood", 47.664, -121.92)
    assert result.status == status
    assert result.observed_passes == values[0]


@pytest.mark.parametrize("values", [
    [10, 11, WET_DAY, WET_DAY], [10, -1, 0, 0], [10.5, 1, WET_DAY, WET_DAY],
    [10, 1, 0, 0], [10, 0, WET_DAY, WET_DAY], [10, 1, -1, -1],
    [10, 1, WET_DAY + 1, WET_DAY], [10, 1, 1.5, 1.5],
])
def test_invalid_flood_data(prepared_data, values):
    write_pixel(prepared_data / "flood" / "flood_history_TEST.tif", values)
    with pytest.raises(ValueError):
        RasterLayers(prepared_data).lookup("flood", 47.664, -121.92)


def test_flood_epoch_is_one_based(prepared_data):
    write_pixel(prepared_data / "flood" / "flood_history_TEST.tif", [10, 1, 1, WET_DAY])
    result = RasterLayers(prepared_data).lookup("flood", 47.664, -121.92)
    assert result.first_wet == date(2024, 9, 1)
    assert result.last_wet == date(2025, 12, 10)
    assert "Wet observations at this point" in result.source.dates


def test_missing_epoch_is_error(prepared_data):
    path = prepared_data / "flood" / "flood_history_TEST.tif"
    # Replace the file with an otherwise valid raster without the required epoch tag.
    with rasterio.open(path) as src:
        profile, data = src.profile, src.read()
    with rasterio.open(path, "w", **profile) as dst:
        dst.write(data)
    assert RasterLayers(prepared_data).health()["flood"].status == "error"


def test_dry_flood_has_no_invented_coverage_dates(prepared_data):
    write_pixel(prepared_data / "flood" / "flood_history_TEST.tif", [20, 0, 0, 0])
    result = RasterLayers(prepared_data).lookup("flood", 47.664, -121.92)
    assert result.source.dates == ""
    assert any("complete date range" in item for item in result.source.limitations)


def test_overlapping_tiles_not_double_counted(prepared_data):
    write_pixel(prepared_data / "flood" / "flood_history_SECOND.tif", [20, 0, 0, 0])
    result = RasterLayers(prepared_data).lookup("flood", 47.664, -121.92)
    assert result.observed_passes == 140
    assert result.wet_passes == 1


@pytest.mark.parametrize("layer", ["flood", "heat", "ground_motion"])
def test_outside_raster_is_missing_data(prepared_data, layer):
    assert RasterLayers(prepared_data).lookup(layer, 0, 0).status == "not_enough_data"


@pytest.mark.parametrize("temperature", [-32768, float("nan"), float("inf")])
def test_nodata_and_nonfinite_heat(prepared_data, temperature):
    write_heat(prepared_data / "heat" / "heat_history.tif", temperature=temperature)
    assert RasterLayers(prepared_data).lookup("heat", 47.664, -121.92).status == "not_enough_data"


def test_heat_units_and_comparison(prepared_data):
    result = RasterLayers(prepared_data).lookup("heat", 47.664, -121.92)
    assert result.surface_temp_f == 95
    assert result.recent_relative_f == 5
    assert result.lowland_percentile == 75
    assert result.model_dump()["county_percentile"] is None
    assert result.model_dump()["diff_from_median_f"] is None
    assert result.change_since_early_f == 3
    assert result.clear_days_used == 40
    assert result.source.dates == "2013-07-03, 2025-07-12"
    assert [point.relative_f for point in result.yearly_relative_f] == [2, 5]


def test_optional_heat_history_gaps_do_not_hide_recent_data(prepared_data):
    write_heat(prepared_data / "heat" / "heat_history.tif", early=-32768)
    result = RasterLayers(prepared_data).lookup("heat", 47.664, -121.92)
    assert result.status == "ok"
    assert result.change_since_early_f is None
    assert result.yearly_relative_f[0].relative_f is None


def test_projected_crs(prepared_data):
    xs, ys = transform("EPSG:4326", "EPSG:3857", [-121.92], [47.664])
    write_heat(prepared_data / "heat" / "heat_history.tif", crs="EPSG:3857",
               affine=from_origin(xs[0] - 15, ys[0] + 15, 30, 30))
    assert RasterLayers(prepared_data).lookup("heat", 47.664, -121.92).surface_temp_f == 95


@pytest.mark.parametrize("valid,status", [(0, "not_enough_data"), (1, "ok")])
def test_ground_reliability_and_zero_velocity(prepared_data, valid, status):
    write_pixel(prepared_data / "ground_motion" / "ground_motion.tif", [0, valid, 0, -25])
    result = RasterLayers(prepared_data).lookup("ground_motion", 47.664, -121.92)
    assert result.status == status
    if valid:
        assert result.velocity_mm_per_yr == 0


def test_ground_history_gaps_do_not_hide_valid_velocity(prepared_data):
    write_pixel(prepared_data / "ground_motion" / "ground_motion.tif", [-2.5, 1, 0, float("nan")])
    result = RasterLayers(prepared_data).lookup("ground_motion", 47.664, -121.92)
    assert result.status == "ok"
    assert result.velocity_mm_per_yr == -2.5
    assert result.series_mm[1].mm is None
    assert result.sign_convention_verified is False


def test_bad_heat_stats_are_rejected_per_layer(prepared_data):
    path = prepared_data / "heat" / "heat_stats.json"
    stats = json.loads(path.read_text())
    stats["recent_relative_percentiles_f"].reverse()
    path.write_text(json.dumps(stats))
    with pytest.raises(ValueError):
        RasterLayers(prepared_data).lookup("heat", 47.664, -121.92)
    assert RasterLayers(prepared_data).health()["heat"].status == "error"
    assert RasterLayers(prepared_data).health()["flood"].status == "loaded"


def test_repeated_heat_percentiles_are_allowed(prepared_data):
    path = prepared_data / "heat" / "heat_stats.json"
    stats = json.loads(path.read_text())
    stats["recent_relative_percentiles_f"] = [5] * 101
    path.write_text(json.dumps(stats))
    result = RasterLayers(prepared_data).lookup("heat", 47.664, -121.92)
    assert result.status == "ok" and result.lowland_percentile == 0


def test_heat_year_tags_must_match_statistics(prepared_data):
    with rasterio.open(prepared_data / "heat" / "heat_history.tif", "r+") as dst:
        dst.update_tags(years="2014,2025")
    assert RasterLayers(prepared_data).health()["heat"].status == "error"


def test_empty_percentiles_leave_comparison_unknown(prepared_data):
    path = prepared_data / "heat" / "heat_stats.json"
    stats = json.loads(path.read_text())
    stats["recent_relative_percentiles_f"] = []
    path.write_text(json.dumps(stats))
    result = RasterLayers(prepared_data).lookup("heat", 47.664, -121.92)
    assert result.status == "ok" and result.lowland_percentile is None
