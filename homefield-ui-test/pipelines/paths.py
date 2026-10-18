"""Shared data and cache locations for all offline tools."""

import os
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_ROOT = Path(os.getenv("DATA_DIR", str(REPO_ROOT / "server" / "data"))).expanduser().resolve()
CACHE_ROOT = Path(os.getenv("PIPELINE_CACHE_DIR", str(REPO_ROOT / "pipelines" / ".cache"))).expanduser().resolve()
