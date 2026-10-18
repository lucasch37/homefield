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
test('outside coverage keeps the geocoded location and does not invent hazards', () => {
  const report = normalizeReport({ address: 'Portland', lat: 45.5, lon: -122.6, in_king_county: false, hazards: null, message: 'Outside coverage' });
  assert.equal(report.in_king_county, false);
  assert.equal(report.lat, 45.5);
  assert.equal(report.hazards, null);
  assert.equal(report.message, 'Outside coverage');
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
test('current backend heat and ground-motion fields survive normalization', () => {
  const value = base();
  value.hazards.heat = { status: 'ok', surface_temp_f: 91.2, recent_relative_f: 4.5, lowland_percentile: 78, comparison_area: 'lowland King County', recent_years: [2024, 2025], early_years: [2015], clear_days_used: 7, change_since_early_f: 1.2, yearly_relative_f: [{ year: 2025, relative_f: 4.5 }], action: 'Find a cooling center.', source };
  value.hazards.ground_motion = { status: 'ok', velocity_mm_per_yr: -2.5, series_mm: [{ date: '2025-01-01', mm: null }, { date: '2025-02-01', mm: 1.1 }], sign_convention_verified: false, action: 'Check for cracks.', source };
  const report = normalizeReport(value);
  assert.equal(report.hazards.heat.lowland_percentile, 78);
  assert.equal(report.hazards.heat.recent_relative_f, 4.5);
  assert.deepEqual(report.hazards.heat.yearly_relative_f, [{ year: 2025, relative_f: 4.5 }]);
  assert.deepEqual(report.hazards.ground_motion.series_mm, [{ date: '2025-01-01', mm: null }, { date: '2025-02-01', mm: 1.1 }]);
  assert.equal(report.hazards.ground_motion.sign_convention_verified, false);
  assert.equal(report.hazards.ground_motion.action, 'Check for cracks.');
});
