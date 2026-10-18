import { afterEach, expect, it, vi } from 'vitest';
import { fetchReport, LatestRequest, validateBase } from '../src/api';
import { normalizeReport } from '../src/report';
const location = { address: '400 Broad St', lat: 47.62, lon: -122.35, in_king_county: true };
const source = { name: 'Test source', dates: '2020–2025', resolution_m: 30, limitations: ['Not a prediction.'] };
const data = { ...location, hazards: { flood: { status: 'no_flooding_seen', observed_passes: 10, wet_passes: 0, source }, heat: { status: 'ok', surface_temp_f: 0, recent_relative_f: 0, source }, ground_motion: { status: 'ok', velocity_mm_per_yr: 0, sign_convention_verified: false, source } } };
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
it('preserves zeros, sources, and missing layers', () => {
  const result = normalizeReport(data); expect(result.in_king_county).toBe(true);
  if (result.in_king_county) { expect(result.hazards.heat.surface_temp_f).toBe(0); expect(result.hazards.ground_motion.velocity_mm_per_yr).toBe(0); expect(result.hazards.flood.source).toEqual(source); }
  const missing = normalizeReport(location); if (missing.in_king_county) expect(missing.hazards.heat.status).toBe('error');
});
it('keeps unavailable readings unavailable and handles outside coverage', () => {
  const result = normalizeReport({ ...data, hazards: { ...data.hazards, heat: { status: 'ok', surface_temp_f: null, source } } });
  if (result.in_king_county) expect(result.hazards.heat.status).toBe('not_enough_data');
  expect(normalizeReport({ ...location, in_king_county: false, hazards: null }).hazards).toBeNull();
});
it.each([404, 422, 502, 504, 500])('handles API error %s', async status => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ detail: status === 422 ? [] : 'Backend error' }), { status })));
  await expect(fetchReport('http://127.0.0.1:8000', 'address', new AbortController().signal)).rejects.toThrow();
});
it('sends only the address, without credentials', async () => {
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(data))); vi.stubGlobal('fetch', fetch);
  await fetchReport('https://api.example.test/v1', '400 Broad St & unit 2', new AbortController().signal);
  const [url, options] = fetch.mock.calls[0]; expect(url.searchParams.get('address')).toBe('400 Broad St & unit 2'); expect([...url.searchParams.keys()]).toEqual(['address']); expect(url.pathname).toBe('/v1/hazards'); expect(options.credentials).toBe('omit');
});
it('handles network, invalid JSON, and malformed reports', async () => {
  for (const response of [new Error('network'), new Response('not json'), new Response('{}')]) {
    vi.stubGlobal('fetch', response instanceof Error ? vi.fn().mockRejectedValue(response) : vi.fn().mockResolvedValue(response));
    await expect(fetchReport('http://localhost:8000', 'a', new AbortController().signal)).rejects.toThrow();
  }
});
it('restricts backend settings to configured origins', () => {
  expect(validateBase('https://api.test/v1/', ['https://api.test'])).toBe('https://api.test/v1');
  for (const url of ['https://evil.test', 'https://user:pass@api.test', 'https://api.test?secret=a', 'file:///tmp']) expect(() => validateBase(url, ['https://api.test'])).toThrow();
});
it('ignores an old success after a new request, even when abort is ignored', async () => {
  const latest = new LatestRequest(); let release!: (value: string) => void; const commit = vi.fn(); const fail = vi.fn();
  const old = latest.run(() => new Promise<string>(resolve => { release = resolve; }), commit, fail);
  await latest.run(async () => 'new address', commit, fail); release('old address'); await old;
  expect(commit.mock.calls).toEqual([['new address']]); expect(fail).not.toHaveBeenCalled();
});
it('ignores old failures and clears pending requests when an address is edited', async () => {
  const latest = new LatestRequest(); let reject!: (reason: Error) => void; const commit = vi.fn(); const fail = vi.fn();
  const old = latest.run(() => new Promise((_, r) => { reject = r; }), commit, fail);
  latest.invalidate(); reject(new Error('late failure')); await old; expect(fail).not.toHaveBeenCalled(); expect(commit).not.toHaveBeenCalled();
});
it('bounds requests with a deadline', async () => {
  vi.useFakeTimers(); const latest = new LatestRequest(); const fail = vi.fn();
  const task = latest.run(signal => new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason))), vi.fn(), fail);
  await vi.advanceTimersByTimeAsync(15001); await task; expect(fail.mock.calls[0][0].message).toContain('timed out');
});
