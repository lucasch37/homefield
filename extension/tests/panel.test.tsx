import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { App } from '../src/App';
let root: Root;
let container: HTMLDivElement;
let onToolbar: (message: unknown) => void;
const outside = (address = '400 Broad St') => new Response(JSON.stringify({ address, lat: 48, lon: -123, in_king_county: false, hazards: null }));
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('__API_BASE__', 'http://127.0.0.1:8000');
  vi.stubGlobal('__API_ORIGINS__', ['http://127.0.0.1:8000']);
  vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => outside()));
  vi.stubGlobal('chrome', {
    storage: { local: { get: vi.fn().mockResolvedValue({}), set: vi.fn().mockResolvedValue(undefined) } },
    windows: { getCurrent: vi.fn().mockResolvedValue({ id: 1 }) },
    runtime: { connect: vi.fn().mockImplementation(() => ({ onMessage: { addListener: (callback: typeof onToolbar) => { onToolbar = callback; } }, onDisconnect: { addListener: vi.fn() }, disconnect: vi.fn() })) },
    tabs: { query: vi.fn().mockResolvedValue([{ id: 1, url: 'https://www.zillow.com/homedetails/123/1_zpid/' }]) },
    scripting: { executeScript: vi.fn().mockResolvedValue([{ result: { ok: true, address: '400 Broad St, Seattle, WA 98109', site: 'Zillow' } }]) }
  });
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); });
async function mount() { await act(async () => root.render(<App />)); }
async function submit() { await act(async () => { container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); }); }
async function edit(value: string) {
  const field = container.querySelector('textarea')!;
  await act(async () => { Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(field, value); field.dispatchEvent(new Event('input', { bubbles: true })); });
}
it('automatically extracts and fetches when opened, keeping corrections editable', async () => {
  await mount();
  expect(container.querySelector('textarea')!.value).toContain('400 Broad St');
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(container.textContent).not.toContain('Read current listing');
  expect(container.textContent).toContain('No hazard observations are available');
  await edit('5 Other St, Seattle, WA 98109');
  expect(container.textContent).not.toContain('No hazard observations are available');
  await submit(); expect(fetch).toHaveBeenCalledTimes(2);
  expect(vi.mocked(fetch).mock.calls[1][0].toString()).toContain('5+Other+St');
});
it('uses the saved backend before fetching automatically', async () => {
  vi.mocked(chrome.storage.local.get).mockResolvedValue({ apiBase: 'http://127.0.0.1:8000/v1' } as never);
  await mount(); expect(vi.mocked(fetch).mock.calls[0][0].toString()).toContain('/v1/hazards?');
});
it('refreshes an already open panel on subsequent toolbar clicks', async () => {
  await mount();
  vi.mocked(chrome.scripting.executeScript).mockResolvedValueOnce([{ result: { ok: true, address: '5 Other St, Seattle, WA 98109', site: 'Redfin' } }] as never);
  await act(async () => onToolbar({ type: 'analyze-listing' }));
  expect(container.querySelector('textarea')!.value).toContain('5 Other St');
  expect(fetch).toHaveBeenCalledTimes(2);
});
it('never shows a late automatic report under an edited address', async () => {
  let resolve!: (response: Response) => void;
  vi.stubGlobal('fetch', vi.fn().mockImplementation(() => new Promise<Response>(r => { resolve = r; })));
  await mount(); expect(container.textContent).toContain('Reading observations');
  await edit('5 Other St, Seattle, WA 98109');
  await act(async () => resolve(outside('OLD CANONICAL ADDRESS')));
  expect(container.textContent).not.toContain('OLD CANONICAL ADDRESS'); expect(container.textContent).not.toContain('No hazard observations are available');
});
it('does not replace a manual edit with a late extraction', async () => {
  let resolve!: (value: unknown) => void;
  vi.mocked(chrome.scripting.executeScript).mockImplementationOnce(() => new Promise(r => { resolve = r; }) as never);
  await mount();
  await edit('5 Other St, Seattle, WA 98109');
  await act(async () => resolve([{ result: { ok: true, address: 'OLD LISTING', site: 'Zillow' } }]));
  expect(container.querySelector('textarea')!.value).toContain('5 Other St'); expect(fetch).not.toHaveBeenCalled();
});
it('offers manual entry on extraction failure and displays API failures', async () => {
  vi.mocked(chrome.scripting.executeScript).mockRejectedValueOnce(new Error('Cannot access listing'));
  await mount(); expect(container.textContent).toContain('Cannot access listing'); expect(fetch).not.toHaveBeenCalled();
  await edit('400 Broad St, Seattle, WA 98109');
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ detail: 'Geocoder unavailable' }), { status: 502 })));
  await submit(); expect(container.textContent).toContain('Geocoder unavailable');
});
