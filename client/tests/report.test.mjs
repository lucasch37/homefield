import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeReport } from '../lib/types.ts';

const source = { name: 'Test fixture source', dates: 'Test fixture dates', resolution_m: 30, limitations: ['Fixture only'] };
const base = () => ({ address: 'Test address', lat: 47.6, lon: -122.3, in_king_county: true, hazards: { flood: { status: 'no_flooding_seen', observed_passes: 12, source }, heat: { status: 'ok', surface_temp_f: 0, source }, ground_motion: { status: 'not_available', source } } });

test('one broken layer does not hide valid observations', () => {
  const value = base(); value.hazards.flood = null;
  const report = normalizeReport(value);
  assert.equal(report.hazards.flood.status, 'error');
  assert.equal(report.hazards.heat.status, 'ok');
  assert.equal(report.hazards.heat.surface_temp_f, 0);
});
test('no reading is never normalized into no flooding observed', () => {
  const value = base(); value.hazards.flood = { status: 'not_enough_data', source };
  assert.equal(normalizeReport(value).hazards.flood.status, 'not_enough_data');
});
test('missing and nonfinite metrics are insufficient data, not zero observations', () => {
  for (const temperature of [undefined, null, '95', Infinity, NaN]) {
    const value = base(); value.hazards.heat.surface_temp_f = temperature;
    const heat = normalizeReport(value).hazards.heat;
    assert.equal(heat.status, 'not_enough_data');
    assert.equal(heat.surface_temp_f, undefined);
  }
});
test('no flooding observed requires a real pass count', () => {
  const value = base(); delete value.hazards.flood.observed_passes;
  assert.equal(normalizeReport(value).hazards.flood.status, 'not_enough_data');
});
test('outside coverage does not require hazard data or coordinates', () => {
  assert.equal(normalizeReport({ in_king_county: false }).in_king_county, false);
});
test('invalid locations reject the whole report', () => {
  for (const location of [{ lat: 100 }, { lon: '123' }, { in_king_county: 'true' }, { lat: null }]) {
    assert.throws(() => normalizeReport({ ...base(), ...location }));
  }
});
test('persistent water keeps its own status and source metadata', () => {
  const value = base(); value.hazards.flood = { status: 'permanent_water', source };
  const flood = normalizeReport(value).hazards.flood;
  assert.equal(flood.status, 'permanent_water');
  assert.deepEqual(flood.source, source);
});
test('unknown status and missing layers are isolated as errors', () => {
  const value = base(); value.hazards.flood.status = 'safe'; delete value.hazards.ground_motion;
  const report = normalizeReport(value);
  assert.equal(report.hazards.flood.status, 'error');
  assert.equal(report.hazards.ground_motion.status, 'error');
  assert.equal(report.hazards.heat.status, 'ok');
});
