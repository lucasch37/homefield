import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { extractZillow } from '../src/extraction/zillow';
import { extractRedfin } from '../src/extraction/redfin';
import { extract } from '../src/extraction';
const fixture = (name: string) => new DOMParser().parseFromString(readFileSync(`tests/fixtures/${name}.html`, 'utf8'), 'text/html');
describe.each([['Zillow', extractZillow, 'zillow'], ['Redfin', extractRedfin, 'redfin']] as const)('%s extraction', (_, extractor, name) => {
  it('reads the listing without collecting recommendation addresses', () => {
    const result = extractor(fixture(name)); expect(result.ok).toBe(true);
    if (result.ok) expect(result.address).toBe(name === 'zillow' ? '1234 NE 45th St, Seattle, WA 98105' : '400 Broad St, Seattle, WA 98109');
  });
  it('fails closed for missing addresses', () => expect(extractor(fixture('missing')).ok).toBe(false));
  it('fails closed for ambiguous addresses', () => expect(extractor(fixture('ambiguous')).ok).toBe(false));
  it('rejects conflicting structured metadata', () => {
    const doc = fixture(name);
    const script = doc.createElement('script'); script.type = 'application/ld+json'; script.textContent = JSON.stringify({ '@type': 'House', address: { streetAddress: '5 Other St', addressLocality: 'Seattle', addressRegion: 'WA', postalCode: '98105' } }); doc.body.append(script);
    expect(extractor(doc).ok).toBe(false);
  });
});
it('requires an individual listing and an exact supported domain', () => {
  for (const url of ['https://www.zillow.com/seattle-wa/', 'https://redfin.com/city/1', 'https://zillow.com.evil.test/homedetails/1', 'https://fake-redfin.com/home/1']) expect(extract(fixture('zillow'), url).ok).toBe(false);
  expect(extract(fixture('zillow'), 'https://www.zillow.com/homedetails/123/1_zpid/').ok).toBe(true);
  expect(extract(fixture('redfin'), 'https://www.redfin.com/WA/Seattle/400-Broad-St-98109/home/123').ok).toBe(true);
});

const redmondUrl = 'https://www.redfin.com/WA/Redmond/11000-243rd-Ave-NE-98053/home/18659506';
it('ignores nearby-home metadata on the reported Redmond listing', () => {
  expect(extract(fixture('redfin-recommendations'), redmondUrl)).toEqual({ ok: true, address: '11000 243rd Ave NE, Redmond, WA 98053', site: 'Redfin' });
});
it('still rejects conflicting addresses for the current Redfin home ID', () => {
  const doc = fixture('redfin-recommendations');
  const script = doc.createElement('script'); script.type = 'application/ld+json';
  script.textContent = JSON.stringify({ '@type': 'SingleFamilyResidence', url: redmondUrl, address: { streetAddress: '5 Other St', addressLocality: 'Seattle', addressRegion: 'WA', postalCode: '98105' } });
  doc.body.append(script);
  expect(extract(doc, redmondUrl).ok).toBe(false);
});
it('matches Redfin home IDs across slug variants without accepting different homes', () => {
  expect(extract(fixture('redfin-recommendations'), 'https://redfin.com/WA/Redmond/updated-slug/home/18659506?source=share').ok).toBe(true);
  const doc = fixture('redfin-recommendations'); doc.querySelector('h1')!.remove();
  expect(extract(doc, redmondUrl)).toEqual({ ok: true, address: '11000 243rd Ave NE, Redmond, WA 98053', site: 'Redfin' });
});
it('does not use recommendation-only metadata when the listing address is missing', () => {
  const doc = fixture('redfin-recommendations'); doc.querySelector('h1')!.remove();
  doc.querySelector('script')!.remove();
  expect(extract(doc, redmondUrl).ok).toBe(false);
});
