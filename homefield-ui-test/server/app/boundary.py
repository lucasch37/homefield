"""Exact county containment using the delivered GeoJSON, including polygon holes."""

import json
from pathlib import Path

from shapely.geometry import Point, shape
from shapely.ops import unary_union


class CountyBoundary:
    def __init__(self, path: Path):
        self.path = path
        self._mtime = None
        self._geometry = None

    def contains(self, lat: float, lon: float) -> bool:
        mtime = self.path.stat().st_mtime_ns
        if self._mtime != mtime:
            document = json.loads(self.path.read_text())
            if document.get("type") != "FeatureCollection" or not document.get("features"):
                raise ValueError("County boundary must be a nonempty GeoJSON FeatureCollection")
            geometries = [shape(feature["geometry"]) for feature in document["features"]]
            if any(geometry.geom_type not in {"Polygon", "MultiPolygon"}
                   or geometry.is_empty or not geometry.is_valid for geometry in geometries):
                raise ValueError("Invalid county polygon")
            geometry = unary_union(geometries)
            self._geometry, self._mtime = geometry, mtime
        # Include the actual boundary line; do not approximate it with a bounding box.
        return bool(self._geometry.covers(Point(lon, lat)))
