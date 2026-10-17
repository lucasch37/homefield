"""Exercise relocated tools without downloads or changes to delivered datasets."""

import json
import os
from pathlib import Path
import subprocess
import sys

import numpy as np
import pytest
import rasterio
from rasterio.transform import from_origin

from pipelines.paths import CACHE_ROOT, DATA_ROOT, REPO_ROOT


@pytest.mark.parametrize('module', [
    'pipelines.builders.build_flood_history',
    'pipelines.builders.build_heat',
    'pipelines.builders.build_ground_motion',
])
def test_builder_help_is_offline(module):
    result = subprocess.run([sys.executable, '-m', module, '--help'], cwd=REPO_ROOT,
                            capture_output=True, text=True, timeout=15)
    assert result.returncode == 0, result.stderr
    assert 'usage:' in result.stdout


def test_default_paths_are_independent_of_working_directory(tmp_path):
    environment = os.environ.copy()
    environment.pop('DATA_DIR', None)
    environment.pop('PIPELINE_CACHE_DIR', None)
    script = (
        'import sys,json; sys.path.insert(0, sys.argv[1]); '
        'from pipelines.paths import DATA_ROOT,CACHE_ROOT; '
        'print(json.dumps([str(DATA_ROOT),str(CACHE_ROOT)]))'
    )
    result = subprocess.run([sys.executable, '-c', script, str(REPO_ROOT)], cwd=tmp_path,
                            env=environment, capture_output=True, text=True, check=True)
    assert json.loads(result.stdout) == [str(REPO_ROOT / 'server/data'), str(REPO_ROOT / 'pipelines/.cache')]


def test_path_overrides(tmp_path):
    environment = os.environ | {'DATA_DIR': str(tmp_path / 'prepared'), 'PIPELINE_CACHE_DIR': str(tmp_path / 'cache')}
    script = 'from pipelines.paths import DATA_ROOT,CACHE_ROOT; print(DATA_ROOT); print(CACHE_ROOT)'
    result = subprocess.run([sys.executable, '-c', script], cwd=REPO_ROOT,
                            env=environment, capture_output=True, text=True, check=True)
    assert result.stdout.splitlines() == [str(tmp_path / 'prepared'), str(tmp_path / 'cache')]


def test_builder_destinations_match_server_layout():
    from pipelines.builders import build_flood_history, build_heat, build_ground_motion

    assert build_flood_history.OUT_DIR == DATA_ROOT / 'flood'
    assert build_heat.OUT_DIR == DATA_ROOT / 'heat'
    assert build_ground_motion.OUT_DIR == DATA_ROOT / 'ground_motion'
    assert build_flood_history.DATA_DIR.is_relative_to(CACHE_ROOT)
    assert build_heat.CACHE_DIR.is_relative_to(CACHE_ROOT)
    assert build_ground_motion.CACHE_DIR.is_relative_to(CACHE_ROOT)


def test_local_flood_build_preserves_pipeline_encoding(tmp_path, monkeypatch):
    from pipelines.builders import build_flood_history as builder

    output = tmp_path / 'prepared/flood'
    monkeypatch.setattr(builder, 'OUT_DIR', output)
    input_path = tmp_path / 'OPERA_T10TET_20251210T200000Z_20251211T200000Z_B01_WTR.tif'
    with rasterio.open(input_path, 'w', driver='GTiff', width=2, height=2, count=1,
                       dtype='uint8', crs='EPSG:32610', transform=from_origin(550000, 5300000, 30, 30)) as dst:
        dst.write(np.array([[0, 1], [3, 250]], dtype='uint8'), 1)
    builder.build([str(input_path)])
    with rasterio.open(output / 'flood_history_T10TET.tif') as src:
        values = src.read()
        assert src.tags()['epoch'] == builder.EPOCH.isoformat()
        assert src.nodata is None
        np.testing.assert_array_equal(values[0], [[1, 1], [1, 0]])
        np.testing.assert_array_equal(values[1], [[0, 1], [1, 0]])
        assert values[2, 0, 1] == builder.local_day('20251210T200000')
        assert values[3, 0, 1] == values[2, 0, 1]


def test_heat_boundary_is_written_to_shared_root(tmp_path, monkeypatch):
    from pipelines.builders import build_heat as builder

    geometry = {'type': 'Polygon', 'coordinates': [[[0, 0], [1, 0], [1, 1], [0, 0]]]}
    document = {'type': 'FeatureCollection', 'features': [
        {'type': 'Feature', 'properties': {'NAME': 'Test boundary'}, 'geometry': geometry}
    ]}

    class Response:
        def json(self):
            return document

    monkeypatch.setattr(builder, 'DATA_ROOT', tmp_path / 'prepared')
    monkeypatch.setattr(builder, 'OUT_DIR', tmp_path / 'prepared/heat')
    monkeypatch.setattr(builder, 'get', lambda *args, **kwargs: Response())
    assert builder.county_geometry() == geometry
    assert json.loads((tmp_path / 'prepared/king_county.geojson').read_text()) == document
    assert not (tmp_path / 'prepared/heat/king_county.geojson').exists()


def test_inspection_uses_shared_data():
    from pipelines.validation import flood_lookup, heat_lookup, ground_lookup

    assert flood_lookup.HISTORY_DIR == DATA_ROOT / 'flood'
    assert heat_lookup.DATA_DIR == DATA_ROOT / 'heat'
    assert ground_lookup.DATA_DIR == DATA_ROOT / 'ground_motion'


@pytest.mark.skipif(not (DATA_ROOT / 'king_county.geojson').exists(), reason='Delivered data is not installed')
def test_inspection_api_with_delivered_files():
    from fastapi.testclient import TestClient
    from pipelines.validation.api import app
    from pipelines.validation import flood_lookup, heat_lookup, ground_lookup

    try:
        with TestClient(app) as client:
            assert app.title == 'Data Inspection API'
            assert client.get('/health').json()['status'] == 'ok'
            result = client.get('/hazards?lat=47.664&lon=-121.92').json()
            assert result['in_king_county']
            assert result['hazards']['flood']['first_wet'] <= '2025-12-10' <= result['hazards']['flood']['last_wet']
            assert result['hazards']['heat']['status'] == 'ok'
            result = client.get('/hazards?lat=47.65626&lon=-122.2981').json()
            assert result['hazards']['ground_motion']['status'] == 'ok'
    finally:
        for src, _ in flood_lookup._tiles:
            src.close()
        flood_lookup._tiles.clear()
        for module in (heat_lookup, ground_lookup):
            if module._state:
                module._state['src'].close()
                module._state.clear()
