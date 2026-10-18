import test from 'node:test';
import assert from 'node:assert/strict';
import { readSavedReports, saveReport } from '../lib/saved-reports.ts';

test('successful searches are kept in cookies, refreshed by address, and bounded', () => {
  const jar = new Map();
  const previousDocument = globalThis.document;
  const previousLocation = globalThis.location;
  globalThis.document = {
    get cookie() { return [...jar].map(([name, value]) => `${name}=${value}`).join('; '); },
    set cookie(raw) {
      const [pair, ...attributes] = raw.split('; ');
      const separator = pair.indexOf('=');
      const name = pair.slice(0, separator);
      if (attributes.includes('Max-Age=0')) jar.delete(name);
      else jar.set(name, pair.slice(separator + 1));
    },
  };
  globalThis.location = { protocol: 'https:' };

  try {
    const entry = (number) => ({
      address: `${number} Main St`, query: `${number} Main St`,
      summary: `Observation at ${number} Main St.`,
      savedAt: new Date(Date.UTC(2026, 0, number)).toISOString(),
    });
    for (let number = 1; number <= 21; number++) saveReport(entry(number));
    assert.equal(readSavedReports().length, 20);
    assert.equal(readSavedReports().some((report) => report.address === '1 Main St'), false);
    saveReport({ ...entry(21), summary: 'Updated observation.' });
    assert.equal(readSavedReports().length, 20);
    assert.equal(readSavedReports()[0].summary, 'Updated observation.');
    assert.deepEqual(readSavedReports('homefield_report_broken=not-json'), []);

    saveReport({ ...entry(22), headline: 'Flood history: Water observed', severity: 'average' });
    assert.equal(readSavedReports()[0].headline, 'Flood history: Water observed');
    assert.equal(readSavedReports()[0].severity, 'average');
    assert.equal(readSavedReports().find((report) => report.address === '21 Main St').headline, undefined);
    const odd = encodeURIComponent(JSON.stringify({ ...entry(23), severity: 'purple' }));
    assert.equal(readSavedReports(`homefield_report_x=${odd}`)[0].severity, undefined);
  } finally {
    globalThis.document = previousDocument;
    globalThis.location = previousLocation;
  }
});
