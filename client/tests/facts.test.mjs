import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { buildFacts, checkSummary, hazardsForVoice, numbersIn, templateSummary } from '../lib/facts.ts';
import { finding } from '../lib/hazards.ts';
import { hazardKinds, normalizeReport } from '../lib/types.ts';

const fixtureDir = new URL('./fixtures/', import.meta.url);
const raw = (name) => JSON.parse(readFileSync(new URL(`${name}.json`, fixtureDir), 'utf8'));
const load = (name) => normalizeReport(raw(name));
const inside = readdirSync(fixtureDir).filter((f) => f.endsWith('.json') && !f.startsWith('outside')).map((f) => f.replace('.json', ''));

// Every number shown to a user must come from the API. Dates are reformatted ("2025-12-10" ->
// "December 10, 2025"), so compare numbers, not strings.
function assertNumbersFromApi(text, name) {
  const api = numbersIn(JSON.stringify(raw(name)));
  const extra = [...numbersIn(text)].filter((n) => !api.has(n));
  assert.deepEqual(extra, [], `${name}: "${text}" has numbers that are not in the API response`);
}

test('card text only uses numbers from the API response', () => {
  for (const name of inside) {
    const report = load(name);
    for (const kind of hazardKinds) {
      const result = finding(report.hazards[kind], kind);
      assertNumbersFromApi([result.label, result.text, result.metric, result.detail].filter(Boolean).join(' '), name);
    }
  }
});

test('fact sentences, template summaries and voice findings only use API numbers', () => {
  for (const name of inside) {
    const report = load(name);
    const facts = buildFacts(report);
    assertNumbersFromApi(facts.hazards.map((h) => h.line).join(' '), name);
    assertNumbersFromApi(templateSummary(facts), name);
    assertNumbersFromApi(JSON.stringify(hazardsForVoice(report)), name);
  }
});

test('Carnation leads with the December 10, 2025 water observation', () => {
  const facts = buildFacts(load('carnation'));
  assert.equal(facts.lead, 'flood');
  assert.match(facts.hazards[0].line, /1 of 281 passes, on December 10, 2025/);
  const summary = templateSummary(facts);
  assert.match(summary, /^Satellite radar saw water at this spot on 1 of 281 passes, on December 10, 2025\./);
  assert.match(summary, /matters most for basements, crawl spaces, ground-floor rooms, and yards/);
  assert.match(summary, /couldn’t measure ground movement here/);
  assert.match(summary, /Before deciding, ask the seller or landlord about past water, look for water stains, and sign up for flood alerts\.$/);
  assert.equal(finding(load('carnation').hazards.flood, 'flood').detail, 'Water seen on December 10, 2025');
});

test('lake water, hot pavement and missing readings are described, never called safe', () => {
  const lake = buildFacts(load('lake_washington'));
  assert.match(lake.hazards[0].line, /river, lake, or pond/);
  assert.ok(lake.hazards[1].unknown, 'water has no heat reading');
  const sodo = buildFacts(load('sodo'));
  assert.equal(sodo.lead, 'heat');
  assert.match(templateSummary(sodo), /^On clear .*105\.8°F\. Surfaces here run hotter than almost anywhere in lowland King County, which can mean hotter rooms/);
  assert.match(templateSummary(sodo), /No flooding showed up in the satellite record/);
  assert.match(templateSummary(sodo), /Before deciding, ask about air conditioning, insulation, and shade trees\.$/);
  for (const name of inside) assert.doesNotMatch(templateSummary(buildFacts(load(name))), /\bsafe/i);
  const seattle = templateSummary(buildFacts(load('seattle_center')));
  assert.match(seattle, /No flooding was observed at this spot in 196 satellite radar passes.*does not mean the home cannot flood/);
});

test('ground motion is reported without a direction', () => {
  const report = load('uw_union_bay');
  const text = templateSummary(buildFacts(report)) + JSON.stringify(hazardsForVoice(report));
  assert.match(text, /18\.5 mm per year/);
  assert.match(text, /between July 7, 2016 and October 12, 2025/);
  assert.doesNotMatch(text.replace(/rising or sinking/g, ''), /\b(rising|sinking|subsid|uplift)/i);
  assert.equal(finding(report.hazards.ground_motion, 'ground_motion').metric, '-18.5 mm/yr');
});

test('summary check rejects invented numbers, "safe", links and rambling', () => {
  const facts = buildFacts(load('carnation'));
  const good = 'Satellite radar saw water at this spot on 1 of 281 passes, on December 10, 2025. The ground and roofs here averaged 84.7°F on clear summer days, cooler than a typical lowland spot. Sign up for King County flood alerts.';
  assert.deepEqual(checkSummary(good, facts), { ok: true });
  assert.equal(checkSummary(good.replace('281', '300'), facts).ok, false);
  assert.equal(checkSummary(good.replace('December 10, 2025', 'December 12, 2025'), facts).ok, false);
  assert.equal(checkSummary(`${good} Your home is safe.`, facts).ok, false);
  assert.equal(checkSummary(`${good} See https://example.com.`, facts).ok, false);
  assert.equal(checkSummary('Too short.', facts).ok, false);
  assert.equal(checkSummary(Array(9).fill('Water was seen here.').join(' '), facts).ok, false);
});

test('voice tool output drops developer notes and handles every case', () => {
  const voice = hazardsForVoice(load('carnation'));
  assert.equal(voice.in_king_county, true);
  assert.match(voice.hazards.flood.finding, /December 10, 2025/);
  assert.equal(voice.hazards.flood.action, 'Sign up for King County flood alerts');
  assert.doesNotMatch(JSON.stringify(voice), /longitude|Frame F|sign convention|pipeline/i);
  assert.match(voice.hazards.heat.trend, /does not say whether summers overall got hotter/);
  assert.equal(hazardsForVoice(load('outside_portland')).in_king_county, false);
  assert.match(hazardsForVoice(null).error, /No address/);
});

test('coordinate reports have no invented street address', () => {
  const report = load('carnation');
  assert.equal(report.address, null);
  assert.equal(buildFacts(report).place, 'Location 47.664, -121.92');
});
