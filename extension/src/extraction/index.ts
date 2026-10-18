import { extractZillow } from './zillow';
import { extractRedfin } from './redfin';
import type { Extraction } from './common';
export function extract(doc: Document, href: string): Extraction {
  const url = new URL(href);
  if (url.protocol !== 'https:') return { ok: false, message: 'Open a Zillow or Redfin listing, or enter an address below.' };
  if ((url.hostname === 'zillow.com' || url.hostname.endsWith('.zillow.com')) && /\/homedetails\//.test(url.pathname)) return extractZillow(doc);
  if ((url.hostname === 'redfin.com' || url.hostname.endsWith('.redfin.com')) && /\/home\/\d+/.test(url.pathname)) return extractRedfin(doc, href);
  return { ok: false, message: 'Open an individual Zillow or Redfin listing, then click the extension icon again. You can also enter an address below.' };
}
