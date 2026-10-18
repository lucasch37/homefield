import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { writeSummary } from '../lib/summary.ts';
import { normalizeReport } from '../lib/types.ts';
import { classifyXaiStatus, pickTextModel, tokenValue } from '../lib/xai-shared.ts';

const report = normalizeReport(JSON.parse(readFileSync(new URL('./fixtures/carnation.json', import.meta.url), 'utf8')));
const options = { apiKey: 'test-key', baseUrl: 'https://xai.test/v1', model: 'test-model' };
const GOOD = 'Satellite radar saw water here on 1 of 281 passes, on December 10, 2025. The ground and roofs averaged 84.7°F on clear summer days. The ground movement data could not tell us anything here. Sign up for King County flood alerts.';

// Stands in for xAI's chat completions endpoint; no network calls are made. Each call takes the next reply.
function mockXai(...replies) {
  const calls = [];
  const fetch = async (url, init) => {
    calls.push({ url, init, body: JSON.parse(init.body) });
    const reply = replies[Math.min(calls.length - 1, replies.length - 1)];
    if (typeof reply === 'object') return new Response(reply.body ?? '{}', { status: reply.status });
    return new Response(JSON.stringify({ choices: [{ message: { content: reply } }] }));
  };
  return { fetch, calls };
}

test('without an API key the summary is written from the data and says why', async () => {
  const result = await writeSummary(report, { ...options, apiKey: undefined, fetch: () => assert.fail('no request') });
  assert.equal(result.source, 'data');
  assert.equal(result.problem, 'missing_key');
  assert.match(result.summary, /1 of 281 passes, on December 10, 2025/);
  assert.match(result.note, /XAI_API_KEY isn’t set/);
});

test('Grok gets fact sentences, not raw JSON, and a faithful reply is used', async () => {
  const xai = mockXai(GOOD);
  const result = await writeSummary(report, { ...options, fetch: xai.fetch });
  assert.deepEqual(result, { summary: GOOD, source: 'grok' });
  const [call] = xai.calls;
  assert.equal(call.url, 'https://xai.test/v1/chat/completions');
  assert.equal(call.init.headers.Authorization, 'Bearer test-key');
  assert.equal(call.body.model, 'test-model');
  assert.equal(call.body.max_tokens, undefined, 'no token cap that reasoning models can exhaust');
  const prompt = call.body.messages[1].content;
  assert.match(prompt, /FACTS:\n- Flood: satellite radar saw water/);
  assert.doesNotMatch(prompt, /comparison_area|longitude|"status"/);
});

test('a reply with a rounded number gets one corrective retry', async () => {
  const xai = mockXai(GOOD.replace('84.7°F', 'about 85°F'), GOOD);
  const result = await writeSummary(report, { ...options, fetch: xai.fetch });
  assert.equal(result.source, 'grok');
  assert.equal(xai.calls.length, 2);
  assert.match(xai.calls[1].body.messages.at(-1).content, /numbers not in the data: 85/);
});

test('invented numbers twice fall back to the data summary', async () => {
  const logs = [];
  const xai = mockXai('Satellite radar saw water here on 3 of 281 passes in 2024. Sign up for King County flood alerts. Stay alert.');
  const result = await writeSummary(report, { ...options, fetch: xai.fetch, log: (m) => logs.push(m) });
  assert.equal(result.source, 'data');
  assert.match(result.summary, /1 of 281 passes/);
  assert.match(result.note, /didn’t match the data/);
  assert.match(logs[0], /numbers not in the data: 3, 2024/);
});

test('a reply calling the home safe is never shown', async () => {
  const xai = mockXai('Satellite radar saw water here on 1 of 281 passes. Otherwise this home is safe and sound. Sign up for King County flood alerts.');
  assert.equal((await writeSummary(report, { ...options, fetch: xai.fetch })).source, 'data');
});

test('an unavailable model switches to one the account has', async () => {
  const xai = mockXai({ status: 404, body: '{"error":"The model test-model does not exist"}' }, GOOD);
  const result = await writeSummary(report, { ...options, fetch: xai.fetch, findModel: async () => 'grok-4.3' });
  assert.equal(result.source, 'grok');
  assert.deepEqual(xai.calls.map((c) => c.body.model), ['test-model', 'grok-4.3']);
});

test('xAI failures explain the reason without exposing the key', async () => {
  const cases = [
    [{ status: 401 }, 'bad_key', /rejected the API key/],
    [{ status: 403, body: 'credits exhausted' }, 'no_credits', /no credits/],
    [{ status: 429 }, 'rate_limited', /busy/],
    [{ status: 500 }, 'upstream_error', /problem answering/],
  ];
  for (const [reply, problem, note] of cases) {
    const result = await writeSummary(report, { ...options, fetch: mockXai(reply).fetch });
    assert.equal(result.source, 'data');
    assert.equal(result.problem, problem);
    assert.match(result.note, note);
    assert.doesNotMatch(JSON.stringify(result), /test-key/);
  }
  const offline = await writeSummary(report, { ...options, fetch: async () => { throw new TypeError('fetch failed'); } });
  assert.equal(offline.problem, 'unreachable');
  const empty = await writeSummary(report, { ...options, fetch: async () => new Response('{"choices":[{"message":{"content":""}}]}') });
  assert.equal(empty.problem, 'upstream_error');
});

test('helpers classify errors, pick models and read tokens', () => {
  assert.equal(classifyXaiStatus(400, 'Model grok-x not found'), 'model_unavailable');
  assert.equal(classifyXaiStatus(400, 'Incorrect API key provided'), 'bad_key');
  assert.equal(pickTextModel(['grok-4.7', 'grok-voice-latest'], 'grok-4.7'), 'grok-4.7');
  assert.equal(pickTextModel(['grok-imagine-image', 'grok-4.3', 'grok-4.7', 'grok-voice-latest'], 'gone'), 'grok-4.7');
  assert.equal(pickTextModel(['grok-voice-latest']), undefined);
  assert.equal(tokenValue({ value: 'a' }), 'a');
  assert.equal(tokenValue({ client_secret: { value: 'b' } }), 'b');
  assert.equal(tokenValue({}), undefined);
});
