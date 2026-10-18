import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { writeComparison, writeSummary } from '../lib/summary.ts';
import { normalizeReport } from '../lib/types.ts';
import { classifyGeminiStatus, geminiText, pickGeminiModel } from '../lib/gemini-shared.ts';
import { classifyXaiStatus, pickTextModel, tokenValue } from '../lib/xai-shared.ts';

const report = normalizeReport(JSON.parse(readFileSync(new URL('./fixtures/carnation.json', import.meta.url), 'utf8')));
const options = { apiKey: 'test-key', baseUrl: 'https://gemini.test/v1beta', model: 'gemini-flash-latest' };
const GOOD = 'Water reached this spot at least once while satellites were watching, most recently on December 10, 2025, so basements, crawl spaces, and ground-floor rooms are what to think about here. Summer surface heat is typical, averaging 84.7°F on clear days, so it is not a standout concern. Satellites could not measure ground movement here. Before deciding, ask the seller or landlord about past water and sign up for King County flood alerts.';

// Stands in for Gemini's generateContent endpoint; no network calls are made. Each call takes the next reply.
function mockGemini(...replies) {
  const calls = [];
  const fetch = async (url, init) => {
    calls.push({ url, init, body: JSON.parse(init.body) });
    const reply = replies[Math.min(calls.length - 1, replies.length - 1)];
    if (typeof reply === 'object') return new Response(reply.body ?? '{}', { status: reply.status });
    return new Response(JSON.stringify({ candidates: [{ content: { role: 'model', parts: [{ text: reply }] } }] }));
  };
  return { fetch, calls };
}

test('without a Gemini key the summary is written from the data and says why', async () => {
  const result = await writeSummary(report, { ...options, apiKey: undefined, fetch: () => assert.fail('no request') });
  assert.equal(result.source, 'data');
  assert.equal(result.problem, 'missing_key');
  assert.match(result.summary, /1 of 281 passes, on December 10, 2025/);
  assert.match(result.note, /GEMINI_API_KEY isn’t set/);
});

test('Gemini gets fact sentences, not raw JSON, and a faithful reply is used', async () => {
  const gemini = mockGemini(GOOD);
  const result = await writeSummary(report, { ...options, fetch: gemini.fetch });
  assert.deepEqual(result, { summary: GOOD, source: 'gemini' });
  const [call] = gemini.calls;
  assert.equal(call.url, 'https://gemini.test/v1beta/models/gemini-flash-latest:generateContent');
  assert.equal(call.init.headers['x-goog-api-key'], 'test-key');
  const system = call.body.systemInstruction.parts[0].text;
  assert.match(system, /deciding whether to live at the address/);
  assert.match(system, /your job is the impact/);
  assert.match(system, /Use only the FACTS, MEANING, CHECK, and ACTION lines/);
  assert.match(system, /no legal, insurance, or medical advice/);
  assert.deepEqual(call.body.generationConfig, { thinkingConfig: { thinkingLevel: 'low' } });
  const prompt = call.body.contents[0].parts[0].text;
  assert.match(prompt, /FACTS:\n- Flood: satellite radar saw water.* MEANING: .* CHECK: /);
  assert.doesNotMatch(prompt, /comparison_area|longitude|"status"/);
});

test('a model that rejects the thinking setting is asked again without it', async () => {
  const gemini = mockGemini({ status: 400, body: '{"error":{"message":"Thinking level LOW is not supported for this model."}}' }, GOOD);
  const result = await writeSummary(report, { ...options, fetch: gemini.fetch });
  assert.equal(result.source, 'gemini');
  assert.equal(gemini.calls[1].body.generationConfig, undefined);
});

test('thought parts are skipped', () => {
  assert.equal(geminiText({ candidates: [{ content: { parts: [{ text: 'plan', thought: true }, { text: 'Answer.' }] } }] }), 'Answer.');
});

test('a reply with a rounded number gets one corrective retry', async () => {
  const gemini = mockGemini(GOOD.replace('84.7°F', 'about 85°F'), GOOD);
  const result = await writeSummary(report, { ...options, fetch: gemini.fetch });
  assert.equal(result.source, 'gemini');
  assert.equal(gemini.calls.length, 2);
  const turns = gemini.calls[1].body.contents;
  assert.equal(turns[1].role, 'model');
  assert.match(turns[2].parts[0].text, /numbers not in the data: 85/);
});

test('invented numbers twice fall back to the data summary', async () => {
  const logs = [];
  const gemini = mockGemini('Satellite radar saw water here on 3 of 281 passes in 2024. Sign up for King County flood alerts. Stay alert.');
  const result = await writeSummary(report, { ...options, fetch: gemini.fetch, log: (m) => logs.push(m) });
  assert.equal(result.source, 'data');
  assert.match(result.summary, /1 of 281 passes/);
  assert.match(result.note, /Gemini’s wording didn’t match the data/);
  assert.match(logs[0], /numbers not in the data: 3, 2024/);
});

test('a reply calling the home safe is never shown', async () => {
  const gemini = mockGemini('Satellite radar saw water here on 1 of 281 passes. Otherwise this home is safe and sound. Sign up for King County flood alerts.');
  assert.equal((await writeSummary(report, { ...options, fetch: gemini.fetch })).source, 'data');
});

test('a comparison uses a faithful Gemini reply and falls back when it computes a difference', async () => {
  const pair = ['seattle_center', 'sodo'].map((name) => normalizeReport(JSON.parse(readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), 'utf8'))));
  const reply = 'Surface heat at the Seattle Center spot averaged 91.5°F, while the SODO spot averaged 105.8°F, much hotter than typical. No flooding was observed at either place on satellite passes. Ground movement could not be measured at either place. Satellite observations cannot show that a place is free of hazards.';
  const good = mockGemini(reply);
  const accepted = await writeComparison(pair, { ...options, fetch: good.fetch });
  assert.deepEqual(accepted, { summary: reply, source: 'gemini' });
  assert.match(good.calls[0].body.systemInstruction.parts[0].text, /Never compute differences/);
  assert.match(good.calls[0].body.contents[0].parts[0].text, /^PLACES:/);

  const computed = reply.replace('much hotter than typical', '14.3°F hotter');
  const rejected = await writeComparison(pair, { ...options, fetch: mockGemini(computed).fetch });
  assert.equal(rejected.source, 'data');
  assert.match(rejected.summary, /^The satellite record was dry at both places\. Surfaces run much hotter than typical at B, which matters for how hot rooms/);
  assert.match(rejected.summary, /Before deciding: for A, look at King County flood maps.*; for B, ask about air conditioning, insulation, and shade trees\./);
  assert.match(good.calls[0].body.systemInstruction.parts[0].text, /trade-offs/);
  assert.match(good.calls[0].body.contents[0].parts[0].text, /Surface heat:\n- A: .* MEANING: .*\n- B: .* MEANING: .* CHECK: /);
  assert.match(rejected.note, /comparison is the satellite findings/);
});

test('an unavailable model switches to one the key can use', async () => {
  const gemini = mockGemini({ status: 404, body: '{"error":{"message":"models/old is not found"}}' }, GOOD);
  const result = await writeSummary(report, { ...options, model: 'old', fetch: gemini.fetch, findModel: async () => 'gemini-3-flash-preview' });
  assert.equal(result.source, 'gemini');
  assert.match(gemini.calls[1].url, /models\/gemini-3-flash-preview:generateContent$/);
});

test('Gemini failures explain the reason without exposing the key', async () => {
  const cases = [
    [{ status: 400, body: '{"error":{"message":"API key not valid.","details":[{"reason":"API_KEY_INVALID"}]}}' }, 'bad_key', /rejected GEMINI_API_KEY/],
    [{ status: 403, body: '{"error":{"status":"PERMISSION_DENIED"}}' }, 'bad_key', /rejected GEMINI_API_KEY/],
    [{ status: 429, body: 'You exceeded your current quota, please check your plan and billing details' }, 'quota', /quota/],
    [{ status: 429, body: 'Resource exhausted: requests per minute' }, 'rate_limited', /busy/],
    [{ status: 500 }, 'upstream_error', /problem writing/],
  ];
  for (const [reply, problem, note] of cases) {
    const result = await writeSummary(report, { ...options, fetch: mockGemini(reply).fetch });
    assert.equal(result.source, 'data');
    assert.equal(result.problem, problem);
    assert.match(result.note, note);
    assert.doesNotMatch(JSON.stringify(result), /test-key/);
  }
  const offline = await writeSummary(report, { ...options, fetch: async () => { throw new TypeError('fetch failed'); } });
  assert.equal(offline.problem, 'unreachable');
  const empty = await writeSummary(report, { ...options, fetch: async () => new Response('{"candidates":[]}') });
  assert.equal(empty.problem, 'upstream_error');
});

test('model pickers and token reader', () => {
  const listed = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-3-flash-preview', 'gemini-2.5-flash-preview-tts']
    .map((id) => ({ name: `models/${id}`, supportedGenerationMethods: ['generateContent'] }));
  assert.equal(pickGeminiModel(listed, 'gemini-3-flash-preview'), 'gemini-3-flash-preview');
  assert.equal(pickGeminiModel(listed, 'gone'), 'gemini-flash-latest');
  assert.equal(pickGeminiModel([{ name: 'models/gemini-2.5-flash-preview-tts', supportedGenerationMethods: ['generateContent'] }]), undefined);
  assert.equal(classifyGeminiStatus(404, ''), 'model_unavailable');
  assert.equal(classifyXaiStatus(400, 'Incorrect API key provided'), 'bad_key');
  assert.equal(pickTextModel(['grok-imagine-image', 'grok-4.3', 'grok-4.7', 'grok-voice-latest'], 'gone'), 'grok-4.7');
  assert.equal(tokenValue({ client_secret: { value: 'b' } }), 'b');
});
