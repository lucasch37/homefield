import test from 'node:test';
import assert from 'node:assert/strict';
import { addressSlug, affiliateParams, redfinDestination, redfinHomePath, redfinLinkPath, zillowUrl, zipOf } from '../lib/listing-links.ts';

const address = '400 BROAD ST, SEATTLE, WA, 98109';

test('Zillow link searches the exact address and carries partner parameters', () => {
  assert.equal(addressSlug(address), '400-BROAD-ST-SEATTLE-WA-98109');
  assert.equal(zillowUrl(address, affiliateParams(undefined)),
    'https://www.zillow.com/homes/400-BROAD-ST-SEATTLE-WA-98109_rb/?utm_source=homefield&utm_medium=referral&utm_campaign=hazard_report');
  assert.equal(zillowUrl('12 Main St #4, Kent, WA 98032', affiliateParams('?ref=abc')), 'https://www.zillow.com/homes/12-Main-St-4-Kent-WA-98032_rb/?ref=abc');
});

test('Redfin link goes through our resolver with the address', () => {
  assert.equal(redfinLinkPath(address), '/api/listing-link?site=redfin&address=400+BROAD+ST%2C+SEATTLE%2C+WA%2C+98109');
});

test('Redfin resolver prefers the exact home page, then the ZIP code page', () => {
  const body = '{}&&{"payload":{"exactMatch":{"url":"/WA/Seattle/400-Broad-St-98109/home/123"},"sections":[]}}';
  assert.equal(redfinHomePath(body), '/WA/Seattle/400-Broad-St-98109/home/123');
  assert.equal(redfinHomePath('{}&&{"payload":{"sections":[{"rows":[{"url":"/city/16163/WA/Seattle"},{"url":"/WA/Seattle/x/home/9"}]}]}}'), '/WA/Seattle/x/home/9');
  assert.equal(redfinHomePath('not json'), undefined);
  const params = affiliateParams('ref=r1');
  assert.equal(redfinDestination(address, '/WA/Seattle/400-Broad-St-98109/home/123', params), 'https://www.redfin.com/WA/Seattle/400-Broad-St-98109/home/123?ref=r1');
  assert.equal(redfinDestination(address, undefined, params), 'https://www.redfin.com/zipcode/98109?ref=r1');
  assert.equal(redfinDestination('Somewhere', undefined, params), 'https://www.redfin.com/?ref=r1');
  assert.equal(zipOf('1 Main St, Kent, WA 98032-1234'), '98032');
});
