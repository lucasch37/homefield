import { resolve, structuredAddresses, text } from './common';
export function extractRedfin(doc: Document, href = doc.URL) {
  const split = [...doc.querySelectorAll('.full-address')].map(el => {
    const street = el.querySelector('.street-address')?.textContent;
    const city = el.querySelector('.dp-subtext')?.textContent;
    return street && city ? `${street}, ${city}` : el.textContent || '';
  });
  // Redfin includes standalone JSON-LD for nearby homes. Match the stable home
  // ID rather than the street slug, which can change between equivalent URLs.
  const homeId = new URL(href).pathname.match(/\/home\/(\d+)(?:\/|$)/)?.[1];
  const acceptsListingUrl = homeId ? (value: string) => {
    try {
      const url = new URL(value, href);
      return (url.hostname === 'redfin.com' || url.hostname.endsWith('.redfin.com'))
        && url.pathname.match(/\/home\/(\d+)(?:\/|$)/)?.[1] === homeId;
    } catch { return false; }
  } : undefined;
  return resolve([...split, ...text(doc, 'h1'), ...structuredAddresses(doc, acceptsListingUrl)], 'Redfin');
}
