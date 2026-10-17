import time

import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.geocode import GeocodingError, Location
from app.layers import RasterLayers
from app.main import create_app


class FixedGeocoder:
    def __init__(self, inside=True, error=None):
        self.inside = inside
        self.error = error

    async def locate(self, address, lat, lon):
        if self.error:
            raise self.error
        return Location(address, lat if lat is not None else 47.664,
                        lon if lon is not None else -121.92, self.inside)


@pytest.fixture
def api_client(prepared_data):
    with TestClient(create_app(Settings(data_dir=prepared_data), geocoder=FixedGeocoder())) as client:
        yield client


def test_address_and_coordinates_read_prepared_files(api_client):
    by_address = api_client.get("/hazards", params={"address": "Example"})
    by_coords = api_client.get("/hazards", params={"lat": 47.664, "lon": -121.92})
    assert by_address.status_code == by_coords.status_code == 200
    assert by_address.json()["hazards"] == by_coords.json()["hazards"]
    report = by_address.json()
    assert report["in_king_county"] is True
    flood = report["hazards"]["flood"]
    assert flood["status"] == "flooded"
    assert flood["observed_passes"] == 140
    assert flood["wet_passes"] == 1
    assert flood["first_wet"] == flood["last_wet"] == "2025-12-10"
    assert report["hazards"]["heat"]["surface_temp_f"] == 95
    assert report["hazards"]["ground_motion"]["velocity_mm_per_yr"] == -2.5
    for layer in report["hazards"].values():
        assert layer["action"]
        assert layer["source"]["name"]
        assert layer["source"]["limitations"]


def test_health_lists_prepared_files(api_client):
    health = api_client.get("/health").json()
    assert health["status"] == "ok"
    assert all(layer["status"] == "loaded" for layer in health["layers"].values())
    assert health["layers"]["flood"]["files"] == ["flood/flood_history_TEST.tif"]


def test_response_schema_has_only_pipeline_fields(api_client):
    report = api_client.get("/hazards?lat=47.664&lon=-121.92").json()
    assert set(report) == {"address", "lat", "lon", "in_king_county", "hazards", "message"}
    health = api_client.get("/health").json()
    assert set(health) == {"status", "layers"}
    schema = api_client.get("/openapi.json").json()["components"]["schemas"]
    assert set(schema["Report"]["properties"]) == set(report)
    assert set(schema["Health"]["properties"]) == set(health)


@pytest.mark.parametrize("params", [
    {}, {"address": " "}, {"address": "x" * 501}, {"lat": 47}, {"lon": -122},
    {"address": "x", "lat": 47, "lon": -122}, {"address": "x", "lat": 47},
    {"lat": 91, "lon": 0}, {"lat": 0, "lon": -181},
    {"lat": "nan", "lon": 0}, {"lat": 0, "lon": "inf"}, {"lat": "wrong", "lon": 0},
])
def test_invalid_queries(api_client, params):
    assert api_client.get("/hazards", params=params).status_code == 422


def test_real_raster_report(prepared_data):
    with TestClient(create_app(Settings(data_dir=prepared_data), geocoder=FixedGeocoder())) as client:
        report = client.get("/hazards?lat=47.664&lon=-121.92").json()
        assert report["hazards"]["flood"]["status"] == "flooded"
        assert report["hazards"]["heat"]["lowland_percentile"] == 75
        assert report["hazards"]["heat"]["recent_relative_f"] == 5
        assert report["hazards"]["ground_motion"]["velocity_mm_per_yr"] == -2.5
        assert client.get("/health").json()["status"] == "ok"


def test_outside_county_skips_layers(tmp_path):
    class MustNotRead:
        def lookup(self, *args):
            pytest.fail("Outside-county requests must not read hazards")

    with TestClient(create_app(Settings(data_dir=tmp_path), geocoder=FixedGeocoder(False),
                               layers=MustNotRead())) as client:
        response = client.get("/hazards?lat=0&lon=0")
        assert response.status_code == 200
        assert response.json()["in_king_county"] is False
        assert response.json()["hazards"] is None
        assert "King County" in response.json()["message"]


def test_no_files_returns_no_data(tmp_path):
    with TestClient(create_app(Settings(data_dir=tmp_path), geocoder=FixedGeocoder())) as client:
        report = client.get("/hazards?address=Example").json()
        assert all(layer["status"] == "not_enough_data" for layer in report["hazards"].values())
        assert report["hazards"]["heat"]["surface_temp_f"] is None
        assert report["hazards"]["flood"]["observed_passes"] is None
        assert client.get("/health").json()["status"] == "degraded"


def test_corrupt_layer_does_not_break_other_layers(prepared_data):
    (prepared_data / "heat" / "heat_history.tif").write_bytes(b"not a geotiff")
    with TestClient(create_app(Settings(data_dir=prepared_data), geocoder=FixedGeocoder())) as client:
        response = client.get("/hazards?lat=47.664&lon=-121.92")
        assert response.status_code == 200
        hazards = response.json()["hazards"]
        assert hazards["flood"]["status"] == "flooded"
        assert hazards["heat"]["status"] == "error"
        assert hazards["heat"]["source"]["dates"]
        assert hazards["ground_motion"]["status"] == "ok"
        assert str(prepared_data) not in response.text
        assert client.get("/health").json()["layers"]["heat"]["status"] == "error"


def test_deleted_layer_only_loses_its_card(prepared_data):
    (prepared_data / "heat" / "heat_history.tif").unlink()
    with TestClient(create_app(Settings(data_dir=prepared_data), geocoder=FixedGeocoder())) as client:
        hazards = client.get("/hazards?lat=47.664&lon=-121.92").json()["hazards"]
        assert hazards["heat"]["status"] == "not_enough_data"
        assert hazards["flood"]["status"] == "flooded"
        assert hazards["ground_motion"]["status"] == "ok"


def test_disabled_ground_motion(prepared_data):
    settings = Settings(data_dir=prepared_data, ground_motion_enabled=False)
    with TestClient(create_app(settings, geocoder=FixedGeocoder())) as client:
        hazards = client.get("/hazards?lat=47.664&lon=-121.92").json()["hazards"]
        assert hazards["ground_motion"]["status"] == "not_available"
        assert client.get("/health").json()["layers"]["ground_motion"]["status"] == "disabled"


@pytest.mark.parametrize("status", [404, 502, 504])
def test_geocoder_errors(status, tmp_path):
    with TestClient(create_app(Settings(data_dir=tmp_path),
                               geocoder=FixedGeocoder(error=GeocodingError(status, "Friendly message")))) as client:
        response = client.get("/hazards?address=Example")
        assert response.status_code == status
        assert response.json()["detail"] == "Friendly message"


def test_layer_timeout_isolated_and_parallel(prepared_data):
    class SlowLayers(RasterLayers):
        def lookup(self, layer, lat, lon):
            if layer == "heat":
                time.sleep(0.3)
            return super().lookup(layer, lat, lon)

    with TestClient(create_app(Settings(layer_timeout_seconds=0.1), geocoder=FixedGeocoder(),
                               layers=SlowLayers(prepared_data))) as client:
        hazards = client.get("/hazards?lat=47.664&lon=-121.92").json()["hazards"]
        assert hazards["heat"]["status"] == "error"
        assert hazards["flood"]["status"] == "flooded"


def test_all_layers_start_concurrently(prepared_data):
    import threading

    barrier = threading.Barrier(3, timeout=1)

    class ConcurrentLayers(RasterLayers):
        def lookup(self, layer, lat, lon):
            barrier.wait()
            return super().lookup(layer, lat, lon)

    with TestClient(create_app(Settings(), geocoder=FixedGeocoder(), layers=ConcurrentLayers(prepared_data))) as client:
        hazards = client.get("/hazards?lat=47.664&lon=-121.92").json()["hazards"]
        assert hazards["flood"]["status"] == "flooded"
        assert hazards["heat"]["status"] == "ok"


def test_geocoder_outer_deadline(tmp_path):
    import asyncio

    class SlowGeocoder:
        async def locate(self, *args):
            await asyncio.sleep(1)

    with TestClient(create_app(Settings(data_dir=tmp_path, geocoder_timeout_seconds=0.01),
                               geocoder=SlowGeocoder())) as client:
        assert client.get("/hazards?address=Example").status_code == 504


def test_openapi_and_cors(api_client):
    schema = api_client.get("/openapi.json").json()
    assert "/health" in schema["paths"] and "/hazards" in schema["paths"]
    response = api_client.options("/hazards", headers={
        "Origin": "http://localhost:3000", "Access-Control-Request-Method": "GET"
    })
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"
    denied = api_client.options("/hazards", headers={
        "Origin": "https://untrusted.example", "Access-Control-Request-Method": "GET"
    })
    assert "access-control-allow-origin" not in denied.headers
