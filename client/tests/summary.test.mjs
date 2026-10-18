import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { writeSummary } from '../lib/summary.ts';
import { normalizeReport } from '../lib/types.ts';

const report = normalizeReport(JSON.parse(readFileSync(new URL('./fixtures/carnation.json', import.meta.url), 'utf8')));
const options = { apiKey: 'test-key', baseUrl: 'https://xai.test/v1', model: 'test-model' };

// Stands in for xAI's chat completions endpoint; no network calls are made.
function mockXai(reply, status = 200) {
  const calls = [];
  const fetch = async (url, init) => {
    calls.push({ url, init, body: JSON.parse(init.body) });
    return new Response(JSON.stringify({ choices: [{ message: { content: reply } }] }), { status });
  };
  return { fetch, calls };
}

test('without an API key the summary is written from the data', async () => {
  const result = await writeSummary(report, { ...options, apiKey: undefined, fetch: () => assert.fail('no request') });
  assert.equal(result.source, 'data');
  assert.match(result.summary, /1 of 281 passes, on December 10, 2025/);
  assert.match(result.note, /not configured/);
});

test('Grok gets fact sentences, not raw JSON, and a faithful reply is used', async () => {
  const reply = 'Satellite radar saw water here on 1 of 281 passes, on December 10, 2025. The ground and roofs averaged 84.7°F on clear summer days. The ground movement data could not tell us anything here. Sign up for King County flood alerts.';
  const xai = mockXai(reply);
  const result = await writeSummary(report, { ...options, fetch: xai.fetch });
  assert.deepEqual(result, { summary: reply, source: 'grok' });
  const [call] = xai.calls;
  assert.equal(call.url, 'https://xai.test/v1/chat/completions');
  assert.equal(call.init.headers.Authorization, 'Bearer test-key');
  assert.equal(call.body.model, 'test-model');
  const prompt = call.body.messages[1].content;
  assert.match(prompt, /FACTS:\n- Flood: satellite radar saw water/);
  assert.doesNotMatch(prompt, /comparison_area|longitude|"status"/);
});

test('a reply with an invented number falls back to the data summary', async () => {
  const logs = [];
  const xai = mockXai('Satellite radar saw water here on 3 of 281 passes in 2024. Sign up for King County flood alerts. Stay alert for more.');
  const result = await writeSummary(report, { ...options, fetch: xai.fetch, log: (m) => logs.push(m) });
  assert.equal(result.source, 'data');
  assert.match(result.summary, /1 of 281 passes/);
  assert.match(logs[0], /numbers not in the data: 3, 2024/);
});

test('a reply calling the home safe falls back', async () => {
  const xai = mockXai('Satellite radar saw water here on 1 of 281 passes. Otherwise this home is safe and sound. Sign up for King County flood alerts.');
  assert.equal((await writeSummary(report, { ...options, fetch: xai.fetch })).source, 'data');
});

test('xAI errors and timeouts fall back without exposing details', async () => {
  for (const fetch of [mockXai('', 500).fetch, async () => { throw new DOMException('timeout', 'TimeoutError'); }, async () => new Response('not json')]) {
    const result = await writeSummary(report, { ...options, fetch });
    assert.equal(result.source, 'data');
    assert.doesNotMatch(JSON.stringify(result), /test-key/);
  }
});
