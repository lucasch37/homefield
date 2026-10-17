"use client";
if (typeof window !== "undefined") {
  (window as Window & { __explorer?: boolean }).__explorer = true;
}
import { fetchJSON } from "@/lib/api";
import { normalizeReport, type Report } from "@/lib/types";
import { MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AddressSearch } from "./address-search";
import { HazardDashboard } from "./hazard-charts";
import { HazardMap } from "./hazard-map";
import { ReportSummary } from "./report-summary";
import { VoiceControls } from "./voice-controls";

export default function ReportExplorer() {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState("");
  const [summaryError, setSummaryError] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const request = useRef<AbortController | null>(null);
  const [searchId, setSearchId] = useState(0);

  useEffect(() => () => request.current?.abort(), []);
  async function search(address: string) {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setSearchId((id) => id + 1);
    setReport(null);
    setError("");
    setSummary("");
    setSummaryError("");
    setSummaryLoading(false);
    setLoading(true);
    try {
      const result = normalizeReport(
        await fetchJSON<unknown>(
          `/api/report?address=${encodeURIComponent(address)}`,
          { signal: controller.signal },
        ),
      );
      if (controller.signal.aborted) return;
      if (!result.in_king_county) {
        setError(result.message || "We're starting close to home. This report currently covers King County, Washington. Try an address within the county.");
        return;
      }
      setReport(result);
      setLoading(false);
      setSummaryLoading(true);
      try {
        const resultSummary = await fetchJSON<{ summary: string }>(
          "/api/summary",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(result),
            signal: controller.signal,
          },
        );
        if (!controller.signal.aborted) setSummary(resultSummary.summary);
      } catch (err) {
        if (!controller.signal.aborted)
          setSummaryError(
            err instanceof Error
              ? err.message
              : "The summary couldn’t load. Explore the observations below.",
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
    "scroll-mt-7 mt-4 mb-20 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-[7px] focus-visible:outline-ring";
  const initialState = searchId === 0 && !error;
  return (
    <main
      id="main-content"
      className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen overflow-hidden bg-[#f6f7f4] text-[#123d36]"
    >
      <section className="relative z-[1] rounded-b-[clamp(34px,5vw,72px)] bg-[#023e34] px-[6.3%] pb-[10px] text-[#f6f6f6] max-[760px]:rounded-b-[30px] max-[1050px]:px-[5%] max-[760px]:px-[6%]">
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
            className={focusSection}
            aria-label="Find an address"
            tabIndex={-1}
          >
            <AddressSearch loading={loading} onSearch={search} />
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
            className="mt-[-10px] mb-6 flex items-center gap-3 rounded-md border border-destructive/40 bg-destructive/10 px-[18px] py-[15px] text-destructive [&_svg]:shrink-0"
            role="alert"
          >
            <MapPin size={19} />
            <p className="m-0 text-[13px] leading-[1.6]">{error}</p>
          </div>
        )}
        <div className={focusSection} id="report" tabIndex={-1}>
          <div className="mx-auto max-w-[1240px]">
            {/* {isDemo && (
              <div
                className="mb-5 flex items-start gap-3 rounded-md border border-[#d7e8a0] bg-[#f3f8dd] px-4 py-3 text-[#476018]"
                role="status"
              >
                <Sparkles size={16} className="mt-0.5 shrink-0" />
                <p className="m-0 text-[11px] leading-[1.65]">
                  <strong className="font-semibold">Prototype preview.</strong>{" "}
                  This report uses placeholder observations so you can see the
                  finished experience. Search an address to load live results.
                </p>
              </div>
            )} */}
          </div>

          <div
            className="mx-auto mt-1 max-w-[1240px] border-accent border-4 rounded-2xl"
            id="map"
            tabIndex={-1}
          >
            <HazardMap report={report} loading={loading} />
          </div>

          {initialState ? (
            <div
              className="mx-auto mt-10 flex min-h-[320px] max-w-[1240px] items-center justify-center rounded-2xl bg-[#d9dcd8] px-6 text-center text-sm text-[#68736d]"
              aria-label="Report placeholder"
            >
              Enter an address first to see the report.
            </div>
          ) : (
            <>
              <HazardDashboard report={report} loading={loading} />

              {report && (
                <div className="mx-auto mt-10 max-w-[1240px]">
                  <ReportSummary
                    loading={summaryLoading}
                    summary={summary}
                    error={summaryError}
                  />
                </div>
              )}

              <div
                id="voice"
                className={`${focusSection} mx-auto max-w-[1240px]`}
                tabIndex={-1}
              >
                <VoiceControls key={searchId} report={report} />
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
