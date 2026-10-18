import { resolve, structuredAddresses, text } from './common';
export function extractZillow(doc: Document) {
  return resolve([...text(doc, 'h1'), ...structuredAddresses(doc)], 'Zillow');
}
