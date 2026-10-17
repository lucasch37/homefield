# Delivered data contract

The server reads the pipeline files now located in `server/data/`. These are prepared local datasets; the API performs no satellite downloads or processing. `DATA_DIR` defaults to this directory, independently of the process's working directory. An explicitly configured relative path is resolved against the working directory.

```text
data/
├── king_county.geojson
├── flood/
│   ├── flood_history_T10TET.tif
│   ├── flood_history_T10TFT.tif
│   └── flood_history_T10UFU.tif
├── heat/
│   ├── heat_history.tif
│   └── heat_stats.json
└── ground_motion/
    ├── ground_motion.tif
    └── ground_stats.json
```

The delivered rasters use EPSG:32610 and 30 m pixels. The API uses each file's actual CRS and geotransform to locate the containing pixel. Lookups use one pixel, with no neighborhood averaging. This differs from the separate reference scripts under the repository's `backend/`, which average neighborhoods for heat and ground motion. Those scripts are not imported by this server.

## County boundary

`king_county.geojson` is a WGS84 GeoJSON FeatureCollection containing Polygon or MultiPolygon geometries. Coordinate requests check this local boundary without a network call. Address requests use Census to geocode, then check the same polygon. Polygon holes are excluded; boundary edges are included. A malformed installed boundary produces a 502 rather than assuming the point is outside the county. If the file is absent, the server falls back to Census county geographies and FIPS `53033`.

## Flood

Each `flood/flood_history_<tile>.tif` has four bands:

1. Valid observation count.
2. Wet observation count.
3. First wet day number.
4. Last wet day number.

The TIFF's `epoch` tag contains an ISO date. Dates are **one-based**: `epoch + timedelta(days=day_number - 1)`. Zero means no wet date. The delivered files use epoch `2024-09-01`, uint16 values, and no nodata sentinel. Zero is valid and must not be masked. Wet counts must be integers from zero through the valid count; a wet pixel requires ordered nonzero first/last dates. A dry pixel must have zero wet dates.

Fewer than 10 valid passes returns `not_enough_data`; at least half wet returns `permanent_water`; any remaining wet pass returns `flooded`; otherwise the result is `no_flooding_seen`. Overlapping tiles are not summed: the valid reading with the most observations wins, with sorted filename order breaking ties.

These files do not include the complete acquisition date coverage. The API reports first/last wet dates when present, with `source.dates` explicitly labeling them as wet observations at that point. For dry pixels, `source.dates` stays blank. Every flood response includes the missing-coverage limitation. The epoch is a date-decoding reference, not evidence of acquisition coverage. A future pipeline manifest should record the actual pass dates and coverage.

## Heat

`heat/heat_history.tif` contains 17 bands in the current delivery:

1. Recent surface temperature, averaged over clear observations in `recent_years`.
2. Recent relative heat, averaging each observation's difference from that day's lowland median.
3. Early-period relative heat, using `early_years`.
4. Count of clear observations across the full history; this is an integer count.
5. Onward: relative heat for each entry of `years`, in order.

All temperature bands store **tenths of a degree Fahrenheit** and are divided by ten. Band 4 is not scaled. Nodata is `-32768`. Recent surface temperature, recent relative heat, and a positive clear observation count are required. Missing early/yearly readings remain null and do not invalidate the recent reading. The `years` TIFF tag must match the statistics file and the band count must equal `4 + len(years)`.

`heat/heat_stats.json` supplies:

- `years`, `recent_years`, `early_years`: year lists. History years are unique and increasing.
- `lowland_definition`: the actual comparison area's definition.
- `recent_relative_percentiles_f`: 101 nondecreasing Fahrenheit values at percentiles 0 through 100. Duplicate values are allowed; an empty list means percentile information is unavailable.
- `dates_used`: records containing actual acquisition `date` values and optional pipeline provenance such as daily medians and clear fractions.

The API matches the pipeline reference lookup by taking the left insertion index of the pixel's relative heat in the percentile array, clamped to 0–100. It returns `surface_temp_f`, `recent_relative_f`, `lowland_percentile`, `comparison_area`, period year lists, `clear_days_used`, `change_since_early_f`, and `yearly_relative_f`.

`county_percentile` and `diff_from_median_f` remain null for compatibility: the delivered statistics describe relative heat in lowland King County, not absolute temperatures against a county-wide composite median. Frontend and AI consumers must use the new named comparison fields and show the comparison area. Source dates list actual acquisition dates for the full returned history, with recent years identified separately.

## Ground motion

`ground_motion/ground_motion.tif` contains 11 bands in the current delivery:

1. Signed line-of-sight velocity in millimeters per year.
2. Reliability flag: 1 usable, 0 unreliable.
3. Onward: cumulative displacement in millimeters at the dates in `node_dates`.

Nodata is NaN. Only the first two bands determine whether velocity is usable. A zero velocity with flag one is valid. Missing history values remain null in `series_mm`; they do not discard a valid velocity. Band count must equal `2 + len(node_dates)`.

`ground_motion/ground_stats.json` supplies `node_dates` (unique, increasing ISO dates), `frame`, `variable`, `sign_note`, and optional `chain_warnings`. Source dates use the first/last node dates. Chain warnings are carried in the limitations. The delivered sign note requests verification before user interpretation, so the API returns `sign_convention_verified: false` and does not label signed velocity as vertical sinking or rising. No unsupported noise threshold or safety label is inferred.

## Readiness and installation

`metadata.json` is no longer required. Product identities and standard limitations are defined by the readers for these documented pipeline formats; acquisition dates and frame metadata come from the delivered files. Missing files return `not_enough_data`. Corrupt rasters or invalid metadata return `error` only for the affected layer. Ground motion may be disabled with `GROUND_MOTION_ENABLED=false`.

`/health` lists paths relative to `DATA_DIR`, checks required files, CRS, band layouts, TIFF tags, and statistics, and reports missing or invalid layers independently. A loaded flood layer still includes a warning about absent full observation dates. Health does not exhaustively validate every pixel or perform county containment.

Write replacement files to temporary names and atomically rename them after completion. For a coherent update across multiple files, deploy an entire versioned data directory and restart against it. Final prepared files remain trackable by Git and are included in the Docker image; raw downloads and intermediate caches are ignored.
