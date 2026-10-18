// Partner links that open real-estate sites with the searched home already looked up.
// Affiliate/tracking parameters come from NEXT_PUBLIC_ZILLOW_AFFILIATE_PARAMS and
// NEXT_PUBLIC_REDFIN_AFFILIATE_PARAMS (a query string, e.g. "ref=abc123"); UTM tags are the default.

const DEFAULT_PARAMS = "utm_source=homefield&utm_medium=referral&utm_campaign=hazard_report";

export function affiliateParams(value: string | undefined): URLSearchParams {
  return new URLSearchParams((value ?? DEFAULT_PARAMS).trim().replace(/^\?/, ""));
}

function withParams(url: string, params: URLSearchParams): string {
  const target = new URL(url);
  params.forEach((value, key) => target.searchParams.set(key, value));
  return target.toString();
}

/** "400 BROAD ST, SEATTLE, WA, 98109" -> "400-BROAD-ST-SEATTLE-WA-98109" */
export function addressSlug(address: string): string {
  return address.trim().replace(/[^A-Za-z0-9#]+/g, "-").replace(/#/g, "").replace(/^-+|-+$/g, "");
}

/** Zillow's address search URL (`/homes/<address>_rb/`) opens that address directly. */
export function zillowUrl(address: string, params: URLSearchParams): string {
  return withParams(`https://www.zillow.com/homes/${encodeURIComponent(addressSlug(address))}_rb/`, params);
}

/** Redfin has no address search URL, so our server resolves the home page and redirects. */
export function redfinLinkPath(address: string): string {
  return `/api/listing-link?${new URLSearchParams({ site: "redfin", address: address.slice(0, 300) })}`;
}

export function zipOf(address: string): string | undefined {
  return /\b(\d{5})(?:-\d{4})?\b(?!.*\b\d{5}\b)/.exec(address)?.[1];
}

/** Picks the home's page from Redfin's location-autocomplete response ("{}&&{json}"). */
export function redfinHomePath(body: string): string | undefined {
  try {
    const data = JSON.parse(body.replace(/^\{\}&&/, ""));
    const exact = data?.payload?.exactMatch?.url;
    if (typeof exact === "string" && exact.startsWith("/")) return exact;
    for (const section of data?.payload?.sections ?? []) {
      for (const row of section?.rows ?? []) {
        if (typeof row?.url === "string" && /\/home\/\d+/.test(row.url)) return row.url;
      }
    }
  } catch {}
  return undefined;
}

/** Where the Redfin link lands: the home page when found, otherwise the ZIP code's search page. */
export function redfinDestination(address: string, homePath: string | undefined, params: URLSearchParams): string {
  const zip = zipOf(address);
  const url = homePath
    ? `https://www.redfin.com${homePath}`
    : zip ? `https://www.redfin.com/zipcode/${zip}` : "https://www.redfin.com/";
  return withParams(url, params);
}
