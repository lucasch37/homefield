export type Extraction = { ok: true; address: string; site: string } | { ok: false; message: string };
const clean = (s: string) => s.replace(/\s+/g, ' ').replace(/\s*,\s*/g, ', ').trim();
const key = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
export function structuredAddresses(doc: Document, acceptsListingUrl?: (url: string) => boolean): string[] {
  const found: string[] = [];
  function visit(value: unknown) {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) { value.forEach(visit); return; }
    const item = value as Record<string, unknown>;
    const type = [item['@type']].flat().join(' ');
    if (/^(?:.*\s)?(?:SingleFamilyResidence|Residence|House|Apartment|Product|RealEstateListing)(?:\s.*)?$/.test(type)) {
      // Recommendation cards may each embed their own property JSON-LD.
      // A listing's mainEntity inherits its parent's accepted URL scope.
      if (acceptsListingUrl && typeof item.url === 'string' && !acceptsListingUrl(item.url)) return;
      const a = item.address as Record<string, unknown> | undefined;
      if (a && typeof a === 'object' && typeof a.streetAddress === 'string' && typeof a.addressLocality === 'string' && typeof a.addressRegion === 'string') {
        found.push([a.streetAddress, a.addressLocality, [a.addressRegion, a.postalCode].filter(v => typeof v === 'string').join(' ')].join(', '));
      }
    }
    visit(item['@graph']); visit(item.mainEntity);
  }
  for (const script of doc.querySelectorAll('script[type="application/ld+json"]')) {
    try { visit(JSON.parse(script.textContent || '')); } catch { /* Ignore unrelated malformed metadata. */ }
  }
  return found;
}
export function resolve(candidates: string[], site: string): Extraction {
  const addresses = [...new Map(candidates.map(clean).filter(s => /^\d+[\w-]*\s+.+,\s*.+,?\s+[A-Z]{2}\s+\d{5}(?:-\d{4})?$/i.test(s) && s.length <= 500).map(s => [key(s), s])).values()];
  if (addresses.length === 1) return { ok: true, address: addresses[0], site };
  return { ok: false, message: addresses.length > 1 ? 'Multiple listing addresses were found. Enter the property address below.' : 'No complete listing address was found. Enter the street, city, state, and ZIP below.' };
}
export function text(doc: Document, selector: string): string[] {
  return [...doc.querySelectorAll(selector)].map(el => el.textContent || '');
}
