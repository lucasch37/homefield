// Severity bands shared by the report dashboard, saved report cards, and the comparison page.

import type { Hazard, HazardKind } from "./types.ts";

export type Severity = "good" | "average" | "hazardous" | "critical" | "unknown";

export const severityPalette: Record<Severity, { bright: string; chart: string; dark: string }> = {
  good: { bright: "#c4b5fd", chart: "#9a86db", dark: "#1f1632" },
  average: { bright: "#ffe06b", chart: "#c7a846", dark: "#5a4b20" },
  hazardous: { bright: "#ffc078", chart: "#d77b3e", dark: "#693a23" },
  critical: { bright: "#ff9b91", chart: "#d96f73", dark: "#842d36" },
  unknown: { bright: "#cbd5e1", chart: "#8b7aa8", dark: "#292235" },
};

export const severityColor = (severity: Severity) => severityPalette[severity].bright;

const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export const floodSeverity = (hazard?: Hazard): Severity => {
  if (!hazard || ["error", "not_enough_data", "not_available"].includes(hazard.status)) return "unknown";
  if (hazard.status === "permanent_water") return "critical";
  if (hazard.status === "no_flooding_seen") return "good";
  if (!finite(hazard.observed_passes) || !finite(hazard.wet_passes)) return "unknown";
  const ratio = hazard.wet_passes / hazard.observed_passes;
  if (ratio < 0.05) return "average";
  if (ratio < 0.5) return "hazardous";
  return "critical";
};

export const heatSeverity = (hazard?: Hazard): Severity => {
  const percentile = hazard?.lowland_percentile ?? hazard?.county_percentile;
  if (!finite(percentile) || hazard?.status !== "ok") return "unknown";
  if (percentile < 50) return "good";
  if (percentile < 75) return "average";
  if (percentile < 90) return "hazardous";
  return "critical";
};

export const groundSeverity = (hazard?: Hazard): Severity => {
  const value = hazard?.velocity_mm_per_yr;
  if (!finite(value) || hazard?.status !== "ok") return "unknown";
  const magnitude = Math.abs(value);
  if (magnitude <= 5) return "good";
  if (magnitude <= 10) return "average";
  if (magnitude <= 20) return "hazardous";
  return "critical";
};

export const hazardSeverity: Record<HazardKind, (hazard?: Hazard) => Severity> = {
  flood: floodSeverity,
  heat: heatSeverity,
  ground_motion: groundSeverity,
};

export const isSeverity = (value: unknown): value is Severity =>
  typeof value === "string" && value in severityPalette;
