import type { Hazard, HazardKind } from "./types";

export const hazardMeta: Record<HazardKind, { title: string; eyebrow: string; action: string; actionDetail: string; href?: string; linkLabel?: string }> = {
  flood: { href: "https://green2.kingcounty.gov/floodalertsystem/Register.aspx", linkLabel: "Sign up for flood alerts", title: "Flood history", eyebrow: "WATER", action: "Prepare for high water", actionDetail: "Check King County flood alerts and ask your landlord about past flooding and an evacuation plan." },
  heat: { href: "https://kingcounty.gov/beattheheat", linkLabel: "Find hot-weather resources", title: "Surface heat", eyebrow: "TEMPERATURE", action: "Make a plan for hot days", actionDetail: "Find a nearby cooling space and ask about shade, ventilation, and cooling in your home." },
  ground_motion: { title: "Ground movement", eyebrow: "LAND", action: "Know what to look for", actionDetail: "Watch for new wall or foundation cracks. Ask your landlord or a qualified inspector about changes." },
};
export function finding(hazard: Hazard, kind: HazardKind): { label: string; text: string; metric?: string; detail?: string } {
  switch (hazard.status) {
    case "error": return { label: "Unavailable", text: "This layer is unavailable right now." };
    case "not_available": return { label: "Not available", text: "This observation layer isn’t available yet." };
    case "not_enough_data": return { label: "Limited data", text: "Satellites couldn’t get a reliable reading here." };
    case "flooded": return { label: "Water observed", text: "Satellite passes observed water at this location.", metric: hazard.wet_passes !== undefined ? `${hazard.wet_passes} wet ${hazard.wet_passes === 1 ? "pass" : "passes"}` : undefined, detail: hazard.last_wet ? `Last observed ${hazard.last_wet}` : undefined };
    case "no_flooding_seen": return { label: "Not observed", text: `No flooding was observed in ${hazard.observed_passes} satellite passes. This does not rule out flooding.` };
    case "permanent_water": return { label: "Persistent water", text: "Water was observed on at least half of valid passes, consistent with a persistent water body." };
    case "ok":
      if (kind === "heat") {
        const difference = hazard.recent_relative_f ?? hazard.diff_from_median_f;
        return { label: "Observed", text: "Ground and roof surface temperature on the observed days, not air or indoor temperature.", metric: `${hazard.surface_temp_f?.toFixed(1)}°F`, detail: difference !== undefined ? `${Math.abs(difference).toFixed(1)}°F ${difference >= 0 ? "above" : "below"} ${hazard.recent_relative_f !== undefined ? "the daily lowland median" : "the county median"}` : undefined };
      }
      return { label: "Observed", text: "Slow movement measured along the satellite’s line of sight. This does not measure earthquake shaking.", metric: `${hazard.velocity_mm_per_yr?.toFixed(1)} mm/yr`, detail: "Direction requires the source’s verified sign convention." };
  }
}
