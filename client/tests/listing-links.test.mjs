import test from 'node:test';
import assert from 'node:assert/strict';
import { addressSlug, affiliateParams, zillowUrl } from '../lib/listing-links.ts';

const address = '400 BROAD ST, SEATTLE, WA, 98109';

test('Zillow link searches the exact address and carries partner parameters', () => {
  assert.equal(addressSlug(address), '400-BROAD-ST-SEATTLE-WA-98109');
  assert.equal(zillowUrl(address, affiliateParams(undefined)),
    'https://www.zillow.com/homes/400-BROAD-ST-SEATTLE-WA-98109_rb/?utm_source=homefield&utm_medium=referral&utm_campaign=hazard_report');
  assert.equal(zillowUrl('12 Main St #4, Kent, WA 98032', affiliateParams('?ref=abc')), 'https://www.zillow.com/homes/12-Main-St-4-Kent-WA-98032_rb/?ref=abc');
});
