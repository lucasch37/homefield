// Side-by-side comparison of saved reports. Stats reuse the report card wording and severity bands, and
// the written comparison may only use numbers that appear in the compared reports.

import { buildFacts, impactLine, numbersIn, type SummaryCheck } from "./facts.ts";
import { placeLabel, ordinal } from "./format.ts";
import { finding, hazardMeta } from "./hazards.ts";
import { impactFor, type Impact } from "./impact.ts";
import { hazardSeverity, type Severity } from "./severity.ts";
import { hazardKinds, type HazardKind, type Report } from "./types.ts";

/** Places are shown and written about as A, B, and C. */
export const LETTERS = ["A", "B", "C"];
export const MAX_COMPARE = 3;
export const MIN_COMPARE = 2;
const MAX_QUERY = 300;

function cleanQueries(queries: string[]): string[] {
  const seen = new Set<string>();
  return queries.flatMap((query) => {
    const value = query.trim();
    const id = value.toLowerCase();
    if (!value || value.length > MAX_QUERY || seen.has(id)) return [];
    seen.add(id);
    return [value];
  }).slice(0, MAX_COMPARE);
}

export function compareUrl(queries: string[]): string {
  const params = new URLSearchParams();
  for (const query of cleanQueries(queries)) params.append("q", query);
  return `/compare?${params}`;
}

/** The searches to compare from a `?q=..&q=..` string, or an empty list when there are fewer than two. */
export function readCompareQueries(search: string): string[] {
  const queries = cleanQueries(new URLSearchParams(search).getAll("q"));
  return queries.length >= MIN_COMPARE ? queries : [];
}

export type CompareStat = { metric?: string; label: string; detail?: string; severity: Severity; unknown: boolean };
export type CompareRow = { kind: HazardKind; title: string; stats: (CompareStat | null)[] };

/** One row per hazard; a null report (still loading or failed) gives a null stat in its column. */
export function compareRows(reports: (Report | null)[]): CompareRow[] {
  return hazardKinds.map((kind) => ({
    kind,
    title: hazardMeta[kind].title,
    stats: reports.map((report) => {
      if (!report) return null;
      const hazard = report.hazards[kind];
      const card = finding(hazard, kind);
      const severity = hazardSeverity[kind](hazard);
      const heat = kind === "heat" && hazard.status === "ok";
      return {
        metric: card.metric,
        label: card.label,
        ...(heat && hazard.lowland_percentile !== undefined ? { detail: `${ordinal(hazard.lowland_percentile)} percentile` } : {}),
        severity,
        unknown: severity === "unknown",
      };
    }),
  }));
}

export type ComparisonFacts = {
  places: string[];
  /** Per hazard, one fact line per place, without the hazard prefix. */
  hazards: { kind: HazardKind; title: string; lines: string[] }[];
  caveats: string[];
  allowedNumbers: Set<string>;
};

export function buildComparisonFacts(reports: Report[]): ComparisonFacts {
  const facts = reports.map(buildFacts);
  const places = reports.map(placeLabel);
  const hazards = hazardKinds.flatMap((kind) => {
    const per = facts.map((item) => item.hazards.find((hazard) => hazard.key === kind)!);
    if (per.every((hazard) => hazard.skip)) return [];
    return [{
      kind,
      title: hazardMeta[kind].title,
      lines: per.map((hazard) => impactLine(hazard).replace(/^[^:]+:\s*/, "")),
    }];
  });
  const stats = compareRows(reports).flatMap((row) => row.stats.flatMap((stat) => [stat?.metric, stat?.detail]));
  return {
    places,
    hazards,
    caveats: [...new Set(facts.flatMap((item) => item.caveats))],
    allowedNumbers: numbersIn([...places, ...hazards.flatMap((hazard) => hazard.lines), ...stats.filter(Boolean)].join(" ")),
  };
}

/** The prompt body for the comparison model: only these lines, never the raw JSON. */
export function comparisonPrompt(facts: ComparisonFacts): string {
  return [
    "PLACES:",
    ...facts.places.map((place, index) => `- ${LETTERS[index]}: ${place}`),
    "FACTS BY HAZARD:",
    ...facts.hazards.flatMap((hazard) => [
      `${hazard.title}:`,
      ...hazard.lines.map((line, index) => `- ${LETTERS[index]}: ${line}`),
    ]),
  ].join("\n");
}

const CLOSING = "Satellite observations can’t show that any of these places is free of hazards.";

const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);
const upperFirst = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

function listOf(items: string[], last = "and"): string {
  if (items.length <= 1) return items.join("");
  if (items.length === 2) return `${items[0]} ${last} ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, ${last} ${items.at(-1)}`;
}

const CONCERN: Partial<Record<Severity, number>> = { critical: 0, hazardous: 1 };

/** One sentence per hazard that leads with the places where it matters and what it affects. */
function tradeOff(kind: HazardKind, reports: Report[]): string | null {
  const groups = new Map<string, { impact: Impact; rank: number; places: string[] }>();
  reports.forEach((report, index) => {
    const hazard = report.hazards[kind];
    const impact = impactFor(kind, hazard);
    if (!impact.phrase) return;
    const group = groups.get(impact.phrase)
      ?? { impact, rank: CONCERN[hazardSeverity[kind](hazard)] ?? 2, places: [] };
    group.places.push(LETTERS[index]);
    groups.set(impact.phrase, group);
  });
  if (!groups.size) return null;
  const sorted = [...groups.values()].sort((a, b) => a.rank - b.rank);
  const everywhere = reports.length === 2 ? "both places" : "all three places";
  const clause = (group: (typeof sorted)[number]) =>
    `${group.impact.phrase} ${group.places.length === reports.length ? everywhere : listOf(group.places)}`;
  const clauses = (list: typeof sorted) => listOf(list.map(clause), list.length === 2 ? ", and" : "and").replace(" ,", ",");
  const concerns = sorted.filter((group) => group.impact.stake);
  const rest = sorted.filter((group) => !group.impact.stake);
  if (!concerns.length) return `${upperFirst(clauses(rest))}.`;
  const lead = `${clauses(concerns)}, which matters for ${concerns[0].impact.stake}`;
  return `${upperFirst(rest.length ? `${lead}, while ${clauses(rest)}` : lead)}.`;
}

/** A comparison written only from reviewed impact notes, used when the AI text is unavailable or fails
 * checks. The numbers are already on the cards above it, so it repeats none of them. */
export function templateComparison(reports: Report[]): string {
  const checks = reports.flatMap((report, index) => {
    const notable = buildFacts(report).hazards
      .filter((hazard) => !hazard.skip && hazard.check)
      .sort((a, b) => b.score - a.score)[0];
    return notable ? [`for ${LETTERS[index]}, ${lowerFirst(notable.check.replace(/\.$/, ""))}`] : [];
  });
  const sentences = hazardKinds.flatMap((kind) => tradeOff(kind, reports) ?? []);
  const before = checks.length ? [`Before deciding: ${checks.join("; ")}.`] : [];
  return [...sentences, ...before, CLOSING].join(" ");
}

/** Rejects AI text that adds or computes numbers, calls a place safe, links out, or runs long. */
export function checkComparison(text: string, facts: ComparisonFacts): SummaryCheck {
  const trimmed = text.trim();
  if (trimmed.length < 60) return { ok: false, reason: "too short" };
  if (trimmed.length > 1600) return { ok: false, reason: "too long" };
  if (/\bsafe(ly|ty)?\b/i.test(trimmed)) return { ok: false, reason: "uses the word safe" };
  if (/https?:\/\/|www\./i.test(trimmed)) return { ok: false, reason: "contains a link" };
  const extra = [...numbersIn(trimmed)].filter((n) => !facts.allowedNumbers.has(n));
  if (extra.length) return { ok: false, reason: `numbers not in the data: ${extra.join(", ")}` };
  const sentences = trimmed.split(/(?<=[.!?])\s+/).filter(Boolean).length;
  if (sentences > 8) return { ok: false, reason: "too many sentences" };
  return { ok: true };
}
