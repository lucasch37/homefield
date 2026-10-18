"use client";
import { fetchJSON } from "@/lib/api";
import { DEMO_PLACES, parseSearch, reportUrl } from "@/lib/search";
import { hazardKinds, normalizeReport, type Report } from "@/lib/types";
import { MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AddressSearch } from "./address-search";
import { HazardCard } from "./hazard-card";
import { HazardDashboard } from "./hazard-charts";
import { HazardMap } from "./hazard-map";
import { ReportSummary } from "./report-summary";
import { VoiceControls } from "./voice-controls";

type Summary = { summary: string; source?: "gemini" | "data"; note?: string };

export default function ReportExplorer() {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [summaryError, setSummaryError] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const request = useRef<AbortController | null>(null);
  const [searchId, setSearchId] = useState(0);
  const [placeName, setPlaceName] = useState<string | undefined>();

  useEffect(() => () => request.current?.abort(), []);

  async function search(text: string) {
    const query = parseSearch(text);
    if (!query) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setSearchId((id) => id + 1);
    setPlaceName(DEMO_PLACES.find((place) => place.query === text.trim() && !("address" in query))?.label);
    setReport(null);
    setError("");
    setSummary(null);
    setSummaryError("");
    setSummaryLoading(false);
    setLoading(true);
    try {
      const result = normalizeReport(
        await fetchJSON<unknown>(reportUrl(query), { signal: controller.signal }),
      );
      if (controller.signal.aborted) return;
      if (!result.in_king_county) {
        setError(result.message || "This report covers King County, Washington only. Try an address within the county.");
        return;
      }
      setReport(result);
      setLoading(false);
      setSummaryLoading(true);
      try {
        const written = await fetchJSON<Summary>("/api/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(result),
          signal: controller.signal,
        });
        if (!controller.signal.aborted) setSummary(written);
      } catch (err) {
        if (!controller.signal.aborted)
          setSummaryError(
            err instanceof Error
              ? err.message
              : "The summary couldn’t load. The observation cards below are still ready.",
          );
      } finally {
        if (!controller.signal.aborted) setSummaryLoading(false);
      }
    } catch (err) {
      if (!controller.signal.aborted)
        setError(
          err instanceof Error
            ? err.message
            : "We couldn’t load this address. Please try again.",
        );
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  const focusSection =
    "scroll-mt-7 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-[7px] focus-visible:outline-ring";
  const initialState = searchId === 0 && !error;
  const showReport = loading || !!report;
  return (
    <main
      id="main-content"
      className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen overflow-hidden bg-[#f6f7f4] text-[#123d36]"
    >
      <section className="relative z-[1] rounded-b-[clamp(34px,5vw,72px)] bg-[#023e34] px-[6.3%] pb-[10px] text-[#f6f6f6] max-[1050px]:px-[5%] max-[760px]:rounded-b-[30px] max-[760px]:px-[6%]">
        <div className="mx-auto max-w-[1536px]">
          <section className="flex justify-center py-[61px] pb-[35px] max-[760px]:py-[39px] max-[760px]:pb-[29px]">
            <div className="text-center">
              <h1 className="font-serif text-[clamp(48px,5.1vw,73px)] font-normal leading-[1.06] tracking-[-3px] max-[760px]:text-[52px] max-[760px]:tracking-[-2px] [&_em]:font-normal [&_em]:text-ring">
                See your home
                <br />
                from <em>above.</em>
              </h1>
            </div>
          </section>
          <section
            id="search"
            className={`${focusSection} mt-4 mb-20`}
            aria-label="Find an address"
            tabIndex={-1}
          >
            <AddressSearch loading={loading} onSearch={search} listingAddress={report?.address} />
          </section>
        </div>
      </section>
      <section
        className="mx-auto max-w-[1536px] px-[6.3%] pt-[34px] pb-[60px] text-[#123d36] max-[1050px]:px-[5%] max-[760px]:px-[6%]"
        style={
          {
            "--foreground": "#123d36",
            "--muted-foreground": "#64746f",
            "--border": "#c8d2cc",
            "--muted": "#edf1ed",
            "--card": "#0d443a",
            "--card-foreground": "#f6f6f6",
            "--secondary": "#14473e",
            "--secondary-foreground": "#f6f6f6",
          } as React.CSSProperties
        }
      >
        {error && (
          <div
            className="mx-auto mt-[-10px] mb-6 flex max-w-[1240px] items-center gap-3 rounded-md border border-destructive/40 bg-destructive/10 px-[18px] py-[15px] text-[#8a1f55] [&_svg]:shrink-0"
            role="alert"
          >
            <MapPin size={19} />
            <p className="m-0 text-[13px] leading-[1.6]">{error}</p>
          </div>
        )}
        <div className={`${focusSection} mt-4 mb-20`} id="report" tabIndex={-1}>
          <div className="mx-auto mt-1 max-w-[1240px] rounded-2xl border-4 border-accent" id="map" tabIndex={-1}>
            <HazardMap report={report} loading={loading} label={placeName} />
          </div>

          {initialState ? (
            <div
              className="mx-auto mt-10 flex min-h-[220px] max-w-[1240px] items-center justify-center rounded-2xl bg-[#d9dcd8] px-6 text-center text-sm text-[#68736d]"
              aria-label="Report placeholder"
            >
              Enter a King County address to see what satellites observed there.
            </div>
          ) : showReport ? (
            <>
              {report && (
                <div className="mx-auto mt-10 max-w-[1240px]">
                  <ReportSummary
                    loading={summaryLoading}
                    summary={summary?.summary ?? ""}
                    source={summary?.source}
                    note={summary?.note}
                    error={summaryError}
                  />
                </div>
              )}

              <section className="mx-auto mt-8 max-w-[1240px]" aria-label="Hazard findings">
                <div className="grid grid-cols-3 gap-[18px] max-[1050px]:grid-cols-1">
                  {hazardKinds.map((kind) => (
                    <HazardCard key={kind} kind={kind} hazard={report?.hazards[kind]} loading={loading} />
                  ))}
                </div>
              </section>

              <div id="voice" className={`${focusSection} mx-auto max-w-[1240px]`} tabIndex={-1}>
                <VoiceControls key={searchId} report={report} />
              </div>

              <HazardDashboard report={report} loading={loading} />
            </>
          ) : null}
        </div>
      </section>
    </main>
  );
}
