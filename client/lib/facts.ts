// Turns a hazards report into plain-English fact sentences. The written summary and Grok Voice only
// reword these sentences, so every number and date they may use is decided here, from the API values.
// Adapted from the team's tested lib/summary/facts.mjs (Oct 17), but it keeps the API's exact values
// instead of rounding them, so each number in a sentence can be traced back to the report.

import { formatDate, formatMagnitude, formatNumber, ordinal, placeLabel, yearSpan } from "./format.ts";
<<<<<<< HEAD
import { impactFor } from "./impact.ts";
=======
>>>>>>> origin/master
import type { Hazard, HazardKind, Report, ReportResult } from "./types.ts";

export const DEFAULT_ACTIONS: Record<HazardKind, string> = {
  flood: "Sign up for King County flood alerts",
  heat: "Find local cooling centers and ways to keep your home cool",
  ground_motion: "Watch for new foundation or wall cracks and ask your landlord or an inspector",
};

export type Fact = {
  key: HazardKind;
  status: Hazard["status"];
  /** One line for the model, prefixed with the hazard name. */
  line: string;
  /** Ready-to-read sentences for the summary written without AI. */
  sentences: string[];
  /** A short finding for voice answers. */
  finding: string;
  action: string;
<<<<<<< HEAD
  /** What the finding means for living there, from the reviewed notes in impact.ts. */
  meaning: string;
  /** What to check or ask before deciding; may be empty when nothing stands out. */
  check: string;
=======
>>>>>>> origin/master
  score: number;
  unknown: boolean;
  skip: boolean;
};

export type Facts = {
  place: string;
  hazards: Fact[];
  lead: HazardKind | null;
  action: string | null;
  /** Reader-facing limitations, without the developer notes the server also sends. */
  caveats: string[];
  allowedNumbers: Set<string>;
};

<<<<<<< HEAD
type Measured = Omit<Fact, "key" | "status" | "action" | "meaning" | "check">;

const passes = (n: number) => `${formatNumber(n)} ${n === 1 ? "pass" : "passes"}`;
const sentenceCase = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

function flood(h: Hazard): Measured {
=======
const passes = (n: number) => `${formatNumber(n)} ${n === 1 ? "pass" : "passes"}`;
const sentenceCase = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

function flood(h: Hazard): Omit<Fact, "key" | "status" | "action"> {
>>>>>>> origin/master
  const observed = h.observed_passes;
  const wet = h.wet_passes;
  if (h.status === "flooded" && observed !== undefined && wet !== undefined) {
    const first = h.first_wet ? formatDate(h.first_wet) : null;
    const last = h.last_wet ? formatDate(h.last_wet) : null;
    const when = first && last ? (first === last ? `, on ${first}` : `, first on ${first} and most recently on ${last}`) : "";
    const finding = `satellite radar saw water at this spot on ${formatNumber(wet)} of ${passes(observed)}${when}`;
    return { score: 100, line: `Flood: ${finding}.`, sentences: [`${sentenceCase(finding)}.`], finding: `${sentenceCase(finding)}.`, unknown: false, skip: false };
  }
  if (h.status === "permanent_water" && observed !== undefined && wet !== undefined) {
    const finding = `satellite radar saw water at this exact point on ${formatNumber(wet)} of ${passes(observed)}, which points to a river, lake, or pond. The map pin may be on the water rather than the home`;
    return { score: 50, line: `Flood: ${finding}.`, sentences: [`${sentenceCase(finding)}.`], finding: `${sentenceCase(finding)}.`, unknown: false, skip: false };
  }
  if (h.status === "permanent_water") {
    const finding = "satellite radar saw water at this exact point on at least half of its passes, which points to a river, lake, or pond";
    return { score: 50, line: `Flood: ${finding}.`, sentences: [`${sentenceCase(finding)}.`], finding: `${sentenceCase(finding)}.`, unknown: false, skip: false };
  }
  if (h.status === "no_flooding_seen" && observed !== undefined) {
    const finding = `no flooding was observed at this spot in ${formatNumber(observed)} satellite radar ${observed === 1 ? "pass" : "passes"}. Passes are days apart, so a short flood could be missed, and this does not mean the home cannot flood`;
    return { score: 10, line: `Flood: ${finding}.`, sentences: [`${sentenceCase(finding)}.`], finding: `${sentenceCase(finding)}.`, unknown: false, skip: false };
  }
  const finding = h.status === "error"
    ? "the flood data could not be checked for this spot right now"
    : "satellites could not get enough reliable readings at this spot to tell whether it has flooded";
  return { score: 0, line: `Flood: UNKNOWN. ${sentenceCase(finding)}.`, sentences: [`${sentenceCase(finding)}.`], finding: `${sentenceCase(finding)}.`, unknown: true, skip: false };
}

function heatRank(percentile: number) {
  if (percentile >= 90) return "much hotter than most of lowland King County";
  if (percentile >= 70) return "hotter than most of lowland King County";
  if (percentile >= 30) return "typical for lowland King County";
  return "cooler than most of lowland King County";
}

/** The data team's percentile bands (pipelines/validation/heat_lookup.py). */
export function heatLabel(h: Hazard): string | null {
  return h.status === "ok" && h.lowland_percentile !== undefined ? heatRank(h.lowland_percentile) : null;
}

<<<<<<< HEAD
function heat(h: Hazard): Measured {
=======
function heat(h: Hazard): Omit<Fact, "key" | "status" | "action"> {
>>>>>>> origin/master
  if (h.status === "ok" && h.surface_temp_f !== undefined) {
    const years = yearSpan(h.recent_years);
    const measured = `on clear summer days around noon${years ? ` in ${years}` : ""}, the ground and roof surfaces here averaged ${formatNumber(h.surface_temp_f)}°F`;
    const rel = h.recent_relative_f;
    const compare = rel === undefined ? null
      : rel === 0 ? "That is about the same as a typical spot in lowland King County on the same days"
        : `That is ${formatMagnitude(rel)}°F ${rel > 0 ? "hotter" : "cooler"} than a typical spot in lowland King County on the same days`;
    const pct = h.lowland_percentile;
    const rank = pct === undefined ? null : `It ranks at the ${ordinal(pct)} percentile of lowland King County, which is ${heatRank(pct)}`;
    const sentences = [`${sentenceCase(measured)}.`, ...(compare ? [`${compare}.`] : []), ...(rank ? [`${rank}.`] : []),
      "This is ground and roof temperature, not air or indoor temperature."];
    const score = pct === undefined ? 30 : pct >= 90 ? 80 : pct >= 70 ? 70 : 30;
    return { score, line: `Heat: ${sentences.join(" ").replace(/^O/, "o")}`, sentences, finding: sentences.join(" "), unknown: false, skip: false };
  }
  if (h.status === "not_available") return { score: -1, line: "Heat: not included in this report.", sentences: [], finding: "Heat is not part of this report yet.", unknown: false, skip: true };
  const finding = h.status === "error"
    ? "The heat data could not be checked for this spot right now."
    : "The satellite heat data could not get a reliable reading at this spot.";
  return { score: 0, line: `Heat: UNKNOWN. ${finding}`, sentences: [finding], finding, unknown: true, skip: false };
}

<<<<<<< HEAD
function groundMotion(h: Hazard): Measured {
=======
function groundMotion(h: Hazard): Omit<Fact, "key" | "status" | "action"> {
>>>>>>> origin/master
  if (h.status === "ok" && h.velocity_mm_per_yr !== undefined) {
    const dated = (h.series_mm ?? []).map((point) => point.date);
    const period = dated.length >= 2 ? ` between ${formatDate(dated[0])} and ${formatDate(dated[dated.length - 1])}` : "";
    const measured = `satellites measured slow ground movement of about ${formatMagnitude(h.velocity_mm_per_yr)} mm per year at this spot${period}, along the satellite's slanted line of sight`;
    const sentences = [`${sentenceCase(measured)}.`,
      "Its direction has not been confirmed yet, so this does not say whether the ground is rising or sinking.",
      "This is slow movement, not earthquake shaking."];
    const score = Math.abs(h.velocity_mm_per_yr) >= 10 ? 60 : 20;
    return { score, line: `Ground motion: ${sentences.join(" ").replace(/^S/, "s")}`, sentences, finding: sentences.join(" "), unknown: false, skip: false };
  }
  if (h.status === "not_available") return { score: -1, line: "Ground motion: not included in this report.", sentences: [], finding: "Ground motion is not part of this report yet.", unknown: false, skip: true };
  const finding = h.status === "error"
    ? "The ground movement data could not be checked for this spot right now."
    : "Satellites could not get enough reliable readings here to measure slow ground movement.";
  return { score: 0, line: `Ground motion: UNKNOWN. ${finding}`, sentences: [finding], finding, unknown: true, skip: false };
}

const BUILDERS = { flood, heat, ground_motion: groundMotion };

// Server limitations that are notes for developers (frame IDs, longitudes, pipeline wording). Spoken or
// summarized, they confuse residents and smuggle numbers past the number check.
const DEV_NOTE = /longitude|\bframe\b|displacement variable|pipeline|sign convention|delivered files|composite median|reliable segments|use years:|percentiles compare|native/i;

/** Every number in a piece of text, normalized ("1,200" -> "1200", "-3.6" -> "3.6", "07" -> "7"). */
export function numbersIn(text: string): Set<string> {
  return new Set((text.match(/\d[\d,]*(?:\.\d+)?/g) ?? []).map((n) => String(Number(n.replace(/,/g, "")))));
}

export function buildFacts(report: Report): Facts {
  const hazards: Fact[] = (Object.keys(BUILDERS) as HazardKind[]).map((key) => {
    const h = report.hazards[key];
    const action = (h.action || DEFAULT_ACTIONS[key]).trim().replace(/\.$/, "").slice(0, 200);
<<<<<<< HEAD
    const { meaning, check } = impactFor(key, h);
    return { key, status: h.status, action, meaning, check, ...BUILDERS[key](h) };
=======
    return { key, status: h.status, action, ...BUILDERS[key](h) };
>>>>>>> origin/master
  });
  const ranked = hazards.filter((h) => !h.skip).sort((a, b) => b.score - a.score);
  // Lead with something notable (water seen, very hot, fast movement); otherwise lead with flood.
  const lead = ranked[0] && ranked[0].score >= 50 ? ranked[0] : hazards.find((h) => h.key === "flood" && !h.skip) ?? ranked[0];
  const caveats = [...new Set(hazards
    .filter((h) => !h.skip && !h.unknown)
    .flatMap((h) => report.hazards[h.key].source.limitations)
    .filter((text) => !DEV_NOTE.test(text))
    .map((text) => text.replace(/; (thermal detail is|reference dates change) .*$/, ".")))];
  const place = placeLabel(report);
<<<<<<< HEAD
  const shown = hazards.filter((h) => !h.skip);
  const lines = shown.flatMap((h) => [h.line, h.meaning, h.check]);
=======
  const lines = hazards.filter((h) => !h.skip).map((h) => h.line);
>>>>>>> origin/master
  return {
    place,
    hazards,
    lead: lead?.key ?? null,
    action: lead?.action ?? null,
    caveats,
    allowedNumbers: numbersIn([report.address ?? "", ...lines, lead?.action ?? ""].join(" ")),
  };
}

<<<<<<< HEAD
/** One prompt line: the measured fact, what it means for living there, and what to check. */
export function impactLine(fact: Fact): string {
  return [fact.line, fact.meaning && `MEANING: ${fact.meaning}`, fact.check && `CHECK: ${fact.check}`]
    .filter(Boolean).join(" ");
}

=======
>>>>>>> origin/master
/** The prompt body for the summary model: only these lines, never the raw JSON. */
export function factsPrompt(facts: Facts): string {
  return [
    `ADDRESS: ${facts.place}`,
<<<<<<< HEAD
    `MOST SIGNIFICANT: ${facts.hazards.find((h) => h.key === facts.lead)?.line.split(":")[0] ?? "Flood"}`,
    "FACTS:",
    ...facts.hazards.filter((h) => !h.skip).map((h) => `- ${impactLine(h)}`),
    `ACTION: ${facts.action ?? DEFAULT_ACTIONS.flood}.`,
  ].join("\n");
}

const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

/** An impact-first summary built only from the fact sentences and reviewed notes, used when the AI
 * summary is unavailable or fails checks. */
export function templateSummary(facts: Facts): string {
  const shown = facts.hazards.filter((h) => !h.skip);
  const lead = shown.find((h) => h.key === facts.lead) ?? shown[0];
  if (!lead) return "";
  const others = shown.filter((h) => h !== lead);
  const sentences = [lead.sentences[0], lead.meaning, ...others.map((h) => h.meaning)].filter(Boolean);
  // The lead's check, plus one more from any other notable finding.
  const extra = others.filter((h) => h.check && h.score >= 50).sort((a, b) => b.score - a.score)[0];
  const checks = [lead.check, extra?.check].filter(Boolean).map((check) => lowerFirst(check!).replace(/\.$/, ""));
  if (checks.length) sentences.push(`Before deciding, ${checks.join(", and ")}.`);
  else if (facts.action) sentences.push(`A useful next step: ${lowerFirst(facts.action)}.`);
=======
    "FACTS:",
    ...facts.hazards.filter((h) => !h.skip).map((h) => `- ${h.line}`),
    `ACTION TO END WITH: ${facts.action ?? DEFAULT_ACTIONS.flood}.`,
  ].join("\n");
}

/** A summary built only from the fact sentences, used when the AI summary is unavailable or fails checks. */
export function templateSummary(facts: Facts): string {
  const order = [...facts.hazards].filter((h) => !h.skip)
    .sort((a, b) => (a.key === facts.lead ? -1 : b.key === facts.lead ? 1 : 0));
  const sentences = order.flatMap((h) => h.sentences.slice(0, h.key === facts.lead ? 3 : 2));
  if (facts.action) sentences.push(`A useful next step: ${facts.action.charAt(0).toLowerCase()}${facts.action.slice(1)}.`);
>>>>>>> origin/master
  return sentences.join(" ");
}

export type SummaryCheck = { ok: true } | { ok: false; reason: string };

/** Rejects AI text that adds numbers, calls a home safe, links out, or runs long. */
export function checkSummary(text: string, facts: Facts): SummaryCheck {
  const trimmed = text.trim();
  if (trimmed.length < 40) return { ok: false, reason: "too short" };
<<<<<<< HEAD
  if (trimmed.length > 1400) return { ok: false, reason: "too long" };
=======
  if (trimmed.length > 1200) return { ok: false, reason: "too long" };
>>>>>>> origin/master
  if (/\bsafe(ly|ty)?\b/i.test(trimmed)) return { ok: false, reason: "uses the word safe" };
  if (/https?:\/\/|www\./i.test(trimmed)) return { ok: false, reason: "contains a link" };
  const extra = [...numbersIn(trimmed)].filter((n) => !facts.allowedNumbers.has(n));
  if (extra.length) return { ok: false, reason: `numbers not in the data: ${extra.join(", ")}` };
  const sentences = trimmed.split(/(?<=[.!?])\s+/).filter(Boolean).length;
  if (sentences > 7) return { ok: false, reason: "too many sentences" };
  return { ok: true };
}

/** What Grok Voice receives from get_hazards: fact sentences, not raw JSON (raw JSON led Grok to read
 * longitudes aloud and misread relative heat changes in the team's Oct 17 tests). */
export function hazardsForVoice(report: ReportResult | null) {
  if (!report) return { error: "No address has been looked up yet. Ask the user for a street address in King County, with the city." };
  if (!report.in_king_county) {
    return {
      address: placeLabel(report),
      in_king_county: false,
      message: "This location is outside King County, Washington, so this report has no hazard data for it. Suggest that place's own city or county instead.",
    };
  }
  const facts = buildFacts(report);
  const hazards: Record<string, { status: string; finding: string; action: string; trend?: string }> = {};
  for (const fact of facts.hazards) {
    hazards[fact.key] = { status: fact.status, finding: fact.finding, action: fact.action };
  }
  const trend = heatTrend(report.hazards.heat);
  if (trend) hazards.heat.trend = trend;
  return { address: facts.place, in_king_county: true, hazards, limitations: facts.caveats };
}

// change_since_early_f compares this spot with lowland King County then and now. It says nothing about
// whether summers overall got hotter, so the wording keeps that explicit.
function heatTrend(h: Hazard): string | undefined {
  const change = h.change_since_early_f;
  if (h.status !== "ok" || change === undefined || !h.early_years?.length || !h.recent_years?.length) return undefined;
  const size = formatMagnitude(change);
  const how = Number(size) === 0 ? "about the same, relative to" : `${size}°F ${change > 0 ? "warmer" : "cooler"} relative to`;
  return `In ${yearSpan(h.recent_years)}, this spot ran ${how} a typical lowland King County spot, compared with ${yearSpan(h.early_years)}. This compares spots with each other; it does not say whether summers overall got hotter or cooler.`;
}
