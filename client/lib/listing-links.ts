// Partner links that open Zillow with the searched home already looked up.
// Affiliate/tracking parameters come from NEXT_PUBLIC_ZILLOW_AFFILIATE_PARAMS
// (a query string, e.g. "ref=abc123"); UTM tags are the default.

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
