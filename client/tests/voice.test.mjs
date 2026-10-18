import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeReport } from '../lib/types.ts';
import { allowedRealtimeUrl, base64ToFloat32, pcm16ToBase64, runGetHazards, sessionUpdate } from '../lib/voice-session.ts';
import { parseSearch, reportUrl } from '../lib/search.ts';

const fixture = (name) => JSON.parse(readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), 'utf8'));
const carnation = normalizeReport(fixture('carnation'));

test('session.update declares the tool, server VAD and the real audio rate', () => {
  const update = sessionUpdate(48000);
  assert.equal(update.type, 'session.update');
  assert.deepEqual(update.session.turn_detection, { type: 'server_vad' });
  assert.equal(update.session.audio.input.format.rate, 48000);
  assert.equal(update.session.audio.output.format.rate, 48000);
  assert.equal(update.session.tools[0].name, 'get_hazards');
  assert.match(update.session.instructions, /Always call get_hazards/);
  assert.match(update.session.instructions, /Never say a home is safe/);
});

test('get_hazards with no address answers from the report on screen', async () => {
  const result = await runGetHazards('{}', carnation, () => assert.fail('no lookup'));
  assert.match(result.hazards.flood.finding, /1 of 281 passes, on December 10, 2025/);
  assert.deepEqual(await runGetHazards('not json', null, () => assert.fail('no lookup')), {
    error: 'No address has been looked up yet. Ask the user for a street address in King County, with the city.',
  });
});

test('get_hazards with an address looks it up through the report route', async () => {
  const urls = [];
  const sodo = await runGetHazards(JSON.stringify({ address: '1 Example St, Seattle' }), carnation, async (address) => {
    urls.push(address);
    return new Response(JSON.stringify(fixture('sodo')));
  });
  assert.deepEqual(urls, ['1 Example St, Seattle']);
  assert.match(sodo.hazards.heat.finding, /105\.8°F/);
  const missing = await runGetHazards('{"address":"nowhere"}', carnation, async () => new Response('{}', { status: 404 }));
  assert.match(missing.error, /Could not find "nowhere"/);
  const down = await runGetHazards('{"address":"x"}', carnation, async () => { throw new Error('offline'); });
  assert.match(down.error, /not working right now/);
  const outside = await runGetHazards('{"address":"Portland"}', carnation, async () => new Response(JSON.stringify(fixture('outside_portland'))));
  assert.equal(outside.in_king_county, false);
});

test('the browser only connects to TLS or a local stand-in', () => {
  assert.equal(allowedRealtimeUrl('wss://api.x.ai/v1/realtime?model=grok-voice-latest'), 'wss://api.x.ai/v1/realtime?model=grok-voice-latest');
  assert.equal(allowedRealtimeUrl('ws://127.0.0.1:9000/realtime'), 'ws://127.0.0.1:9000/realtime');
  assert.equal(allowedRealtimeUrl('ws://evil.example/realtime'), null);
  assert.equal(allowedRealtimeUrl('https://api.x.ai'), null);
  assert.equal(allowedRealtimeUrl(undefined), null);
});

test('PCM16 audio round-trips through base64', () => {
  const pcm = new Int16Array([0, 16384, -16384, 32767, -32768]);
  const samples = base64ToFloat32(pcm16ToBase64(pcm.buffer));
  assert.deepEqual([...samples].map((v) => Number(v.toFixed(4))), [0, 0.5, -0.5, 1, -1]);
});

test('the search box accepts addresses and coordinates', () => {
  assert.deepEqual(parseSearch(' 400 Broad St, Seattle '), { address: '400 Broad St, Seattle' });
  assert.deepEqual(parseSearch('47.664, -121.92'), { lat: 47.664, lon: -121.92 });
  assert.deepEqual(parseSearch('147.664, -121.92'), { address: '147.664, -121.92' });
  assert.equal(parseSearch('   '), null);
  assert.equal(reportUrl({ lat: 47.664, lon: -121.92 }), '/api/report?lat=47.664&lon=-121.92');
  assert.equal(reportUrl({ address: '400 Broad St' }), '/api/report?address=400+Broad+St');
});
