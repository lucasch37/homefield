from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class Model(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)


class Source(Model):
    name: str = Field(min_length=1)
    dates: str
    resolution_m: float = Field(gt=0)
    limitations: list[str] = Field(min_length=1)


class Flood(Model):
    status: Literal["flooded", "no_flooding_seen", "permanent_water", "not_enough_data", "error"]
    observed_passes: int | None = Field(default=None, ge=0)
    wet_passes: int | None = Field(default=None, ge=0)
    first_wet: date | None = None
    last_wet: date | None = None
    source: Source
    action: str = "Sign up for King County flood alerts."
    message: str | None = None


class YearHeat(Model):
    year: int
    relative_f: float | None


class Heat(Model):
    status: Literal["ok", "not_enough_data", "error"]
    surface_temp_f: float | None = None
    county_percentile: float | None = Field(
        default=None, ge=0, le=100, deprecated=True,
        description="Unavailable in the delivered dataset. Use lowland_percentile for relative heat."
    )
    diff_from_median_f: float | None = Field(
        default=None, deprecated=True,
        description="Unavailable in the delivered dataset. recent_relative_f uses daily lowland medians."
    )
    recent_relative_f: float | None = None
    lowland_percentile: float | None = Field(default=None, ge=0, le=100)
    comparison_area: str | None = None
    recent_years: list[int] = Field(default_factory=list)
    early_years: list[int] = Field(default_factory=list)
    clear_days_used: int | None = Field(
        default=None, ge=0, description="Clear observations across the full history, not just recent years."
    )
    change_since_early_f: float | None = None
    yearly_relative_f: list[YearHeat] = Field(default_factory=list)
    source: Source
    action: str = "Find local cooling centers and ways to keep your home cool."
    message: str | None = None


class Displacement(Model):
    date: date
    mm: float | None


class GroundMotion(Model):
    status: Literal["ok", "not_enough_data", "error", "not_available"]
    velocity_mm_per_yr: float | None = None
    series_mm: list[Displacement] = Field(default_factory=list)
    sign_convention_verified: bool = False
    source: Source
    action: str = "Watch for new foundation or wall cracks and ask your landlord or an inspector."
    message: str | None = None


class Hazards(Model):
    flood: Flood
    heat: Heat
    ground_motion: GroundMotion


class Report(Model):
    address: str | None
    lat: float
    lon: float
    in_king_county: bool
    hazards: Hazards | None = None
    message: str | None = None


class LayerHealth(Model):
    status: Literal["loaded", "missing", "error", "disabled"]
    files: list[str]
    message: str | None = None


class Health(Model):
    status: Literal["ok", "degraded"]
    layers: dict[str, LayerHealth]
