// Runs the production build (`pnpm build` first) against local stand-ins for FastAPI and xAI.
// Usage: pnpm test:integration   (add --serve to keep the stand-ins running for manual checks)
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { once } from 'node:events';

const fixture = (name) => JSON.parse(readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), 'utf8'));
const carnation = { ...fixture('carnation'), address: '31500 NE Example Rd, Carnation, WA 98014' };
const API_KEY = 'test-xai-key-never-in-browser';

// Stand-in for FastAPI /hazards, replaying real responses from server/data.
const backend = createServer((req, res) => {
  const params = new URL(req.url, 'http://localhost').searchParams;
  const address = params.get('address');
  res.setHeader('Content-Type', 'application/json');
  if (params.get('lat') === '47.664' && params.get('lon') === '-121.92') res.end(JSON.stringify(fixture('carnation')));
  else if (address === 'missing') { res.writeHead(404); res.end(JSON.stringify({ detail: 'Address not found. Try a complete street address, city, and ZIP code.' })); }
  else if (address === 'outside') res.end(JSON.stringify(fixture('outside_portland')));
  else if (address === 'broken') res.end(JSON.stringify({ ...carnation, hazards: { ...carnation.hazards, heat: null } }));
  else res.end(JSON.stringify(carnation));
});

// Stand-in for xAI: chat completions and ephemeral realtime tokens.
let chatReply = '';
const xaiRequests = [];
const xai = createServer(async (req, res) => {
  let body = '';
  for await (const chunk of req) body += chunk;
  xaiRequests.push({ url: req.url, auth: req.headers.authorization, body });
  res.setHeader('Content-Type', 'application/json');
  if (req.headers.authorization !== `Bearer ${API_KEY}`) { res.writeHead(401); res.end('{}'); return; }
  if (req.url === '/v1/chat/completions') res.end(JSON.stringify({ choices: [{ message: { content: chatReply } }] }));
  else if (req.url === '/v1/realtime/client_secrets') res.end(JSON.stringify({ value: 'ephemeral-test-token', expires_at: 1 }));
  else { res.writeHead(404); res.end('{}'); }
});

for (const server of [backend, xai]) { server.listen(0, '127.0.0.1'); await once(server, 'listening'); }
const xaiPort = xai.address().port;
const app = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', '3012'], {
  cwd: fileURLToPath(new URL('../', import.meta.url)),
  env: {
    ...process.env,
    BACKEND_URL: `http://127.0.0.1:${backend.address().port}`,
    XAI_API_KEY: API_KEY,
    XAI_BASE_URL: `http://127.0.0.1:${xaiPort}/v1`,
    XAI_REALTIME_URL: `ws://127.0.0.1:${xaiPort}/realtime`,
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let output = ''; app.stdout.on('data', data => { output += data; }); app.stderr.on('data', data => { output += data; });
const cleanup = () => { app.kill(); backend.close(); xai.close(); };
process.on('SIGINT', () => { cleanup(); process.exit(0); });
process.on('SIGTERM', () => { cleanup(); process.exit(0); });
try {
  let ready = false;
  for (let i = 0; i < 50; i++) {
    if (app.exitCode !== null) throw new Error(output);
    try { ready = (await fetch('http://localhost:3012')).ok; } catch {}
    if (ready) break;
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  assert.ok(ready, 'Production server starts');
  const get = path => fetch(`http://localhost:3012${path}`);
  const post = (path, body, headers = {}) => fetch(`http://localhost:3012${path}`, { method: 'POST', body, headers });

  // Report proxy: validation, errors, isolation, coordinates.
  assert.equal((await get('/api/report')).status, 400);
  assert.equal((await get('/api/report?lat=91&lon=0')).status, 400);
  const missing = await get('/api/report?address=missing');
  assert.equal(missing.status, 404);
  assert.match((await missing.json()).error, /Address not found/);
  assert.equal((await (await get('/api/report?address=outside')).json()).in_king_county, false);
  const partial = await (await get('/api/report?address=broken')).json();
  assert.equal(partial.hazards.heat.status, 'error'); assert.equal(partial.hazards.flood.status, 'flooded');
  const byCoordinates = await (await get('/api/report?lat=47.664&lon=-121.92')).json();
  assert.equal(byCoordinates.address, null);
  assert.equal(byCoordinates.hazards.flood.first_wet, '2025-12-10');
  const report = await (await get('/api/report?address=Carnation')).json();
  assert.equal(report.hazards.flood.wet_passes, 1);
  assert.equal(report.hazards.heat.surface_temp_f, 84.7);

  // Summary: faithful Grok text is used; invented numbers fall back to the data summary.
  chatReply = 'Satellite radar saw water at this spot on 1 of 281 passes, on December 10, 2025. The ground and roofs averaged 84.7°F on clear summer days. Sign up for King County flood alerts.';
  const grok = await (await post('/api/summary', JSON.stringify(report))).json();
  assert.deepEqual(grok, { summary: chatReply, source: 'grok' });
  const sent = JSON.parse(xaiRequests.at(-1).body);
  assert.match(sent.messages[1].content, /^ADDRESS: 31500 NE Example Rd, Carnation, WA 98014\nFACTS:/);
  chatReply = 'Water was seen on 12 passes in 2019. Sign up for King County flood alerts. The rest is fine.';
  const checked = await (await post('/api/summary', JSON.stringify(report))).json();
  assert.equal(checked.source, 'data');
  assert.match(checked.summary, /1 of 281 passes, on December 10, 2025/);
  assert.equal((await post('/api/summary', '{"in_king_county": false}')).status, 400);
  assert.equal((await post('/api/summary', JSON.stringify(report), { Origin: 'https://evil.example' })).status, 403);

  // Voice token: ephemeral value plus the realtime URL; never the API key; same-origin only.
  const tokenResponse = await post('/api/voice-token');
  const tokenText = await tokenResponse.text();
  assert.equal(tokenResponse.status, 200);
  assert.deepEqual(JSON.parse(tokenText), { value: 'ephemeral-test-token', url: `ws://127.0.0.1:${xaiPort}/realtime` });
  assert.ok(!tokenText.includes(API_KEY));
  assert.equal((await post('/api/voice-token', null, { Origin: 'https://evil.example' })).status, 403);

  // Pages render with compiled Tailwind CSS and never ship the API key.
  const html = await (await get('/search')).text();
  assert.ok(!html.includes(API_KEY), 'API key is not in the page');
  const assets = [...html.matchAll(/(?:href|src)="(\/_next\/static\/[^"]+\.(?:css|js))"/g)].map((m) => m[1]);
  const css = (await Promise.all(assets.filter((a) => a.endsWith('.css')).map(async (a) => (await get(a)).text()))).join('\n');
  assert.ok(css.includes('.rounded-full'), 'Tailwind utilities are compiled');
  assert.ok(!/@theme\b|@apply\b/.test(css), 'No raw Tailwind directives ship to the browser');
  for (const asset of assets) assert.ok(!(await (await get(asset)).text()).includes(API_KEY), `${asset} has no API key`);
  assert.equal((await get('/maplibre-worker.mjs')).status, 200);
  assert.equal((await get('/pcm-capture.js')).status, 200);
  assert.ok((await (await get('/about')).text()).includes('href="/search"'));

  console.log('PASS: production pages and CSS, report proxy (address, coordinates, errors, isolation), checked Grok summary with fallback, voice token, origin checks, and no API key in the browser.');
  if (process.argv.includes('--serve')) { console.log('Preview: http://localhost:3012/search'); await new Promise(() => {}); }
} finally { cleanup(); }
