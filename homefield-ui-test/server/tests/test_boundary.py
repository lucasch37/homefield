import json

import httpx
import pytest

from app.boundary import CountyBoundary
from app.geocode import CensusGeocoder, GeocodingError


async def test_local_coordinate_check_does_not_call_census(prepared_data):
    def unexpected_request(request):
        pytest.fail("Coordinates with a local boundary must not require Census")

    async with httpx.AsyncClient(transport=httpx.MockTransport(unexpected_request)) as client:
        geocoder = CensusGeocoder(client, prepared_data / "king_county.geojson")
        assert (await geocoder.locate(None, 47.664, -121.92)).in_king_county
        assert not (await geocoder.locate(None, 0, 0)).in_king_county


async def test_address_uses_local_boundary_after_geocoding(prepared_data):
    # Local point containment is authoritative when the boundary file is installed.
    def handler(request):
        return httpx.Response(200, json={"result": {"addressMatches": [{
            "matchedAddress": "Test address", "coordinates": {"x": -121.92, "y": 47.664},
        }]}})

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        location = await CensusGeocoder(client, prepared_data / "king_county.geojson").locate("Test", None, None)
    assert location.in_king_county


async def test_corrupt_local_boundary_is_not_assumed_outside(prepared_data):
    path = prepared_data / "king_county.geojson"
    path.write_text("invalid json")
    async with httpx.AsyncClient() as client:
        with pytest.raises(GeocodingError) as error:
            await CensusGeocoder(client, path).locate(None, 47.664, -121.92)
    assert error.value.status_code == 502


def test_polygon_holes_and_edges(tmp_path):
    path = tmp_path / "king_county.geojson"
    path.write_text(json.dumps({"type": "FeatureCollection", "features": [{
        "type": "Feature", "properties": {}, "geometry": {
            "type": "Polygon", "coordinates": [
                [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
                [[4, 4], [6, 4], [6, 6], [4, 6], [4, 4]],
            ]
        }
    }]}))
    boundary = CountyBoundary(path)
    assert boundary.contains(1, 1)
    assert boundary.contains(0, 5)
    assert not boundary.contains(5, 5)
    assert not boundary.contains(11, 11)


def test_multipolygon(tmp_path):
    path = tmp_path / "king_county.geojson"
    path.write_text(json.dumps({"type": "FeatureCollection", "features": [{
        "type": "Feature", "properties": {}, "geometry": {
            "type": "MultiPolygon", "coordinates": [
                [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
                [[[2, 2], [3, 2], [3, 3], [2, 3], [2, 2]]],
            ]
        }
    }]}))
    boundary = CountyBoundary(path)
    assert boundary.contains(0.5, 0.5) and boundary.contains(2.5, 2.5)
    assert not boundary.contains(1.5, 1.5)
