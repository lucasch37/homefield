// Display helpers. They only reformat values that came from the hazards API; they never derive new numbers.

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "2025-12-10" -> "December 10, 2025". Returns the input unchanged if it is not an ISO date. */
export function formatDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  const [, year, month, day] = match;
  return `${MONTHS[Number(month) - 1]} ${Number(day)}, ${year}`;
}

/** Shows an API number as-is, without float noise or a trailing ".0" (39.0 -> "39", -3.6 -> "-3.6"). */
export function formatNumber(value: number): string {
  return String(Number(value.toFixed(1)));
}

/** Magnitude of an API number, for sentences that carry the direction in words ("3.6°F cooler"). */
export function formatMagnitude(value: number): string {
  return formatNumber(Math.abs(value));
}

/** [2023, 2024, 2025] -> "2023 to 2025"; a single year stays a single year. */
export function yearSpan(years?: number[]): string {
  if (!years?.length) return "";
  const first = years[0];
  const last = years[years.length - 1];
  return first === last ? String(first) : `${first} to ${last}`;
}

/** Percentile with its ordinal suffix: 39 -> "39th", 1 -> "1st", 22 -> "22nd". */
export function ordinal(value: number): string {
  const n = formatNumber(value);
  if (n.includes(".")) return `${n}th`;
  const whole = Math.abs(Number(n));
  const lastTwo = whole % 100;
  const suffix = lastTwo >= 11 && lastTwo <= 13 ? "th" : ["th", "st", "nd", "rd"][whole % 10] ?? "th";
  return `${n}${suffix}`;
}

/** Coordinates as returned, trimmed to 5 decimals (about 1 m) without padding zeros. */
export function formatCoordinate(value: number): string {
  return String(Number(value.toFixed(5)));
}

/** Plain label for a report location; coordinate lookups have no street address. */
export function placeLabel(report: { address: string | null; lat: number; lon: number }): string {
  return report.address || `Location ${formatCoordinate(report.lat)}, ${formatCoordinate(report.lon)}`;
}
