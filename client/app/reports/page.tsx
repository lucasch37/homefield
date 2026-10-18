"use client";

<<<<<<< HEAD
import { fetchJSON } from "@/lib/api";
import { compareUrl, MAX_COMPARE, MIN_COMPARE } from "@/lib/compare";
import { reportHeadline } from "@/lib/hazards";
import { readSavedReports, saveReport, type SavedReport } from "@/lib/saved-reports";
import { parseSearch, reportUrl } from "@/lib/search";
import { severityColor } from "@/lib/severity";
import { normalizeReport } from "@/lib/types";
import { ArrowUpRight, Check, ClipboardList, Columns3, MapPin } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function ReportsPage() {
  const [reports, setReports] = useState<SavedReport[] | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  const [failed, setFailed] = useState<string[]>([]);
  const backfilling = useRef<AbortController | null>(null);
=======
import { readSavedReports, type SavedReport } from "@/lib/saved-reports";
import { ArrowUpRight, ClipboardList, MapPin } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function ReportsPage() {
  const [reports, setReports] = useState<SavedReport[] | null>(null);
>>>>>>> origin/master

  useEffect(() => {
    const frame = requestAnimationFrame(() => setReports(readSavedReports()));
    return () => cancelAnimationFrame(frame);
  }, []);

<<<<<<< HEAD
  // Reports saved before headlines existed get one looked up once, then saved with the report.
  useEffect(() => {
    if (!reports || backfilling.current) return;
    const controller = new AbortController();
    backfilling.current = controller;
    for (const saved of reports.filter((report) => !report.headline)) {
      const fail = () => {
        if (!controller.signal.aborted) setFailed((current) => [...current, saved.query]);
      };
      const query = parseSearch(saved.query);
      if (!query) {
        fail();
        continue;
      }
      fetchJSON<unknown>(reportUrl(query), { signal: controller.signal })
        .then((data) => {
          const result = normalizeReport(data);
          const headline = result.in_king_county ? reportHeadline(result) : null;
          if (controller.signal.aborted) return;
          if (!headline) return fail();
          const updated = { ...saved, ...headline };
          saveReport(updated);
          setReports((current) =>
            current?.map((report) => (report.query === saved.query ? updated : report)) ?? current,
          );
        })
        .catch(fail);
    }
  }, [reports]);
  useEffect(() => () => {
    backfilling.current?.abort();
    backfilling.current = null;
  }, []);

  const full = selected.length >= MAX_COMPARE;
  const canCompare = selected.length >= MIN_COMPARE;

  function toggle(query: string) {
    setSelected((current) =>
      current.includes(query)
        ? current.filter((item) => item !== query)
        : current.length >= MAX_COMPARE
          ? current
          : [...current, query],
    );
  }

=======
>>>>>>> origin/master
  return (
    <main
      id="main-content"
      className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen min-h-[calc(100vh-190px)] bg-background text-foreground"
    >
<<<<<<< HEAD
      <section className="rounded-b-[clamp(34px,5vw,72px)] border-b border-violet-300/15 bg-[#120b1f] px-[6.3%] text-[#eef1ff] max-[1050px]:px-[5%] max-[760px]:rounded-b-[30px] max-[760px]:px-[6%]">
=======
      <section className="rounded-b-[clamp(34px,5vw,72px)] border-b border-violet-300/15 bg-[#171025] px-[6.3%] text-[#eef1ff] max-[1050px]:px-[5%] max-[760px]:rounded-b-[30px] max-[760px]:px-[6%]">
>>>>>>> origin/master
        <div className="mx-auto max-w-[1240px] py-16 max-[760px]:py-12">
          <h1 className="font-serif text-[clamp(48px,5.1vw,73px)] font-normal leading-[1.06] tracking-[-3px]">
            Your <span className="italic text-violet-300">reports.</span>
          </h1>
          <p className="mt-6 max-w-[650px] text-sm leading-7 text-white/70">
<<<<<<< HEAD
            Your recent addresses. Pick two or three to compare.
=======
            A quick look back at your 20 most recent addresses.
>>>>>>> origin/master
          </p>
        </div>
      </section>

      <section className="min-h-screen w-full px-[6.3%] py-14 pb-20 max-[1050px]:px-[5%] max-[760px]:px-[6%]">
        <div className="mx-auto max-w-[1240px]">
          {reports?.length ? (
            <section
              aria-label="Saved reports"
              className="grid gap-4 md:grid-cols-2"
            >
<<<<<<< HEAD
              {reports.map((report) => {
                const isSelected = selected.includes(report.query);
                const disabled = full && !isSelected;
                return (
                  <article
                    key={report.address.toLowerCase()}
                    className={`flex flex-col rounded-2xl border bg-[#0b0614]/85 p-5 text-[#eef1ff] shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_20px_40px_-20px_rgba(0,0,0,.8)] transition-colors ${isSelected ? "border-violet-300/60" : "border-violet-300/15"}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <MapPin size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-violet-300" />
                      <div className="min-w-0">
                        <h2 className="break-words text-base leading-snug font-semibold">
                          {report.address}
                        </h2>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          {new Date(report.savedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {report.headline ? (
                      <p className="mt-3 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[.04] px-3 py-1 text-[11px] text-slate-200">
                        <i
                          aria-hidden="true"
                          className="block size-2 rounded-full"
                          style={{ background: severityColor(report.severity ?? "unknown") }}
                        />
                        {report.headline}
                      </p>
                    ) : !failed.includes(report.query) ? (
                      <span
                        aria-label="Loading the main finding"
                        className="mt-3 block h-[26px] w-44 animate-pulse rounded-full bg-white/[.06]"
                      />
                    ) : null}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <Link
                        className="inline-flex w-fit items-center gap-2 text-xs font-semibold text-violet-300 hover:underline"
                        href={`/search?address=${encodeURIComponent(report.query)}`}
                      >
                        Open report <ArrowUpRight size={15} />
                      </Link>
                      <button
                        type="button"
                        aria-pressed={isSelected}
                        disabled={disabled}
                        title={disabled ? `You can compare up to ${MAX_COMPARE} reports` : undefined}
                        onClick={() => toggle(report.query)}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${isSelected ? "border-violet-300 bg-violet-300 text-[#1e1033]" : "border-violet-300/30 text-violet-300 hover:bg-violet-300/10"}`}
                      >
                        {isSelected ? <Check size={14} /> : <Columns3 size={14} />}
                        {isSelected ? "Selected" : "Compare"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </section>
          ) : reports ? (
            <section className="flex flex-col items-start rounded-2xl border border-violet-300/15 bg-[#0b0614]/85 p-8">
=======
              {reports.map((report) => (
                <article
                  key={report.address.toLowerCase()}
                  className="flex flex-col rounded-2xl border border-violet-300/15 bg-[#0d0918]/85 p-6 text-[#eef1ff] shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_20px_40px_-20px_rgba(0,0,0,.8)]"
                >
                  <div className="mb-4 flex items-start gap-3 text-[#eef1ff]">
                    <span className="grid size-9 shrink-0 place-items-center">
                      <MapPin size={32} strokeWidth={1} />
                    </span>
                    <div className="min-w-0">
                      <h2 className="break-words text-xl leading-snug font-semibold">
                        {report.address}
                      </h2>
                      <p className="mt-1 text-[11px] text-slate-400">
                        Searched {new Date(report.savedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className="mb-6 text-[13px] leading-6 text-slate-300">
                    {report.summary}
                  </p>
                  <Link
                    className="mt-auto inline-flex w-fit items-center gap-2 text-xs font-semibold text-violet-300 hover:underline"
                    href={`/search?address=${encodeURIComponent(report.query)}`}
                  >
                    Open report <ArrowUpRight size={15} />
                  </Link>
                </article>
              ))}
            </section>
          ) : reports ? (
            <section className="flex flex-col items-start rounded-2xl border border-violet-300/15 bg-[#0d0918]/85 p-8">
>>>>>>> origin/master
              <ClipboardList size={28} className="mb-5 text-violet-300" />
              <h2 className="font-serif text-2xl">No saved reports yet.</h2>
              <p className="mt-2 mb-6 text-sm text-muted-foreground">
                Search a King County address to see it here.
              </p>
              <Link
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-xs font-semibold text-primary-foreground"
                href="/search"
              >
                Search an address <ArrowUpRight size={16} />
              </Link>
            </section>
          ) : null}
        </div>
      </section>
<<<<<<< HEAD

      {selected.length > 0 && (
        <div
          role="region"
          aria-label="Compare selected reports"
          className="fixed inset-x-0 bottom-6 z-30 flex justify-center px-4"
        >
          <div className="flex w-full max-w-[560px] flex-wrap items-center justify-between gap-3 rounded-full border border-violet-300/25 bg-[#120b1f]/95 py-2.5 pr-2.5 pl-6 text-[#eef1ff] shadow-[0_20px_50px_-20px_rgba(0,0,0,.95)] backdrop-blur-xl">
            <p className="m-0 text-xs text-white/75" aria-live="polite">
              {selected.length} of {MAX_COMPARE} selected
              {!canCompare && " · pick one more"}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelected([])}
                className="rounded-full px-4 py-2 text-xs font-semibold text-white/70 hover:text-white"
              >
                Clear
              </button>
              {canCompare ? (
                <Link
                  href={compareUrl(selected)}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground"
                >
                  Compare <ArrowUpRight size={15} />
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  className="inline-flex cursor-not-allowed items-center gap-2 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground opacity-40"
                >
                  Compare <ArrowUpRight size={15} />
                </span>
              )}
            </div>
          </div>
        </div>
      )}
=======
>>>>>>> origin/master
    </main>
  );
}
