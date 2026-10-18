Real `GET /hazards?lat=..&lon=..` responses from `server/` reading the delivered files in `server/data/`.
Coordinate lookups have no street address, so `address` is `null`. Regenerate them by running the
server locally and saving `curl "localhost:8000/hazards?lat=<lat>&lon=<lon>"` for each point:

| File | Point |
| --- | --- |
| `carnation.json` | 47.664, -121.92 (December 10, 2025 flood) |
| `lake_washington.json` | 47.62, -122.26 |
| `sodo.json` | 47.58, -122.335 |
| `discovery_park.json` | 47.66, -122.42 |
| `uw_union_bay.json` | 47.65626, -122.2981 |
| `seattle_center.json` | 47.6205, -122.3493 |
| `outside_portland.json` | 45.5, -122.6 |
