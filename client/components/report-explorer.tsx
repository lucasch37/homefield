"use client";
if (typeof window !== "undefined") {
  (window as Window & { __explorer?: boolean }).__explorer = true;
}
import { fetchJSON } from "@/lib/api";
import { buildFacts } from "@/lib/facts";
<<<<<<< HEAD
import { reportHeadline } from "@/lib/hazards";
=======
>>>>>>> origin/master
import { saveReport } from "@/lib/saved-reports";
import { DEMO_PLACES, parseSearch, reportUrl } from "@/lib/search";
import { normalizeReport, type Report } from "@/lib/types";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AddressSearch } from "./address-search";
import { HazardDashboard } from "./hazard-charts";
import { HazardMap } from "./hazard-map";
import { ReportSummary } from "./report-summary";
import { DIVE_FLAG } from "./space/dive-context";
import { usePrefersReducedMotion } from "./space/use-reduced-motion";
import { showPolishedToast } from "./ui/halo-toast";
import { VoiceControls } from "./voice-controls";

<<<<<<< HEAD
const PANEL_DELAY_MS = 400;
// Safety caps, in case the map is slow or fails: lift the arrival veil, then start the avatar shader.
const VEIL_CAP_MS = 1800;
const INTRO_CAP_MS = 6000;
=======
const PANEL_DELAY_MS = 250;
>>>>>>> origin/master
type Summary = { summary: string; source?: "gemini" | "data"; note?: string };

function shortSummary(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= 320) return trimmed;
  const sentenceEnd = trimmed.slice(0, 320).lastIndexOf(". ");
  return sentenceEnd > 80
    ? trimmed.slice(0, sentenceEnd + 1)
    : `${trimmed.slice(0, 317).trimEnd()}…`;
}

export default function ReportExplorer() {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [summaryError, setSummaryError] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const request = useRef<AbortController | null>(null);
  const [searchId, setSearchId] = useState(0);
  const [mapResets, setMapResets] = useState(0);
  const [placeName, setPlaceName] = useState<string | undefined>();
  const reportRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  // Only a client-side arrival from the homepage dive sets this flag, so the server render
  // (and any direct load) always sees false.
  const [arrivedByDive] = useState(() => {
    try {
      return (
        typeof window !== "undefined" &&
        sessionStorage.getItem(DIVE_FLAG) === "1"
      );
    } catch {
      return false;
    }
  });
  const intro = arrivedByDive && !reducedMotion;
  const [panelIn, setPanelIn] = useState(!intro);
<<<<<<< HEAD
  const [veil, setVeil] = useState(intro);
  const [introDone, setIntroDone] = useState(!intro);
=======
>>>>>>> origin/master
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
<<<<<<< HEAD
    setVeil(true);
    setIntroDone(false);
    setReplayIntro((n) => n + 1);
  }, [reducedMotion]);
  useEffect(() => {
    if (!veil) return;
    const timer = window.setTimeout(() => setVeil(false), VEIL_CAP_MS);
    return () => window.clearTimeout(timer);
  }, [veil]);
  useEffect(() => {
    if (introDone) return;
    const timer = window.setTimeout(() => setIntroDone(true), INTRO_CAP_MS);
    return () => window.clearTimeout(timer);
  }, [introDone]);
  useEffect(() => {
    if (panelIn || veil) return;
    const timer = window.setTimeout(() => setPanelIn(true), PANEL_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [panelIn, veil]);
=======
    setReplayIntro((n) => n + 1);
  }, [reducedMotion]);
  useEffect(() => {
    if (panelIn) return;
    const timer = window.setTimeout(() => setPanelIn(true), PANEL_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [panelIn]);
>>>>>>> origin/master
  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    if (!error) return;
    showPolishedToast({
      id: "search-error",
      title: "We couldn’t complete that search",
      description: error,
      politeness: "alert",
      rimVariant: "destructive",
    });
  }, [error]);
  useEffect(() => {
    const address = new URLSearchParams(window.location.search).get("address");
    if (address) void search(address);
    // A saved report link is loaded once; further searches come from the form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  function revealReport() {
    const el = reportRef.current;
    if (!el) return;
    const top =
      el.getBoundingClientRect().top +
      window.scrollY -
      window.innerHeight * 0.5;
    if (top > window.scrollY)
      window.scrollTo({ top, behavior: reducedMotion ? "auto" : "smooth" });
  }
  function resetResult() {
    request.current?.abort();
    setReport(null);
    setError("");
    setSummary(null);
    setSummaryError("");
    setSummaryLoading(false);
  }
  function clear() {
    resetResult();
    setLoading(false);
    setPlaceName(undefined);
    setMapResets((n) => n + 1);
  }
  async function search(text: string) {
    const query = parseSearch(text);
    if (!query) return;
    resetResult();
    const controller = new AbortController();
    request.current = controller;
    setSearchId((id) => id + 1);
    setPlaceName(
      DEMO_PLACES.find(
        (place) => place.query === text.trim() && !("address" in query),
      )?.label,
    );
    setLoading(true);
    try {
      const result = normalizeReport(
        await fetchJSON<unknown>(reportUrl(query), {
          signal: controller.signal,
        }),
      );
      if (controller.signal.aborted) return;
      if (!result.in_king_county) {
        setError(
          result.message ||
            "We're starting close to home. This report currently covers King County, Washington. Try an address within the county.",
        );
        return;
      }
      setReport(result);
      const facts = buildFacts(result);
      const label = result.address || text.trim();
      const savedAt = new Date().toISOString();
      const fallback =
        facts.hazards.find((hazard) => hazard.key === facts.lead)?.finding ||
        "Satellite observations are available for this location.";
<<<<<<< HEAD
      const headline = reportHeadline(result);
=======
>>>>>>> origin/master
      saveReport({
        address: label,
        query: text.trim(),
        summary: shortSummary(fallback),
        savedAt,
<<<<<<< HEAD
        ...headline,
=======
>>>>>>> origin/master
      });
      setLoading(false);
      requestAnimationFrame(revealReport);
      setSummaryLoading(true);
      try {
        const resultSummary = await fetchJSON<Summary>("/api/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(result),
          signal: controller.signal,
        });
        if (!controller.signal.aborted) {
          setSummary(resultSummary);
          saveReport({
            address: label,
            query: text.trim(),
            summary: shortSummary(resultSummary.summary),
            savedAt,
<<<<<<< HEAD
            ...headline,
=======
>>>>>>> origin/master
          });
        }
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
      className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] -mt-[94px] w-screen overflow-hidden bg-background text-foreground max-[760px]:-mt-[77px]"
    >
<<<<<<< HEAD
      <div
        aria-hidden="true"
        className={`pointer-events-none fixed inset-0 z-50 bg-black transition-opacity duration-700 ease-out ${veil ? "opacity-100" : "opacity-0"}`}
      />
=======
>>>>>>> origin/master
      <section className="relative" aria-label="Find an address">
        <HazardMap
          report={report}
          loading={loading}
          label={placeName}
          variant="hero"
          intro={intro}
          replayIntro={replayIntro}
          resetView={mapResets}
          chromeIn={panelIn}
<<<<<<< HEAD
          onIntroReady={() => setVeil(false)}
          onIntroDone={() => setIntroDone(true)}
        />
        <div
          className={`absolute top-[calc(94px+clamp(16px,4vh,44px))] left-1/2 z-10 w-[min(960px,calc(100%-32px))] -translate-x-1/2 rounded-[28px] border border-violet-300/15 bg-[#07040d]/80 px-[clamp(18px,3vw,36px)] pt-[clamp(18px,3vh,30px)] pb-[clamp(14px,2vh,22px)] text-[#eef1ff] shadow-[0_30px_80px_-30px_rgba(0,0,0,.9)] backdrop-blur-xl max-[760px]:top-[calc(77px+12px)] max-[760px]:rounded-[22px] max-[760px]:px-4 max-[760px]:pt-4 max-[760px]:pb-3 ${panelIn ? "translate-y-0 opacity-100 transition-[opacity,translate] duration-500 ease-out" : "pointer-events-none translate-y-3 opacity-0"}`}
        >
          <h1 className="mb-[clamp(14px,2.4vh,24px)] py-4 text-center font-serif text-[clamp(34px,3.6vw,54px)] font-normal leading-[1.06] tracking-[-2px] max-[760px]:mb-3 max-[760px]:py-1 max-[760px]:text-[28px] max-[760px]:tracking-[-1px]">
=======
        />
        <div
          className={`absolute top-[calc(94px+clamp(16px,4vh,44px))] left-1/2 z-10 w-[min(960px,calc(100%-32px))] -translate-x-1/2 rounded-[28px] border border-violet-300/15 bg-[#0b0714]/80 px-[clamp(18px,3vw,36px)] pt-[clamp(18px,3vh,30px)] pb-[clamp(14px,2vh,22px)] text-[#eef1ff] shadow-[0_30px_80px_-30px_rgba(0,0,0,.9)] backdrop-blur-xl max-[760px]:top-[calc(77px+clamp(16px,4vh,44px))] ${panelIn ? "translate-y-0 opacity-100 transition-[opacity,translate] duration-500 ease-out" : "pointer-events-none translate-y-3 opacity-0"}`}
        >
          <h1 className="mb-[clamp(14px,2.4vh,24px)] py-4 text-center font-serif text-[clamp(34px,3.6vw,54px)] font-normal leading-[1.06] tracking-[-2px] max-[760px]:text-[34px] max-[760px]:tracking-[-1.2px]">
>>>>>>> origin/master
            See your home from{" "}
            <em className="font-normal text-violet-300">above.</em>
          </h1>
          <section id="search" className="focus:outline-none" tabIndex={-1}>
            <AddressSearch
              loading={loading}
              onSearch={search}
              onClear={clear}
<<<<<<< HEAD
              shader={introDone}
=======
>>>>>>> origin/master
            />
          </section>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-5 bg-gradient-to-b from-transparent to-background" />
      </section>
      <section className="hfd-space">
        <div className="mx-auto max-w-[1536px] px-[6.3%] pt-[34px] pb-[60px] max-[1050px]:px-[5%] max-[760px]:px-[6%]">
          <div
            className={focusSection}
            id="report"
            ref={reportRef}
            tabIndex={-1}
          >
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
<<<<<<< HEAD
                className="mx-auto mt-10 flex min-h-[320px] max-w-[1240px] flex-col items-center justify-center gap-3 rounded-[22px] border border-violet-300/15 bg-[#0b0614]/70 px-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,.06)] backdrop-blur-md"
=======
                className="mx-auto mt-10 flex min-h-[320px] max-w-[1240px] flex-col items-center justify-center gap-3 rounded-[22px] border border-violet-300/15 bg-[#0d0918]/70 px-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,.06)] backdrop-blur-md"
>>>>>>> origin/master
                aria-label="Report placeholder"
              >
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
                      summary={summary?.summary ?? ""}
                      source={summary?.source}
                      note={summary?.note}
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
