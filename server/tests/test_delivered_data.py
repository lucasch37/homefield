"""Regression checks against the delivered files, without network calls or mutations."""

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
pytestmark = pytest.mark.skipif(not DATA_DIR.exists(), reason="Delivered dataset is not installed")


@pytest.fixture
def delivered_client():
    with TestClient(create_app(Settings(data_dir=DATA_DIR))) as client:
        yield client


def test_delivered_files_load(delivered_client):
    result = delivered_client.get("/health").json()
    assert result["status"] == "ok"
    assert all(layer["status"] == "loaded" for layer in result["layers"].values())
    assert len(result["layers"]["flood"]["files"]) == 3


def test_carnation_december_flood(delivered_client):
    response = delivered_client.get("/hazards?lat=47.664&lon=-121.92")
    assert response.status_code == 200
    result = response.json()
    assert result["in_king_county"]
    flood = result["hazards"]["flood"]
    assert flood["status"] == "flooded"
    assert flood["first_wet"] <= "2025-12-10" <= flood["last_wet"]
    assert result["hazards"]["heat"]["status"] == "ok"


def test_lake_water_and_missing_heat(delivered_client):
    result = delivered_client.get("/hazards?lat=47.62&lon=-122.26").json()
    assert result["hazards"]["flood"]["status"] == "permanent_water"
    assert result["hazards"]["heat"]["status"] == "not_enough_data"


def test_uw_velocity_and_heat_history(delivered_client):
    response = delivered_client.get("/hazards?lat=47.65626&lon=-122.2981")
    assert response.status_code == 200
    result = response.json()["hazards"]
    assert result["ground_motion"]["status"] == "ok"
    assert result["ground_motion"]["velocity_mm_per_yr"] is not None
    assert result["ground_motion"]["sign_convention_verified"] is False
    assert len(result["ground_motion"]["series_mm"]) == 9
    assert len(result["heat"]["yearly_relative_f"]) == 13
    assert result["heat"]["county_percentile"] is None
    assert result["heat"]["lowland_percentile"] is not None


def test_outside_county(delivered_client):
    result = delivered_client.get("/hazards?lat=0&lon=0").json()
    assert result["in_king_county"] is False
    assert result["hazards"] is None
