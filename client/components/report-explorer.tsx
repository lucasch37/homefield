"use client";
if (typeof window !== "undefined") {
  (window as Window & { __explorer?: boolean }).__explorer = true;
}
import { fetchJSON } from "@/lib/api";
import { normalizeReport, type Report } from "@/lib/types";
import { MapPin, Satellite } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { DIVE_FLAG } from "./space/dive-context";
import { usePrefersReducedMotion } from "./space/use-reduced-motion";
import { AddressSearch } from "./address-search";
import { HazardDashboard } from "./hazard-charts";
import { HazardMap } from "./hazard-map";
import { ReportSummary } from "./report-summary";
import { VoiceControls } from "./voice-controls";

const PANEL_DELAY_MS = 250;

export default function ReportExplorer() {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState("");
  const [summaryError, setSummaryError] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const request = useRef<AbortController | null>(null);
  const [searchId, setSearchId] = useState(0);
  const [mapResets, setMapResets] = useState(0);
  const reportRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  // Only a client-side arrival from the homepage dive sets this flag, so the server render
  // (and any direct load) always sees false.
  const [arrivedByDive] = useState(() => {
    try {
      return typeof window !== "undefined" && sessionStorage.getItem(DIVE_FLAG) === "1";
    } catch {
      return false;
    }
  });
  const intro = arrivedByDive && !reducedMotion;
  const [panelIn, setPanelIn] = useState(!intro);
  const [replayIntro, setReplayIntro] = useState(0);
  const mountedOnce = useRef(false);

  // cacheComponents keeps this page alive between visits, so this also runs when the user dives
  // in again. It's a layout effect so the panel left visible by the last visit hides before paint.
  useLayoutEffect(() => {
    let flagged = false;
    try {
      flagged = sessionStorage.getItem(DIVE_FLAG) === "1";
      sessionStorage.removeItem(DIVE_FLAG);
    } catch {}
    const firstMount = !mountedOnce.current;
    mountedOnce.current = true;
    if (firstMount || !flagged || reducedMotion) return;
    setPanelIn(false);
    setReplayIntro((n) => n + 1);
  }, [reducedMotion]);
  useEffect(() => {
    if (panelIn) return;
    const timer = window.setTimeout(() => setPanelIn(true), PANEL_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [panelIn]);
  useEffect(() => () => request.current?.abort(), []);
  function revealReport() {
    const el = reportRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.72;
    if (top > window.scrollY) window.scrollTo({ top, behavior: reducedMotion ? "auto" : "smooth" });
  }
  function resetResult() {
    request.current?.abort();
    setReport(null);
    setError("");
    setSummary("");
    setSummaryError("");
    setSummaryLoading(false);
  }
  function clear() {
    resetResult();
    setLoading(false);
    setMapResets((n) => n + 1);
  }
  async function search(address: string) {
    resetResult();
    const controller = new AbortController();
    request.current = controller;
    setSearchId((id) => id + 1);
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
      requestAnimationFrame(revealReport);
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
              : "The summary couldn’t load. Explore the observations above.",
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
  const initialState = !report && !loading;
  return (
    <main
      id="main-content"
      className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen overflow-hidden bg-background text-foreground"
    >
      <section className="relative" aria-label="Find an address">
        <HazardMap
          report={report}
          loading={loading}
          variant="hero"
          intro={intro}
          replayIntro={replayIntro}
          resetView={mapResets}
          chromeIn={panelIn}
        />
        <div
          className={`absolute top-[clamp(16px,4vh,44px)] left-1/2 z-10 w-[min(760px,calc(100%-32px))] -translate-x-1/2 rounded-[28px] border border-white/10 bg-[#0d0b24]/65 px-[clamp(18px,3vw,36px)] pt-[clamp(18px,3vh,30px)] pb-[clamp(14px,2vh,22px)] text-[#eef1ff] shadow-[0_30px_80px_-30px_rgba(0,0,0,.9)] backdrop-blur-xl ${panelIn ? "translate-y-0 opacity-100 transition-[opacity,translate] duration-500 ease-out" : "pointer-events-none translate-y-3 opacity-0"}`}
        >
          <h1 className="mb-[clamp(14px,2.4vh,24px)] text-center font-serif text-[clamp(34px,3.6vw,54px)] font-normal leading-[1.06] tracking-[-2px] max-[760px]:text-[34px] max-[760px]:tracking-[-1.2px]">
            See your home from{" "}
            <em className="bg-gradient-to-r from-teal-300 via-sky-300 to-violet-400 bg-clip-text font-normal text-transparent">
              above.
            </em>
          </h1>
          <section id="search" className="focus:outline-none" tabIndex={-1}>
            <AddressSearch loading={loading} onSearch={search} onClear={clear} />
          </section>
          {error && (
            <div
              className="mt-3 flex items-center gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-destructive [&_svg]:shrink-0"
              role="alert"
            >
              <MapPin size={18} />
              <p className="m-0 text-[13px] leading-[1.6]">{error}</p>
            </div>
          )}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-5 bg-gradient-to-b from-transparent to-background" />
      </section>
      <section className="hfd-space">
        <div className="mx-auto max-w-[1536px] px-[6.3%] pt-[34px] pb-[60px] max-[1050px]:px-[5%] max-[760px]:px-[6%]">
          <div className={focusSection} id="report" ref={reportRef} tabIndex={-1}>
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

            {initialState ? (
              <div
                className="mx-auto mt-10 flex min-h-[320px] max-w-[1240px] flex-col items-center justify-center gap-3 rounded-[22px] border border-white/10 bg-[#0d0b24]/55 px-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,.06)] backdrop-blur-md"
                aria-label="Report placeholder"
              >
                <span className="grid size-11 place-items-center rounded-full border border-teal-300/25 bg-teal-300/5 text-teal-200">
                  <Satellite size={20} />
                </span>
                <p className="m-0 font-serif text-[22px] tracking-[-.4px]">
                  Your report starts here.
                </p>
                <p className="m-0 text-xs text-slate-400">
                  Enter a King County address above to see what satellites
                  observed there.
                </p>
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
        </div>
      </section>
    </main>
  );
}
