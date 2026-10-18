export type HazardKind = "flood" | "heat" | "ground_motion";
export type HazardStatus = "flooded" | "no_flooding_seen" | "permanent_water" | "ok" | "not_enough_data" | "not_available" | "error";
export type HazardSource = { name: string; dates: string; resolution_m: number | null; limitations: string[] };
export type YearHeat = { year: number; relative_f: number | null };
export type Displacement = { date: string; mm: number | null };
export type Hazard = {
  status: HazardStatus;
  source: HazardSource;
  action?: string;
  message?: string;
  observed_passes?: number;
  wet_passes?: number;
  first_wet?: string | null;
  last_wet?: string | null;
  surface_temp_f?: number;
  county_percentile?: number;
  diff_from_median_f?: number;
  recent_relative_f?: number;
  lowland_percentile?: number;
  comparison_area?: string;
  recent_years?: number[];
  early_years?: number[];
  clear_days_used?: number;
  change_since_early_f?: number;
  yearly_relative_f?: YearHeat[];
  velocity_mm_per_yr?: number;
  series_mm?: Displacement[];
  sign_convention_verified?: boolean;
};
export type Report = { address: string; lat: number; lon: number; in_king_county: true; hazards: Record<HazardKind, Hazard>; message?: string };
export type OutsideCountyReport = { address: string; lat: number; lon: number; in_king_county: false; hazards: null; message?: string };
export type ReportResult = Report | OutsideCountyReport;
export const hazardKinds: HazardKind[] = ["flood", "heat", "ground_motion"];

const record = (value: unknown): Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const statuses: Record<HazardKind, string[]> = {
  flood: ["flooded", "no_flooding_seen", "permanent_water", "not_enough_data", "error"],
  heat: ["ok", "not_enough_data", "error", "not_available"],
  ground_motion: ["ok", "not_enough_data", "error", "not_available"],
};

// A malformed layer is isolated so other usable observations still render.
export function normalizeHazard(value: unknown, kind: HazardKind): Hazard {
  const raw = record(value);
  const src = record(raw.source);
  const result: Hazard = {
    status: statuses[kind].includes(String(raw.status)) ? raw.status as HazardStatus : "error",
    source: {
      name: typeof src.name === "string" ? src.name : "Source not provided",
      dates: typeof src.dates === "string" ? src.dates : "Observation dates not provided",
      resolution_m: finite(src.resolution_m) && src.resolution_m > 0 ? src.resolution_m : null,
      limitations: Array.isArray(src.limitations) ? src.limitations.filter((v): v is string => typeof v === "string") : [],
    },
  };
  for (const key of ["action", "message", "comparison_area"] as const) {
    if (typeof raw[key] === "string" && raw[key].trim()) result[key] = raw[key];
  }
  for (const key of ["observed_passes", "wet_passes", "surface_temp_f", "county_percentile", "diff_from_median_f", "recent_relative_f", "lowland_percentile", "clear_days_used", "change_since_early_f", "velocity_mm_per_yr"] as const) {
    if (finite(raw[key])) result[key] = raw[key];
  }
  for (const key of ["first_wet", "last_wet"] as const) {
    if (typeof raw[key] === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw[key])) result[key] = raw[key];
  }
  for (const key of ["recent_years", "early_years"] as const) {
    if (Array.isArray(raw[key])) result[key] = raw[key].filter(finite);
  }
  if (Array.isArray(raw.yearly_relative_f)) {
    result.yearly_relative_f = raw.yearly_relative_f.flatMap((value) => {
      const item = record(value);
      return finite(item.year) && (item.relative_f === null || finite(item.relative_f))
        ? [{ year: item.year, relative_f: item.relative_f }]
        : [];
    });
  }
  if (Array.isArray(raw.series_mm)) {
    result.series_mm = raw.series_mm.flatMap((value) => {
      const item = record(value);
      return typeof item.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item.date) && (item.mm === null || finite(item.mm))
        ? [{ date: item.date, mm: item.mm }]
        : [];
    });
  }
  if (typeof raw.sign_convention_verified === "boolean") result.sign_convention_verified = raw.sign_convention_verified;
  if (result.status === "ok" && !finite(kind === "heat" ? result.surface_temp_f : result.velocity_mm_per_yr)) result.status = "not_enough_data";
  if (result.status === "no_flooding_seen" && (!finite(result.observed_passes) || result.observed_passes < 0)) result.status = "not_enough_data";
  return result;
}

export function normalizeReport(value: unknown): ReportResult {
  const raw = record(value);
  const message = typeof raw.message === "string" && raw.message.trim() ? raw.message : undefined;
  if (raw.in_king_county === false) {
    if (!finite(raw.lat) || !finite(raw.lon) || Math.abs(raw.lat) > 90 || Math.abs(raw.lon) > 180) throw new Error("The report service returned an incomplete location. Please try again.");
    return { address: typeof raw.address === "string" ? raw.address : "", lat: raw.lat, lon: raw.lon, in_king_county: false, hazards: null, ...(message ? { message } : {}) };
  }
  if (raw.in_king_county !== true || typeof raw.address !== "string" || !finite(raw.lat) || !finite(raw.lon) || Math.abs(raw.lat) > 90 || Math.abs(raw.lon) > 180) throw new Error("The report service returned an incomplete location. Please try again.");
  const hazards = record(raw.hazards);
  return { address: raw.address, lat: raw.lat, lon: raw.lon, in_king_county: true, hazards: Object.fromEntries(hazardKinds.map(kind => [kind, normalizeHazard(hazards[kind], kind)])) as Report["hazards"], ...(message ? { message } : {}) };
}
