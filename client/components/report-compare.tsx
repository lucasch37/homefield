"use client";

import { fetchJSON } from "@/lib/api";
import {
  buildComparisonFacts,
  compareRows,
  LETTERS,
  MIN_COMPARE,
  readCompareQueries,
  type CompareStat,
} from "@/lib/compare";
import { placeLabel } from "@/lib/format";
import { parseSearch, reportUrl } from "@/lib/search";
import { severityColor } from "@/lib/severity";
import { normalizeReport, type HazardKind, type Report } from "@/lib/types";
import {
  Activity,
  ArrowUpRight,
  ChevronDown,
  Columns3,
  Droplets,
  ScanLine,
  Sun,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SeverityScale } from "./hazard-charts";
import { ReportSummary } from "./report-summary";

type Column =
  | { state: "loading" }
  | { state: "ready"; report: Report }
  | { state: "error"; message: string };
type Analysis =
  | { summary: string; source?: "gemini" | "data"; note?: string }
  | { error: string };

const ICONS: Record<HazardKind, LucideIcon> = {
  flood: Droplets,
  heat: Sun,
  ground_motion: Activity,
};
const OUTSIDE = "Outside King County, so there is no data to compare.";

export function ReportCompare() {
  const queries = readCompareQueries(useSearchParams().toString());
  if (!queries.length) return <NothingToCompare />;
  // A new set of addresses starts from a clean slate instead of showing the previous columns.
  return <CompareView key={queries.join("\n")} queries={queries} />;
}

function CompareView({ queries: initial }: { queries: string[] }) {
  // The parent keys this component by its addresses, so the list is fixed for its lifetime.
  const [queries] = useState(initial);
  const [columns, setColumns] = useState<Column[]>(() =>
    queries.map(() => ({ state: "loading" })),
  );
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const analysisRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const update = (index: number, column: Column) =>
      setColumns((current) => current.map((item, i) => (i === index ? column : item)));
    queries.forEach(async (text, index) => {
      const query = parseSearch(text);
      if (!query) return update(index, { state: "error", message: "This saved search is empty." });
      try {
        const result = normalizeReport(
          await fetchJSON<unknown>(reportUrl(query), { signal: controller.signal }),
        );
        if (controller.signal.aborted) return;
        update(index, result.in_king_county
          ? { state: "ready", report: result }
          : { state: "error", message: OUTSIDE });
      } catch (err) {
        if (controller.signal.aborted) return;
        update(index, {
          state: "error",
          message: err instanceof Error ? err.message : "We couldn’t load this address.",
        });
      }
    });
    return () => {
      controller.abort();
      analysisRequest.current?.abort();
    };
  }, [queries]);

  const settled = columns.every((column) => column.state !== "loading");
  const ready = columns.flatMap((column) => (column.state === "ready" ? [column.report] : []));
  const canAnalyze = settled && ready.length >= MIN_COMPARE;

  useEffect(() => {
    if (!canAnalyze || analysisRequest.current) return;
    const controller = new AbortController();
    analysisRequest.current = controller;
    const reports = columns.flatMap((column) => (column.state === "ready" ? [column.report] : []));
    fetchJSON<{ summary: string; source?: "gemini" | "data"; note?: string }>("/api/compare-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reports }),
      signal: controller.signal,
    })
      .then((result) => { if (!controller.signal.aborted) setAnalysis(result); })
      .catch((err) => {
        if (!controller.signal.aborted)
          setAnalysis({ error: err instanceof Error ? err.message : "The comparison couldn’t be written." });
      });
  }, [canAnalyze, columns]);

  const rows = compareRows(columns.map((column) => (column.state === "ready" ? column.report : null)));
  const caveats = ready.length ? buildComparisonFacts(ready).caveats : [];

  return (
    <section className="hfd-dashboard !mt-0" aria-labelledby="compare-title">
      <div className="hfd-heading">
        <h2 id="compare-title">The satellite record</h2>
        <SeverityScale />
      </div>

      <ol className="m-0 mb-5 grid list-none gap-2 p-0 md:grid-cols-3 md:gap-3" aria-label="Compared addresses">
        {queries.map((query, index) => {
          const column = columns[index];
          return (
            <li key={query} className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-[#0d0b24]/80 px-4 py-3">
              <Letter index={index} />
              <div className="min-w-0">
                <p className="m-0 truncate text-sm font-semibold text-[#eef1ff]" title={query}>
                  {column.state === "ready" ? placeLabel(column.report) : query}
                </p>
                <Link
                  className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-violet-300 hover:underline"
                  href={`/search?address=${encodeURIComponent(query)}`}
                >
                  Open report <ArrowUpRight size={12} />
                </Link>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="hfd-grid">
        {rows.map((row) => {
          const Icon = ICONS[row.kind];
          return (
            <article key={row.kind} className="hfd-card" aria-label={row.title}>
              <header className="hfd-cardHeader">
                <h3>
                  <span className="hfd-icon">
                    <Icon size={15} strokeWidth={1.7} />
                  </span>
                  {row.title}
                </h3>
              </header>
              <ul className="m-0 flex flex-1 list-none flex-col p-0">
                {row.stats.map((stat, index) => (
                  <li key={queries[index]} className="flex items-center gap-3 border-t border-white/10 py-3.5 first:border-t-0 first:pt-0">
                    <Letter index={index} />
                    <Stat stat={stat} column={columns[index]} />
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>

      {canAnalyze && (
        <div className="mt-10">
          <ReportSummary
            title="AI COMPARISON"
            loading={!analysis}
            summary={analysis && "summary" in analysis ? analysis.summary : ""}
            source={analysis && "summary" in analysis ? analysis.source : undefined}
            note={analysis && "summary" in analysis ? analysis.note : undefined}
            error={analysis && "error" in analysis ? analysis.error : ""}
          />
        </div>
      )}

      {caveats.length > 0 && (
        <details className="group mt-4 rounded-2xl border border-white/10 bg-[#0d0b24]/60 px-5 py-4 text-[#a6afc8]">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-semibold text-[#eef1ff]">
            <ScanLine size={13} />
            About this data
            <ChevronDown size={14} className="ml-auto transition-transform group-open:rotate-180" />
          </summary>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-[11px] leading-5">
            <li>Heat is ground and roof surface temperature, not air or indoor temperature.</li>
            <li>Ground movement is slow movement measured from space, not earthquake shaking.</li>
            {caveats.map((caveat) => <li key={caveat}>{caveat}</li>)}
          </ul>
        </details>
      )}
    </section>
  );
}

function Letter({ index }: { index: number }) {
  return (
    <span
      aria-label={`Address ${LETTERS[index]}`}
      className="grid size-6 shrink-0 place-items-center rounded-full border border-violet-300/40 bg-violet-300/15 text-[10px] font-semibold text-violet-200"
    >
      {LETTERS[index]}
    </span>
  );
}

function Stat({ stat, column }: { stat: CompareStat | null; column: Column }) {
  if (column.state === "loading") {
    return (
      <div className="flex flex-1 flex-col gap-2" aria-label="Loading">
        <span className="block h-6 w-2/3 animate-pulse rounded bg-white/10" />
        <span className="block h-2.5 w-1/3 animate-pulse rounded bg-white/10" />
      </div>
    );
  }
  if (column.state === "error" || !stat) {
    return (
      <p className="m-0 text-[11px] leading-5 text-[#b8a9d9]">
        {column.state === "error" ? column.message : "No data"}
      </p>
    );
  }
  return (
    <div className="min-w-0">
      {stat.metric ? (
        <div className="hfd-metric !text-[clamp(22px,2.1vw,28px)] !tracking-[-1px]">{stat.metric}</div>
      ) : (
        <div className="text-sm font-medium text-[#cbd5e1]">No reading</div>
      )}
      <p className="m-0 mt-1 flex items-center gap-1.5 text-[11px] text-[#b8a9d9]">
        <i
          aria-hidden="true"
          className="block size-2 shrink-0 rounded-full"
          style={{ background: severityColor(stat.severity) }}
        />
        {stat.label}
        {stat.detail && <span className="text-[#857c9e]">· {stat.detail}</span>}
      </p>
    </div>
  );
}

function NothingToCompare() {
  return (
    <section className="flex flex-col items-start rounded-2xl border border-violet-300/15 bg-[#0b0614]/85 p-8 text-[#eef1ff]">
      <Columns3 size={28} className="mb-5 text-violet-300" />
      <h2 className="font-serif text-2xl">Pick two or three reports to compare.</h2>
      <p className="mt-2 mb-6 text-sm text-muted-foreground">
        Choose saved reports on the Reports page, then select Compare.
      </p>
      <Link
        className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-xs font-semibold text-primary-foreground"
        href="/reports"
      >
        Go to your reports <ArrowUpRight size={16} />
      </Link>
    </section>
  );
}
