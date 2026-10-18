// What the search box accepts: a street address, or "lat, lon" for a point (handy for demos and testing).

export type SearchQuery = { address: string } | { lat: number; lon: number };

const COORDINATES = /^\s*(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/;

export function parseSearch(text: string): SearchQuery | null {
  const value = text.trim();
  if (!value) return null;
  const match = COORDINATES.exec(value);
  if (match) {
    const lat = Number(match[1]);
    const lon = Number(match[2]);
    if (Math.abs(lat) <= 90 && Math.abs(lon) <= 180) return { lat, lon };
  }
  return { address: value.slice(0, 300) };
}

export function reportUrl(query: SearchQuery): string {
  const params =
    "address" in query
      ? new URLSearchParams({ address: query.address })
      : new URLSearchParams({ lat: String(query.lat), lon: String(query.lon) });
  return `/api/report?${params}`;
}

/** Familiar King County places for quickly filling the search field. Coordinate examples are
 * validated points from the PRD and data-team checks; address examples use normal geocoding. */
export const DEMO_PLACES: { label: string; query: string }[] = [
  { label: "Seattle Center", query: "400 Broad St, Seattle, WA 98109" },
  { label: "UW, Union Bay", query: "47.65626, -122.2981" },
  { label: "Carnation valley floor", query: "47.664, -121.92" },
  { label: "Fall City", query: "3608 324th Ave SE, Fall City, WA 98024" },
  { label: "SODO, Seattle", query: "2401 Utah Ave S, Seattle, WA 98134" },
];
