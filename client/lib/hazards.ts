import { buildFacts, heatLabel } from "./facts.ts";
import { formatDate, formatMagnitude, formatNumber, ordinal, yearSpan } from "./format.ts";
import { hazardSeverity, type Severity } from "./severity.ts";
import type { Hazard, HazardKind, Report } from "./types.ts";

// Links still need a manual check before the demo (the PRD marks the flood alert link VERIFY).
export const hazardMeta: Record<HazardKind, { title: string; eyebrow: string; action: string; actionDetail: string; href?: string; linkLabel?: string }> = {
  flood: { href: "https://green2.kingcounty.gov/floodalertsystem/Register.aspx", linkLabel: "Sign up for flood alerts", title: "Flood history", eyebrow: "WATER", action: "Sign up for King County flood alerts.", actionDetail: "Ask your landlord about past flooding and how you would leave if water rises." },
  heat: { href: "https://kingcounty.gov/beattheheat", linkLabel: "Find hot-weather resources", title: "Surface heat", eyebrow: "TEMPERATURE", action: "Find local cooling centers and ways to keep your home cool.", actionDetail: "Ask about shade, ventilation, and cooling in your home before summer." },
  ground_motion: { title: "Ground movement", eyebrow: "LAND", action: "Watch for new foundation or wall cracks and ask your landlord or an inspector.", actionDetail: "Note any new cracks or sticking doors, and ask a qualified inspector about changes." },
};

const HEAT_BADGES: Record<string, string> = {
  "much hotter than most of lowland King County": "Much hotter than typical",
  "hotter than most of lowland King County": "Hotter than typical",
  "typical for lowland King County": "Typical",
  "cooler than most of lowland King County": "Cooler than typical",
};

export type Finding = { label: string; text: string; metric?: string; detail?: string };

function wetDates(hazard: Hazard): string | undefined {
  if (!hazard.first_wet || !hazard.last_wet) return undefined;
  return hazard.first_wet === hazard.last_wet
    ? `Water seen on ${formatDate(hazard.first_wet)}`
    : `Water first seen ${formatDate(hazard.first_wet)}, most recently ${formatDate(hazard.last_wet)}`;
}

/** Card wording for each status. Every number comes straight from the API response. */
export function finding(hazard: Hazard, kind: HazardKind): Finding {
  switch (hazard.status) {
    case "error":
      return { label: "Unavailable", text: "This layer is unavailable right now. The other cards are unaffected." };
    case "not_available":
      return { label: "Not available", text: "This layer isn’t part of the report yet." };
    case "not_enough_data":
      return { label: "No reliable reading", text: "Satellites couldn’t get a reliable reading here. That is not the same as no hazard.", detail: hazard.message };
    case "flooded":
      return {
        label: "Water observed",
        text: `Satellite radar saw water at this spot on ${hazard.wet_passes !== undefined ? formatNumber(hazard.wet_passes) : "some"} of ${hazard.observed_passes !== undefined ? formatNumber(hazard.observed_passes) : "its"} valid passes.`,
        metric: hazard.wet_passes !== undefined && hazard.observed_passes !== undefined ? `${formatNumber(hazard.wet_passes)} of ${formatNumber(hazard.observed_passes)} passes` : undefined,
        detail: wetDates(hazard),
      };
    case "no_flooding_seen":
      return {
        label: "Not observed",
        text: `No flooding was observed in ${formatNumber(hazard.observed_passes ?? 0)} satellite passes. Passes are days apart, so this does not rule out flooding.`,
        metric: hazard.wet_passes !== undefined && hazard.observed_passes !== undefined ? `${formatNumber(hazard.wet_passes)} of ${formatNumber(hazard.observed_passes)} passes` : undefined,
      };
    case "permanent_water":
      return {
        label: "Persistent water",
        text: "Water was seen on at least half of valid passes, which points to a river, lake, or pond. The pin may be on the water rather than the home.",
        metric: hazard.wet_passes !== undefined && hazard.observed_passes !== undefined ? `${formatNumber(hazard.wet_passes)} of ${formatNumber(hazard.observed_passes)} passes` : undefined,
        detail: wetDates(hazard),
      };
    case "ok":
      if (kind === "heat") {
        const rel = hazard.recent_relative_f;
        const years = yearSpan(hazard.recent_years);
        const label = heatLabel(hazard);
        return {
          label: label ? HEAT_BADGES[label] ?? "Observed" : "Observed",
          text: `Average ground and roof surface temperature around noon on clear summer days${years ? ` (${years})` : ""}. Not air or indoor temperature.`,
          metric: hazard.surface_temp_f !== undefined ? `${formatNumber(hazard.surface_temp_f)}°F` : undefined,
          detail: [
            rel === undefined ? null : rel === 0 ? "Same as a typical lowland King County spot on the same days" : `${formatMagnitude(rel)}°F ${rel > 0 ? "hotter" : "cooler"} than a typical lowland King County spot on the same days`,
            hazard.lowland_percentile !== undefined ? `${ordinal(hazard.lowland_percentile)} percentile` : null,
          ].filter(Boolean).join(" · ") || undefined,
        };
      }
      return {
        label: "Movement measured",
        text: "Slow movement measured along the satellite’s slanted line of sight. This is not earthquake shaking.",
        metric: hazard.velocity_mm_per_yr !== undefined ? `${formatNumber(hazard.velocity_mm_per_yr)} mm/yr` : undefined,
        detail: "The sign’s direction hasn’t been verified yet, so this doesn’t say whether the ground is rising or sinking.",
      };
  }
}

/** The lead finding in a few words, e.g. "Flood history: Water observed", for saved report cards. */
export function reportHeadline(report: Report): { headline: string; severity: Severity } | null {
  const lead = buildFacts(report).lead;
  if (!lead) return null;
  const hazard = report.hazards[lead];
  return {
    headline: `${hazardMeta[lead].title}: ${finding(hazard, lead).label}`,
    severity: hazardSeverity[lead](hazard),
  };
}
