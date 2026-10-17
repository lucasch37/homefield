// Isolated local backend. Every observation below is a synthetic TEST FIXTURE.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { once } from 'node:events';

const source = { name: 'TEST FIXTURE — not satellite data', dates: 'Test observation dates', resolution_m: 30, limitations: ['Synthetic test data. Do not use to assess a home.'] };
const fixture = { address: 'TEST FIXTURE — Seattle, WA', lat: 47.6198, lon: -122.3489, in_king_county: true, hazards: { flood: { status: 'flooded', observed_passes: 12, wet_passes: 1, last_wet: '2025-12-10', source }, heat: { status: 'ok', surface_temp_f: 93.4, county_percentile: 72, diff_from_median_f: 4.2, source }, ground_motion: { status: 'not_available', source } } };
const backend = createServer((req, res) => {
  const address = new URL(req.url, 'http://localhost').searchParams.get('address');
  res.setHeader('Content-Type', 'application/json');
  if (address === 'missing') { res.writeHead(404); res.end('{}'); }
  else if (address === 'outside') res.end(JSON.stringify({ in_king_county: false }));
  else if (address === 'broken') res.end(JSON.stringify({ ...fixture, hazards: { ...fixture.hazards, heat: null } }));
  else res.end(JSON.stringify(fixture));
});
backend.listen(0, '127.0.0.1'); await once(backend, 'listening');
const port = backend.address().port;
const app = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', '3012'], { cwd: fileURLToPath(new URL('../', import.meta.url)), env: { ...process.env, BACKEND_URL: `http://127.0.0.1:${port}`, XAI_API_KEY: '' }, stdio: ['ignore', 'pipe', 'pipe'] });
let output = ''; app.stdout.on('data', data => { output += data; }); app.stderr.on('data', data => { output += data; });
const cleanup = () => { app.kill(); backend.close(); };
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
  assert.equal((await get('/api/report')).status, 400);
  assert.equal((await get('/api/report?address=missing')).status, 404);
  assert.equal((await (await get('/api/report?address=outside')).json()).in_king_county, false);
  const partial = await (await get('/api/report?address=broken')).json();
  assert.equal(partial.hazards.heat.status, 'error'); assert.equal(partial.hazards.flood.status, 'flooded');
  const report = await (await get('/api/report?address=fixture')).json();
  assert.equal(report.hazards.heat.surface_temp_f, 93.4);
  assert.equal((await get('/maplibre-worker.mjs')).status, 200);
  assert.equal((await fetch('http://localhost:3012/api/summary', { method: 'POST', body: JSON.stringify(report) })).status, 503);
  assert.equal((await fetch('http://localhost:3012/api/voice-token', { method: 'POST' })).status, 503);
  console.log('PASS: production page, report proxy, invalid/missing/outside addresses, layer isolation, map worker, and missing AI configuration.');
  if (process.argv.includes('--serve')) { console.log('TEST FIXTURE preview: http://localhost:3012 — search any address to load synthetic observations.'); await new Promise(() => {}); }
} finally { cleanup(); }
