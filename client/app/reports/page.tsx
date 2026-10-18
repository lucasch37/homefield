"use client";

import { readSavedReports, type SavedReport } from "@/lib/saved-reports";
import { ArrowUpRight, ClipboardList, MapPin } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function ReportsPage() {
  const [reports, setReports] = useState<SavedReport[] | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setReports(readSavedReports()));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <main
      id="main-content"
      className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen min-h-[calc(100vh-190px)] bg-background text-foreground"
    >
      <section className="rounded-b-[clamp(34px,5vw,72px)] border-b border-violet-300/15 bg-[#171025] px-[6.3%] text-[#eef1ff] max-[1050px]:px-[5%] max-[760px]:rounded-b-[30px] max-[760px]:px-[6%]">
        <div className="mx-auto max-w-[1240px] py-16 max-[760px]:py-12">
          <h1 className="font-serif text-[clamp(48px,5.1vw,73px)] font-normal leading-[1.06] tracking-[-3px]">
            Your <span className="italic text-violet-300">reports.</span>
          </h1>
          <p className="mt-6 max-w-[650px] text-sm leading-7 text-white/70">
            A quick look back at your 20 most recent addresses.
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
    </main>
  );
}
