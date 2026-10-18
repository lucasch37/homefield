import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  buildComparisonFacts, checkComparison, comparisonPrompt, compareRows, compareUrl, readCompareQueries, templateComparison,
} from '../lib/compare.ts';
import { numbersIn } from '../lib/facts.ts';
import { finding } from '../lib/hazards.ts';
import { normalizeReport } from '../lib/types.ts';

const raw = (name) => JSON.parse(readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), 'utf8'));
const load = (name) => normalizeReport(raw(name));
const row = (rows, kind) => rows.find((item) => item.kind === kind);

test('compare links keep up to three distinct searches and need at least two', () => {
  const url = compareUrl(['1 Main St', ' 1 main st ', '2 Main St', '47.58, -122.335', '4 Main St']);
  const search = url.slice(url.indexOf('?'));
  assert.deepEqual(readCompareQueries(search), ['1 Main St', '2 Main St', '47.58, -122.335']);
  assert.deepEqual(readCompareQueries('?q=1+Main+St'), []);
  assert.deepEqual(readCompareQueries('?q=1+Main+St&q=+1+MAIN+ST'), []);
  assert.deepEqual(readCompareQueries(`?q=1+Main+St&q=${'x'.repeat(301)}`), []);
  assert.deepEqual(readCompareQueries(''), []);
});

test('each stat reuses the report card metric and label with the dashboard severity', () => {
  const reports = [load('carnation'), load('sodo'), load('uw_union_bay')];
  const rows = compareRows(reports);
  for (const item of rows) {
    item.stats.forEach((stat, index) => {
      const card = finding(reports[index].hazards[item.kind], item.kind);
      assert.equal(stat.metric, card.metric);
      assert.equal(stat.label, card.label);
    });
  }
  assert.deepEqual(row(rows, 'flood').stats.map((stat) => stat.severity), ['average', 'good', 'good']);
  assert.deepEqual(row(rows, 'heat').stats.map((stat) => stat.metric), ['84.7°F', '105.8°F', '97.2°F']);
  assert.equal(row(rows, 'heat').stats[1].detail, '98th percentile');
  assert.deepEqual(row(rows, 'ground_motion').stats.map((stat) => stat.unknown), [true, true, false]);
});

test('a column that is loading or failed has no stats', () => {
  const rows = compareRows([load('carnation'), null]);
  assert.equal(row(rows, 'flood').stats[1], null);
});

test('the data-only comparison uses only numbers from the API responses', () => {
  const names = ['carnation', 'seattle_center', 'lake_washington'];
  const text = templateComparison(names.map(load));
  const api = numbersIn(names.map((name) => JSON.stringify(raw(name))).join(' '));
  assert.deepEqual([...numbersIn(text)].filter((n) => !api.has(n)), []);
  assert.match(text, /^Water showed up in the satellite record at A, which matters for basements.*while the pin sits on or beside open water at C, and the satellite record was dry at B\./);
  assert.match(text, /Ground movement readings were unavailable at all three places\./);
  assert.match(text, /Before deciding: for A, ask the seller or landlord about past water.*; for C, confirm where the home sits/);
  assert.deepEqual([...numbersIn(text)], []);
  assert.doesNotMatch(text, /Location|passes|°F/);
  assert.equal(checkComparison(text, buildComparisonFacts(names.map(load))).ok, true);
});

test('the comparison prompt groups facts by hazard and place, never raw JSON', () => {
  const prompt = comparisonPrompt(buildComparisonFacts([load('carnation'), load('sodo')]));
  assert.match(prompt, /^PLACES:\n- /);
  assert.match(prompt, /^PLACES:\n- A: .+\n- B: /);
  assert.match(prompt, /Surface heat:\n- A: on clear summer days/);
  assert.doesNotMatch(prompt, /comparison_area|"status"/);
});

test('generated comparisons cannot compute differences or call a place safe', () => {
  const facts = buildComparisonFacts([load('seattle_center'), load('sodo')]);
  const base = 'Surface heat at the second place averaged 105.8°F, much hotter than the first place at 91.5°F. Neither place had flooding observed on satellite passes. Ground movement could not be measured at either place. Satellite observations cannot show that a place is free of hazards.';
  assert.equal(checkComparison(base, facts).ok, true);
  assert.equal(checkComparison(base.replace('much hotter', '14.3°F hotter'), facts).ok, false);
  assert.equal(checkComparison(`${base} Both places are safe.`, facts).ok, false);
});
