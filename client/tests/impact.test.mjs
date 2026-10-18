import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { buildFacts, factsPrompt, numbersIn } from '../lib/facts.ts';
import { impactFor } from '../lib/impact.ts';
import { hazardKinds, normalizeReport } from '../lib/types.ts';

const fixtureDir = new URL('./fixtures/', import.meta.url);
const load = (name) => normalizeReport(JSON.parse(readFileSync(new URL(name, fixtureDir), 'utf8')));
const inside = readdirSync(fixtureDir).filter((f) => f.endsWith('.json') && !f.startsWith('outside'));
const source = { name: 'test', dates: 'test', resolution_m: null, limitations: [] };

// Every status and severity band, not only the ones the fixtures happen to cover.
const synthetic = [
  ...['flooded', 'permanent_water', 'no_flooding_seen', 'not_enough_data', 'error'].map((status) => ['flood', { status, source, observed_passes: 10, wet_passes: 1 }]),
  ...[10, 60, 80, 95].map((pct) => ['heat', { status: 'ok', source, surface_temp_f: 90, lowland_percentile: pct }]),
  ...['not_enough_data', 'error', 'not_available'].map((status) => ['heat', { status, source }]),
  ...[2, 8, 15, -25].map((v) => ['ground_motion', { status: 'ok', source, velocity_mm_per_yr: v }]),
  ...['not_enough_data', 'error', 'not_available'].map((status) => ['ground_motion', { status, source }]),
];

test('impact notes add no numbers, never say safe, and give no legal, insurance, or medical advice', () => {
  const notes = [
    ...synthetic.map(([kind, hazard]) => impactFor(kind, hazard)),
    ...inside.flatMap((name) => hazardKinds.map((kind) => impactFor(kind, load(name).hazards[kind]))),
  ];
  for (const { meaning, check } of notes) {
    const text = `${meaning} ${check}`;
    assert.deepEqual([...numbersIn(text)], [], text);
    assert.doesNotMatch(text, /\bsafe|insurance|lawyer|legal|doctor|medical|will (flood|crack|sink)/i, text);
  }
});

test('every shown finding has a meaning, and notable ones say what to check', () => {
  for (const name of inside) {
    for (const fact of buildFacts(load(name)).hazards.filter((h) => !h.skip)) {
      assert.ok(fact.meaning, `${name} ${fact.key} has no meaning`);
      if (fact.score >= 50) assert.ok(fact.check, `${name} ${fact.key} has no check`);
    }
  }
});

test('the summary prompt pairs each fact with its meaning and check', () => {
  const prompt = factsPrompt(buildFacts(load('carnation.json')));
  assert.match(prompt, /MOST SIGNIFICANT: Flood\n/);
  assert.match(prompt, /- Flood: satellite radar saw water.* MEANING: Water reached this spot.* CHECK: Ask the seller or landlord/);
});
