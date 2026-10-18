"""Read the delivered flood, heat, and ground-motion pipeline outputs locally."""

from datetime import date, timedelta
from pathlib import Path
from typing import Literal

import numpy as np
import rasterio
from pydantic import BaseModel, ConfigDict, Field, model_validator
from rasterio.warp import transform
from rasterio.windows import Window

from .models import Displacement, Flood, GroundMotion, Heat, LayerHealth, Source, YearHeat

LayerName = Literal["flood", "heat", "ground_motion"]
RESULT_TYPES = {"flood": Flood, "heat": Heat, "ground_motion": GroundMotion}
DEFAULT_SOURCES = {
    "flood": Source(name="NASA JPL OPERA DSWx-S1", dates="", resolution_m=30, limitations=[
        "Passes are days apart and can miss a flood's peak.",
        "Radar misses water under trees and tall crops.",
        "Smooth surfaces such as runways and flat roofs can look like water.",
        "The delivered files do not record the complete date range of valid passes; wet dates alone do not establish that coverage.",
    ]),
    "heat": Source(name="Landsat Collection 2 surface temperature", dates="", resolution_m=30, limitations=[
        "Ground and roof surface temperature around noon, not air or indoor temperature.",
        "Clear days only; thermal detail is 100 m native, delivered at 30 m.",
        "Relative heat averages differences from each clear day's lowland median; it is not a difference from one county-wide composite median.",
        "Percentiles compare relative heat within lowland King County, not absolute temperature across the entire county.",
    ]),
    "ground_motion": Source(name="NASA JPL OPERA DISP-S1", dates="", resolution_m=30, limitations=[
        "Measured along the satellite's slanted view, not straight up and down.",
        "Slow movement only, not earthquake shaking.",
        "Readings can be unreliable in forests and farmland; reference dates change over time.",
        "The pipeline requests independent verification of the sign convention; do not interpret the sign as vertical sinking or rising.",
        "Velocity uses available reliable segments; missing displacement history does not necessarily invalidate velocity.",
    ]),
}


class MissingData(Exception):
    pass


class PipelineMetadata(BaseModel):
    model_config = ConfigDict(extra="ignore", allow_inf_nan=False)


class HeatDay(PipelineMetadata):
    date: date


class HeatStats(PipelineMetadata):
    years: list[int] = Field(min_length=1)
    recent_years: list[int] = Field(min_length=1)
    early_years: list[int] = Field(min_length=1)
    lowland_definition: str = Field(min_length=1)
    recent_relative_percentiles_f: list[float]
    dates_used: list[HeatDay] = Field(min_length=1)

    @model_validator(mode="after")
    def validate_history(self):
        if self.years != sorted(set(self.years)):
            raise ValueError("Heat years must be unique and increasing")
        if not set(self.recent_years + self.early_years) <= set(self.years):
            raise ValueError("Recent and early years must be present in the heat history")
        if not any(day.date.year in self.recent_years for day in self.dates_used):
            raise ValueError("Recent heat observations must have acquisition dates")
        points = self.recent_relative_percentiles_f
        if points and (len(points) != 101 or any(a > b for a, b in zip(points, points[1:]))):
            raise ValueError("Relative heat percentiles must contain 101 nondecreasing values")
        return self


class GroundStats(PipelineMetadata):
    node_dates: list[date] = Field(min_length=2)
    frame: str = Field(min_length=1)
    variable: str = Field(min_length=1)
    sign_note: str = Field(min_length=1)
    chain_warnings: list[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def ordered(self):
        if self.node_dates != sorted(set(self.node_dates)):
            raise ValueError("Displacement dates must be unique and increasing")
        return self


class RasterLayers:
    def __init__(self, data_dir: Path, ground_motion_enabled: bool = True):
        self.data_dir = data_dir
        self.ground_motion_enabled = ground_motion_enabled

    def files(self, layer: LayerName) -> list[Path]:
        if layer == "flood":
            return sorted((self.data_dir / "flood").glob("flood_history_*.tif"))
        name = {"heat": "heat_history.tif", "ground_motion": "ground_motion.tif"}[layer]
        return [self.data_dir / layer / name]

    def stats(self, layer: Literal["heat", "ground_motion"]):
        name = "heat_stats.json" if layer == "heat" else "ground_stats.json"
        path = self.data_dir / layer / name
        if not path.exists():
            raise MissingData(f"{layer} statistics are not installed yet.")
        model = HeatStats if layer == "heat" else GroundStats
        return model.model_validate_json(path.read_text())

    @staticmethod
    def layout(dataset, layer: LayerName, stats=None):
        expected = 4 if layer == "flood" else (
            4 + len(stats.years) if layer == "heat" else 2 + len(stats.node_dates)
        )
        if dataset.crs is None or dataset.count != expected:
            raise ValueError(f"Expected a CRS and {expected} bands for {layer}")
        if layer == "flood":
            date.fromisoformat(dataset.tags()["epoch"])
        if layer == "heat":
            years = [int(value) for value in dataset.tags()["years"].split(",")]
            if years != stats.years:
                raise ValueError("Heat TIFF years do not match heat statistics")

    def source(self, layer: LayerName) -> Source:
        source = DEFAULT_SOURCES[layer].model_copy(deep=True)
        if layer == "heat":
            stats = self.stats("heat")
            dates = sorted({day.date.isoformat() for day in stats.dates_used})
            source.dates = ", ".join(dates)
            source.limitations.append(f"Comparison area: {stats.lowland_definition}.")
            source.limitations.append(
                "Recent temperature and relative heat use years: " + ", ".join(map(str, stats.recent_years)) + "."
            )
        elif layer == "ground_motion":
            stats = self.stats("ground_motion")
            source.dates = f"{stats.node_dates[0].isoformat()} to {stats.node_dates[-1].isoformat()}"
            source.limitations.append(f"Frame {stats.frame}; displacement variable: {stats.variable}.")
            source.limitations.extend(stats.chain_warnings)
        return source

    def sample(self, path: Path, lat: float, lon: float, layer: LayerName, stats=None):
        """Read the containing pixel; keep per-band masks so history gaps stay optional."""
        with rasterio.open(path) as dataset:
            self.layout(dataset, layer, stats)
            xs, ys = transform("EPSG:4326", dataset.crs, [lon], [lat])
            row, col = dataset.index(xs[0], ys[0])
            if not (0 <= row < dataset.height and 0 <= col < dataset.width):
                return None, dataset.tags()
            values = dataset.read(window=Window(col, row, 1, 1), masked=True)[:, 0, 0]
            return np.ma.masked_invalid(values.astype(float)), dataset.tags()

    @staticmethod
    def value(pixel, index: int) -> float | None:
        if pixel is None or np.ma.is_masked(pixel[index]):
            return None
        return float(pixel[index])

    @staticmethod
    def wet_date(day: float, epoch: date) -> date | None:
        if day < 0 or day != int(day):
            raise ValueError("Wet dates must be nonnegative integer day numbers")
        return epoch + timedelta(days=int(day) - 1) if day else None

    def flood(self, lat: float, lon: float, source: Source) -> Flood:
        paths = self.files("flood")
        if not paths:
            raise MissingData("Flood history files are not installed yet.")
        candidates = []
        for path in paths:
            pixel, tags = self.sample(path, lat, lon, "flood")
            if any(self.value(pixel, i) is None for i in range(4)):
                continue
            valid, wet, first, last = map(float, pixel)
            if valid != int(valid) or wet != int(wet) or not 0 <= wet <= valid:
                raise ValueError("Invalid flood pass counts")
            epoch = date.fromisoformat(tags["epoch"])
            first_date, last_date = self.wet_date(first, epoch), self.wet_date(last, epoch)
            if wet > 0 and (not first_date or not last_date or first_date > last_date):
                raise ValueError("Wet observations need ordered first and last wet dates")
            if wet == 0 and (first_date is not None or last_date is not None):
                raise ValueError("Dry observations cannot have wet dates")
            status = ("not_enough_data" if valid < 10 else
                      "permanent_water" if wet >= valid / 2 else
                      "flooded" if wet else "no_flooding_seen")
            point_source = source.model_copy(deep=True)
            if first_date:
                point_source.dates = f"Wet observations at this point: {first_date} to {last_date}"
            candidates.append(Flood(status=status, observed_passes=int(valid), wet_passes=int(wet),
                                    first_wet=first_date, last_wet=last_date, source=point_source))
        if not candidates:
            raise MissingData("No valid flood observation covers this point.")
        return max(candidates, key=lambda result: result.observed_passes)

    def heat(self, lat: float, lon: float, source: Source) -> Heat:
        path = self.files("heat")[0]
        if not path.exists():
            raise MissingData("Heat history raster is not installed yet.")
        stats = self.stats("heat")
        pixel, _ = self.sample(path, lat, lon, "heat", stats)
        temperature, relative, days = (self.value(pixel, i) for i in (0, 1, 3))
        if temperature is None or relative is None or days is None or days < 1:
            raise MissingData("No valid recent heat observation covers this point.")
        if days != int(days):
            raise ValueError("Clear observation counts must be integers")
        relative /= 10
        points = stats.recent_relative_percentiles_f
        percentile = float(np.clip(np.searchsorted(points, relative), 0, 100)) if points else None
        early = self.value(pixel, 2)
        return Heat(
            status="ok", surface_temp_f=temperature / 10, recent_relative_f=relative,
            lowland_percentile=percentile, comparison_area=stats.lowland_definition,
            recent_years=stats.recent_years, early_years=stats.early_years, clear_days_used=int(days),
            change_since_early_f=round(relative - early / 10, 1) if early is not None else None,
            yearly_relative_f=[YearHeat(year=year, relative_f=value / 10 if value is not None else None)
                               for i, year in enumerate(stats.years)
                               for value in [self.value(pixel, i + 4)]],
            source=source,
        )

    def ground_motion(self, lat: float, lon: float, source: Source) -> GroundMotion:
        path = self.files("ground_motion")[0]
        if not path.exists():
            raise MissingData("Ground motion raster is not installed yet.")
        stats = self.stats("ground_motion")
        pixel, _ = self.sample(path, lat, lon, "ground_motion", stats)
        velocity, valid = self.value(pixel, 0), self.value(pixel, 1)
        if velocity is None or valid is None or valid == 0:
            raise MissingData("No reliable ground motion observation covers this point.")
        if valid != 1:
            raise ValueError("Ground motion valid flag must be zero or one")
        return GroundMotion(status="ok", velocity_mm_per_yr=velocity, source=source,
                            series_mm=[Displacement(date=day, mm=self.value(pixel, i + 2))
                                       for i, day in enumerate(stats.node_dates)])

    def lookup(self, layer: LayerName, lat: float, lon: float):
        result_type = RESULT_TYPES[layer]
        source = DEFAULT_SOURCES[layer].model_copy(deep=True)
        if layer == "ground_motion" and not self.ground_motion_enabled:
            return result_type(status="not_available", source=source,
                               message="Ground motion is not included in this release.")
        try:
            source = self.source(layer)
            return getattr(self, layer)(lat, lon, source)
        except MissingData as exc:
            return result_type(status="not_enough_data", source=source, message=str(exc))

    def health(self) -> dict[str, LayerHealth]:
        result = {}
        for layer in RESULT_TYPES:
            paths = self.files(layer)
            required = paths + ([self.data_dir / layer / (
                "heat_stats.json" if layer == "heat" else "ground_stats.json"
            )] if layer != "flood" else [])
            names = [str(path.relative_to(self.data_dir)) for path in required if path.exists()]
            if layer == "ground_motion" and not self.ground_motion_enabled:
                result[layer] = LayerHealth(status="disabled", files=names)
                continue
            try:
                if not paths or any(not path.exists() for path in required):
                    raise MissingData("Pipeline files are not installed yet.")
                stats = self.stats(layer) if layer != "flood" else None
                self.source(layer)
                for path in paths:
                    with rasterio.open(path) as dataset:
                        self.layout(dataset, layer, stats)
                message = "Full observation date coverage is not recorded in the flood files." if layer == "flood" else None
                result[layer] = LayerHealth(status="loaded", files=names, message=message)
            except MissingData as exc:
                result[layer] = LayerHealth(status="missing", files=names, message=str(exc))
            except Exception:
                result[layer] = LayerHealth(status="error", files=names, message="Layer files or metadata could not be read.")
        return result
