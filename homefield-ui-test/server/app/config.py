import os
from dataclasses import dataclass, field
from pathlib import Path


def env_bool(name: str, default: bool) -> bool:
    value = os.getenv(name, str(default)).lower()
    if value not in {"true", "false", "1", "0"}:
        raise ValueError(f"{name} must be true or false")
    return value in {"true", "1"}


@dataclass(frozen=True)
class Settings:
    data_dir: Path = field(default_factory=lambda: Path(os.getenv(
        "DATA_DIR", str(Path(__file__).resolve().parent.parent / "data")
    )))
    ground_motion_enabled: bool = field(
        default_factory=lambda: env_bool("GROUND_MOTION_ENABLED", True)
    )
    cors_origins: tuple[str, ...] = field(
        default_factory=lambda: tuple(
            origin.strip()
            for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
            if origin.strip()
        )
    )
    geocoder_timeout_seconds: float = field(
        default_factory=lambda: float(os.getenv("GEOCODER_TIMEOUT_SECONDS", "5"))
    )
    layer_timeout_seconds: float = field(
        default_factory=lambda: float(os.getenv("LAYER_TIMEOUT_SECONDS", "2"))
    )

    def __post_init__(self):
        if not 0 < self.geocoder_timeout_seconds <= 6:
            raise ValueError("GEOCODER_TIMEOUT_SECONDS must be in (0, 6]")
        if not 0 < self.layer_timeout_seconds <= 3:
            raise ValueError("LAYER_TIMEOUT_SECONDS must be in (0, 3]")
