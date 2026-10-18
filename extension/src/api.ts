import { normalizeReport, type ReportResult } from './report';
export function validateBase(value: string, origins: string[]): string {
  const url = new URL(value.trim());
  if (!origins.includes(url.origin) || url.username || url.password || url.search || url.hash) throw new Error('Use a backend origin included in this build. See README to configure another host.');
  return url.href.replace(/\/$/, '');
}
export async function fetchReport(base: string, address: string, signal: AbortSignal): Promise<ReportResult> {
  const url = new URL(`${base.replace(/\/$/, '')}/hazards`);
  url.searchParams.set('address', address.trim());
  let response: Response;
  try { response = await fetch(url, { signal, credentials: 'omit', cache: 'no-store', redirect: 'error', headers: { Accept: 'application/json' } }); }
  catch (error) {
    if (signal.aborted) throw error;
    throw new Error('Could not reach the report API. Check the backend URL and that the server is running.');
  }
  let body: unknown;
  try { body = await response.json(); } catch { throw new Error('The API returned an unreadable response. Please try again.'); }
  if (!response.ok) {
    const detail = (body as { detail?: unknown } | null)?.detail;
    const fallback: Record<number, string> = { 404: 'Address not found. Include the city and ZIP code.', 422: 'Enter a complete address of at most 500 characters.', 502: 'The address lookup service is unavailable. Try again.', 504: 'The address lookup timed out. Try again.' };
    throw new Error(typeof detail === 'string' ? detail.slice(0, 500) : fallback[response.status] || `Report API unavailable (${response.status}). Try again.`);
  }
  return normalizeReport(body);
}
// Invalidation is independent of AbortSignal: even a transport that ignores abort cannot commit stale results.
export class LatestRequest {
  private version = 0;
  private controller?: AbortController;
  invalidate() { this.version++; this.controller?.abort(); }
  async run<T>(task: (signal: AbortSignal) => Promise<T>, commit: (value: T) => void, fail: (error: unknown) => void) {
    this.invalidate();
    const version = this.version;
    const controller = new AbortController(); this.controller = controller;
    const timer = setTimeout(() => controller.abort(new Error('Report request timed out. Try again.')), 15000);
    try { const result = await task(controller.signal); if (version === this.version) commit(result); }
    catch (error) { if (version === this.version) fail(controller.signal.aborted ? controller.signal.reason : error); }
    finally { clearTimeout(timer); }
  }
}
