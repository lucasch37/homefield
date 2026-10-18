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
      className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen min-h-[calc(100vh-190px)] bg-[#f6f7f4] text-[#123d36]"
    >
      <section className="rounded-b-[clamp(34px,5vw,72px)] bg-[#023e34] px-[6.3%] text-[#f6f6f6] max-[1050px]:px-[5%] max-[760px]:rounded-b-[30px] max-[760px]:px-[6%]">
        <div className="mx-auto max-w-[1240px] py-16 max-[760px]:py-12">
          <h1 className="font-serif text-[clamp(48px,5.1vw,73px)] font-normal leading-[1.06] tracking-[-3px]">
            Your <span className="italic text-[#c9f222]">reports.</span>
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
                  className="flex flex-col rounded-2xl bg-card p-6 shadow-[0_16px_36px_-24px_#001f1a] border-4 border-[#c9f222]"
                >
                  <div className="mb-4 flex items-start gap-3 text-white">
                    <span className="grid size-9 shrink-0 place-items-center">
                      <MapPin size={32} strokeWidth={1} />
                    </span>
                    <div className="min-w-0">
                      <h2 className="break-words text-xl leading-snug font-semibold">
                        {report.address}
                      </h2>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Searched {new Date(report.savedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className="mb-6 text-[13px] leading-6 text-muted-foreground">
                    {report.summary}
                  </p>
                  <Link
                    className="mt-auto inline-flex w-fit items-center gap-2 text-xs font-semibold text-primary hover:underline"
                    href={`/search?address=${encodeURIComponent(report.query)}`}
                  >
                    Open report <ArrowUpRight size={15} />
                  </Link>
                </article>
              ))}
            </section>
          ) : reports ? (
            <section className="flex flex-col items-start rounded-2xl border border-border bg-card p-8">
              <ClipboardList size={28} className="mb-5 text-primary" />
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
