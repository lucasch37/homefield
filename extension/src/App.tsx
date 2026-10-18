import { useEffect, useRef, useState, type ReactNode } from 'react';
import { fetchReport, LatestRequest, validateBase } from './api';
import { hazardKinds, type Hazard, type HazardKind, type ReportResult } from './report';
import { finding, hazardMeta, severityFor } from './hazards';
import type { Extraction } from './extraction/common';
import './style.css';

function IconFlood() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 16.3c2.2 0 3-1.3 3-2.3s-1-1.5-2-2c-1.3-.7-2-1.6-2-2.7 0-1.8 1.8-3.3 4-3.3s4 1.5 4 3.3c0 1.1-.7 2-2 2.7-1 .5-2 1-2 2s.8 2.3 3 2.3c3.5 0 6-2.5 6-5.5S16.5 4 12 4 4 7 4 10.8c0 3 2.5 5.5 6 5.5z" /><path d="M12 20v-4" /></svg>;
}
function IconHeat() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>;
}
function IconGround() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 12h-2.5a2.5 2.5 0 0 0-2.4 1.9L16 17.5l-1.6-7.8A2 2 0 0 0 12.5 8h-1A2.5 2.5 0 0 1 9 5.5V2" /><path d="M2 14h2.5a2.5 2.5 0 0 1 2.4 1.9L8 19.5l1.6-7.8A2 2 0 0 1 11.5 10h1" /></svg>;
}
function IconPin() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>;
}
function IconInfo() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>;
}
function IconOrbit() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.6.9 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></svg>;
}

const hazardIcon: Record<HazardKind, () => ReactNode> = {
  flood: IconFlood,
  heat: IconHeat,
  ground_motion: IconGround,
};

function HazardCard({ kind, hazard }: { kind: HazardKind; hazard: Hazard }) {
  const result = finding(hazard, kind);
  const severity = severityFor(hazard, kind);
  const Icon = hazardIcon[kind];
  return <article className={`hazard tone-${severity}`}>
    <div className="card-heading">
      <h3><span className="symbol"><Icon /></span>{hazardMeta[kind].title}</h3>
      <span className="badge">{result.label}</span>
    </div>
    {result.metric && <p className="metric">{result.metric}</p>}
    <p>{result.text}</p>
    {result.detail && <p className="detail">{result.detail}</p>}
    {kind === 'flood' && <dl><dt>Valid passes</dt><dd>{hazard.observed_passes ?? 'Unavailable'}</dd><dt>Wet passes</dt><dd>{hazard.wet_passes ?? 'Unavailable'}</dd><dt>First / last wet</dt><dd>{hazard.first_wet ?? 'Unavailable'} / {hazard.last_wet ?? 'Unavailable'}</dd></dl>}
    {kind === 'heat' && <dl><dt>Lowland percentile</dt><dd>{hazard.lowland_percentile ?? 'Unavailable'}</dd><dt>Comparison area</dt><dd>{hazard.comparison_area ?? 'Unavailable'}</dd><dt>Recent years</dt><dd>{hazard.recent_years?.join(', ') || 'Unavailable'}</dd><dt>Clear observations (all years)</dt><dd>{hazard.clear_days_used ?? 'Unavailable'}</dd></dl>}
    {kind === 'ground_motion' && <p className="note">{hazard.sign_convention_verified ? 'Source sign convention verified. Velocity is along the satellite line of sight.' : 'Sign convention is unverified. Do not interpret the sign as sinking or rising.'} This does not establish structural safety.</p>}
    {hazard.message && <p className="note">{hazard.message}</p>}
    {hazard.action && <p className="action"><strong>Next step</strong><br />{hazard.action}</p>}
    <details><summary>Source & limitations</summary><dl><dt>Source</dt><dd>{hazard.source.name}</dd><dt>Dates</dt><dd>{hazard.source.dates || 'Unavailable'}</dd><dt>Resolution</dt><dd>{hazard.source.resolution_m === null ? 'Unavailable' : `${hazard.source.resolution_m} m`}</dd></dl>
      {hazard.source.limitations.length ? <ul>{hazard.source.limitations.map((s, i) => <li key={i}>{s}</li>)}</ul> : <p>Source limitations were not provided. Interpret observations with care.</p>}
      {kind === 'ground_motion' && !!hazard.series_mm?.length && <><h4>Displacement history</h4><table><thead><tr><th>Date</th><th>mm</th></tr></thead><tbody>{hazard.series_mm.map((s, i) => <tr key={i}><td>{s.date}</td><td>{s.mm ?? 'Unavailable'}</td></tr>)}</tbody></table></>}
      {kind === 'heat' && !!hazard.yearly_relative_f?.length && <><h4>Yearly relative heat</h4><table><thead><tr><th>Year</th><th>°F vs daily lowland median</th></tr></thead><tbody>{hazard.yearly_relative_f.map((s, i) => <tr key={i}><td>{s.year}</td><td>{s.relative_f ?? 'Unavailable'}</td></tr>)}</tbody></table></>}
    </details>
  </article>;
}

export function App() {
  const [address, setAddress] = useState('');
  const [base, setBase] = useState(__API_BASE__);
  const [baseDraft, setBaseDraft] = useState(__API_BASE__);
  const [ready, setReady] = useState(false);
  const [report, setReport] = useState<ReportResult | null>(null);
  const [submitted, setSubmitted] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const requests = useRef(new LatestRequest());
  const extractionVersion = useRef(0);
  const clear = () => { requests.current.invalidate(); extractionVersion.current++; setReport(null); setLoading(false); setExtracting(false); setMessage(''); };
  useEffect(() => {
    let mounted = true;
    chrome.storage.local.get('apiBase').then(({ apiBase }) => {
      if (!mounted) return;
      try { const saved = validateBase(typeof apiBase === 'string' ? apiBase : __API_BASE__, __API_ORIGINS__); setBase(saved); setBaseDraft(saved); } catch { /* Discard a setting from a previous build. */ }
    }).catch(() => { if (mounted) setMessage('Could not load settings; using the default backend.'); }).finally(() => { if (mounted) setReady(true); });
    return () => { mounted = false; requests.current.invalidate(); extractionVersion.current++; };
  }, []);
  useEffect(() => {
    if (!ready) return;
    let mounted = true;
    let port: chrome.runtime.Port | undefined;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    function connect(windowId: number) {
      if (!mounted) return;
      port = chrome.runtime.connect({ name: `hazard-panel:${windowId}` });
      port.onMessage.addListener(message => {
        if (message?.type === 'analyze-listing') void analyze();
      });
      // Reconnect when the browser suspends and restarts the service worker.
      port.onDisconnect.addListener(() => {
        if (mounted) reconnectTimer = setTimeout(() => connect(windowId), 250);
      });
    }
    void chrome.windows.getCurrent().then(window => {
      if (!mounted) return;
      if (window.id !== undefined) connect(window.id);
      void analyze();
    }).catch(() => {
      if (mounted) void analyze();
    });
    return () => {
      mounted = false;
      clearTimeout(reconnectTimer);
      port?.disconnect();
      requests.current.invalidate();
      extractionVersion.current++;
    };
  }, [ready, base]);
  async function analyze() {
    clear(); setAddress(''); setExtracting(true);
    const version = extractionVersion.current;
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id || !tab.url || !/^https:\/\/([\w-]+\.)*(zillow|redfin)\.com\//.test(tab.url)) throw new Error('Open a Zillow or Redfin listing and click the extension toolbar icon to grant access. Or enter an address below.');
      const injected = await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
      if (version !== extractionVersion.current) return;
      const result = injected[0]?.result as Extraction | undefined;
      if (!result || !result.ok) throw new Error(result?.message || 'Could not read this listing. Enter its address below.');
      setAddress(result.address);
      setExtracting(false);
      void submit(result.address);
    } catch (error) { if (version === extractionVersion.current) setMessage(error instanceof Error ? error.message : 'Listing access failed. Click the extension toolbar icon on the listing, or enter its address.'); }
    finally { if (version === extractionVersion.current) setExtracting(false); }
  }
  async function submit(value = address) {
    clear(); const query = value.trim();
    if (!query || query.length > 500) { setMessage('Enter an address of 1–500 characters.'); return; }
    setSubmitted(query); setLoading(true);
    await requests.current.run(signal => fetchReport(base, query, signal), result => { setReport(result); setLoading(false); }, error => { setMessage(error instanceof Error ? error.message : 'Report failed. Please try again.'); setLoading(false); });
  }
  async function saveBase() {
    clear();
    try { const next = validateBase(baseDraft, __API_ORIGINS__); await chrome.storage.local.set({ apiBase: next }); setBase(next); setBaseDraft(next); setMessage('Backend setting saved.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Could not save the backend setting.'); }
  }
  return <>
    <header>
      <div className="brand-row">
        <div className="wordmark">homefield<span className="dot">.</span></div>
        <span className="region"><IconPin />King County, WA</span>
      </div>
      <h1>See your home from <em>above.</em></h1>
      <p>Satellite observations of flooding, heat, and ground movement — with sources and limitations.</p>
    </header>
    <main>
      <section className="search">
        <p className="hint">The current listing is read automatically. You can correct the address below.</p>
        <form onSubmit={event => { event.preventDefault(); void submit(); }}>
          <label htmlFor="address">Property address</label>
          <textarea id="address" rows={3} maxLength={500} placeholder="Street, city, WA ZIP" value={address} onChange={event => { clear(); setAddress(event.target.value); }} />
          <button disabled={!ready || loading || !address.trim()} type="submit">{loading ? 'Reading observations…' : 'Explore this home →'}</button>
        </form>
      </section>
      <div aria-live="polite" role="status">
        {extracting && <p className="notice" aria-busy="true">Reading listing address…</p>}
        {message && <p className="notice">{message}</p>}
        {loading && <p className="notice" aria-busy="true">Looking up the address and satellite observations…</p>}
      </div>
      {report && <section aria-label="Hazard report">
        <div className="report-heading">
          <span className="eyebrow">OBSERVATIONS FOR</span>
          <h2>{report.address || submitted}</h2>
          <p>{report.lat.toFixed(5)}, {report.lon.toFixed(5)}</p>
        </div>
        {!report.in_king_county ? (
          <p className="notice">{report.message || 'This report covers King County, Washington only.'} No hazard observations are available for this location.</p>
        ) : <>
          {report.message && <p className="notice">{report.message}</p>}
          <div className="severity-scale" aria-label="Hazard severity scale">
            <span className="good"><i />Good</span>
            <span className="average"><i />Average</span>
            <span className="hazardous"><i />Hazardous</span>
            <span className="critical"><i />Critical</span>
          </div>
          {hazardKinds.map(kind => <HazardCard key={kind} kind={kind} hazard={report.hazards[kind]} />)}
        </>}
      </section>}
      {!report && !loading && !extracting && <div className="empty">
        <div className="empty-icon"><IconOrbit /></div>
        <h2>Know what’s been observed.</h2>
        <p>Flood history · Surface heat · Ground movement</p>
        <p>Read a listing or enter an address to begin.</p>
      </div>}
      <p className="disclaimer"><IconInfo />Observations are not predictions or a safety rating. Missing data does not mean no hazard. Coverage is limited to King County, Washington.</p>
      <details className="settings">
        <summary>API settings</summary>
        <label htmlFor="backend">Backend base URL</label>
        <input id="backend" type="url" value={baseDraft} onChange={event => setBaseDraft(event.target.value)} />
        <button className="secondary" disabled={!ready} onClick={saveBase}>Save backend</button>
        <p>Configured origins: {__API_ORIGINS__.join(', ')}. Rebuild to add a host.</p>
        <p>Only your submitted address is sent to this backend. Only this URL setting is stored.</p>
      </details>
    </main>
    <footer>
      <span className="footer-brand">homefield<span className="dot">.</span></span>
      <span className="tagline">A closer look. A more informed next step.</span>
    </footer>
  </>;
}
