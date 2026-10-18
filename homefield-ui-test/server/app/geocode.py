import asyncio
import time
from collections import OrderedDict
from dataclasses import dataclass
from pathlib import Path

import httpx

from .boundary import CountyBoundary


class GeocodingError(Exception):
    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        self.message = message


@dataclass(frozen=True)
class Location:
    address: str | None
    lat: float
    lon: float
    in_king_county: bool


class CensusGeocoder:
    """County geographies are returned in the same request as the address match."""

    base_url = "https://geocoding.geo.census.gov/geocoder/geographies"

    def __init__(self, client: httpx.AsyncClient, boundary_path: Path | None = None):
        self.client = client
        self.boundary = CountyBoundary(boundary_path) if boundary_path is not None else None
        self.cache: OrderedDict[tuple, tuple[float, Location]] = OrderedDict()

    @staticmethod
    def _in_county(geographies: dict) -> bool:
        counties = geographies.get("Counties")
        if not isinstance(counties, list):
            raise ValueError("County lookup is missing")
        # Empty means the coordinate is not in any US county (e.g. ocean).
        for county in counties:
            if not isinstance(county, dict):
                raise ValueError("Invalid county geography")
            geoid = county.get("GEOID")
            if geoid is None:
                state, code = county.get("STATE"), county.get("COUNTY")
                if not isinstance(state, str) or not isinstance(code, str) or len(state) != 2 or len(code) != 3:
                    raise ValueError("County FIPS is missing")
                geoid = state + code
            if not isinstance(geoid, str) or len(geoid) != 5 or not geoid.isdigit():
                raise ValueError("Invalid county FIPS")
            if geoid == "53033":
                return True
        return False

    async def locate(self, address: str | None, lat: float | None, lon: float | None) -> Location:
        key = (address.casefold() if address else None, lat, lon)
        cached = self.cache.get(key)
        if cached and cached[0] > time.monotonic():
            self.cache.move_to_end(key)
            return cached[1]
        if address is None and self.boundary is not None and self.boundary.path.exists():
            inside = await self._local_county(lat, lon)
            return Location(None, lat, lon, inside)
        params = {"benchmark": "Public_AR_Current", "vintage": "Current_Current",
                  "format": "json", "layers": "Counties"}
        if address:
            endpoint = "onelineaddress"
            params["address"] = address
        else:
            endpoint = "coordinates"
            params.update(x=lon, y=lat)
        try:
            response = await self.client.get(f"{self.base_url}/{endpoint}", params=params)
            response.raise_for_status()
            result = response.json()["result"]
            if address:
                matches = result["addressMatches"]
                if not matches:
                    raise GeocodingError(404, "Address not found. Try a complete street address, city, and ZIP code.")
                match = matches[0]
                lat, lon = float(match["coordinates"]["y"]), float(match["coordinates"]["x"])
                if not (-90 <= lat <= 90 and -180 <= lon <= 180):
                    raise ValueError("Invalid coordinates")
                inside = (await self._local_county(lat, lon)
                          if self.boundary is not None and self.boundary.path.exists()
                          else self._in_county(match["geographies"]))
                location = Location(match["matchedAddress"], lat, lon, inside)
            else:
                location = Location(None, lat, lon, self._in_county(result["geographies"]))
        except httpx.TimeoutException as exc:
            raise GeocodingError(504, "Address lookup timed out. Please try again.") from exc
        except (httpx.HTTPError, ValueError, KeyError, TypeError, IndexError) as exc:
            raise GeocodingError(502, "Address and county lookup is unavailable right now. Please try again.") from exc
        self.cache[key] = (time.monotonic() + 300, location)
        self.cache.move_to_end(key)
        while len(self.cache) > 256:
            self.cache.popitem(last=False)
        return location

    async def _local_county(self, lat: float, lon: float) -> bool:
        try:
            return await asyncio.to_thread(self.boundary.contains, lat, lon)
        except (OSError, ValueError, KeyError, TypeError) as exc:
            raise GeocodingError(502, "The local county boundary could not be read. Please try again later.") from exc
