import httpx
import pytest

from app.geocode import CensusGeocoder, GeocodingError


@pytest.mark.parametrize("county,inside", [
    ({"GEOID": "53033"}, True),
    ({"STATE": "53", "COUNTY": "033"}, True),
    ({"GEOID": "53061"}, False),
    ({"GEOID": "12033", "NAME": "King County"}, False),
])
async def test_address_geographies_and_cache(county, inside):
    calls = []

    def handler(request):
        calls.append(request)
        assert request.url.path.endswith("/geographies/onelineaddress")
        assert request.url.params["layers"] == "Counties"
        assert request.url.params["vintage"] == "Current_Current"
        return httpx.Response(200, json={"result": {"addressMatches": [{
            "matchedAddress": "SYNTHETIC ADDRESS", "coordinates": {"x": -121.92, "y": 47.664},
            "geographies": {"Counties": [county]},
        }]}})

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        geocoder = CensusGeocoder(client)
        result = await geocoder.locate("Example", None, None)
        again = await geocoder.locate("example", None, None)
    assert result == again
    assert result.in_king_county is inside
    assert result.lat == 47.664 and result.lon == -121.92
    assert len(calls) == 1


async def test_coordinate_county_check():
    def handler(request):
        assert request.url.path.endswith("/coordinates")
        assert request.url.params["x"] == "-121.92"
        assert request.url.params["y"] == "47.664"
        return httpx.Response(200, json={"result": {"geographies": {"Counties": [{"GEOID": "53033"}]}}})

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        result = await CensusGeocoder(client).locate(None, 47.664, -121.92)
    assert result.in_king_county and result.address is None


@pytest.mark.parametrize("payload,status", [
    ({"result": {"addressMatches": []}}, 404),
    ({}, 502),
    ({"result": {"addressMatches": [{"coordinates": {"x": 0, "y": 0},
                                     "matchedAddress": "Example", "geographies": {}}]}}, 502),
])
async def test_bad_or_unmatched_address(payload, status):
    async with httpx.AsyncClient(transport=httpx.MockTransport(lambda request: httpx.Response(200, json=payload))) as client:
        with pytest.raises(GeocodingError) as error:
            await CensusGeocoder(client).locate("Example", None, None)
    assert error.value.status_code == status


@pytest.mark.parametrize("timeout", [True, False])
async def test_upstream_failure(timeout):
    def handler(request):
        if timeout:
            raise httpx.ReadTimeout("test", request=request)
        return httpx.Response(503)

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        with pytest.raises(GeocodingError) as error:
            await CensusGeocoder(client).locate("Example", None, None)
    assert error.value.status_code == (504 if timeout else 502)


async def test_ocean_is_outside():
    async with httpx.AsyncClient(transport=httpx.MockTransport(lambda request: httpx.Response(
        200, json={"result": {"geographies": {"Counties": []}}}
    ))) as client:
        result = await CensusGeocoder(client).locate(None, 0, 0)
    assert result.in_king_county is False


@pytest.mark.parametrize("counties", [[{}], [None], [{"GEOID": "invalid"}]])
async def test_missing_county_fips_is_not_assumed_outside(counties):
    async with httpx.AsyncClient(transport=httpx.MockTransport(lambda request: httpx.Response(
        200, json={"result": {"geographies": {"Counties": counties}}}
    ))) as client:
        with pytest.raises(GeocodingError) as error:
            await CensusGeocoder(client).locate(None, 47.664, -121.92)
    assert error.value.status_code == 502
