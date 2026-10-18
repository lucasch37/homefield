"use client";
import { Activity, ArrowUpRight, ChevronDown, Droplets, ScanLine, Sun } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { finding, hazardMeta } from "@/lib/hazards";
import type { Hazard, HazardKind } from "@/lib/types";

const icons = { flood: Droplets, heat: Sun, ground_motion: Activity };
const accents: Record<HazardKind, string> = {
  flood: "border-[#cfe3ee] bg-[#eaf4f8] text-[#1d5f7a]",
  heat: "border-[#f1dccb] bg-[#fbf0e6] text-[#9a4d1c]",
  ground_motion: "border-[#dcd8ef] bg-[#efedf9] text-[#4a3f8c]",
};

export function HazardCard({ kind, hazard, loading }: { kind: HazardKind; hazard?: Hazard; loading: boolean }) {
  const meta = hazardMeta[kind];
  const Icon = icons[kind];
  const result = hazard ? finding(hazard, kind) : null;
  const muted = hazard && ["error", "not_enough_data", "not_available"].includes(hazard.status);
  const skeleton = "h-2.5 w-full animate-pulse rounded bg-[#e3e9e3]";
  return (
    <div
      id={`finding-${kind}`}
      data-testid={`card-${kind}`}
      className="flex w-full min-w-0 scroll-mt-6 flex-col overflow-hidden rounded-[18px] border border-[#dfe6dc] bg-white"
    >
      <article className="relative flex flex-1 flex-col p-6 text-[#123d36]" aria-busy={loading} aria-label={meta.title}>
        <div className="flex items-center gap-3">
          <div className={`grid size-[37px] shrink-0 place-items-center rounded-lg border ${accents[kind]}`}>
            <Icon size={20} strokeWidth={1.7} />
          </div>
          <div className="min-w-0">
            <p className="mb-[5px] text-[8px] font-semibold tracking-[1.3px] text-[#6e8772]">{meta.eyebrow}</p>
            <h3 className="font-serif text-[clamp(21px,2vw,27px)] font-normal tracking-[-.6px]">{meta.title}</h3>
          </div>
          {result && !loading && (
            <span
              data-testid={`status-${kind}`}
              className={`ml-auto rounded-full px-3 py-1.5 text-center text-[10px] ${muted ? "bg-[#eceeea] text-[#5a6762]" : "bg-[#edf3e9] text-[#356244]"}`}
            >
              {result.label}
            </span>
          )}
        </div>
        {loading ? (
          <div className="grid gap-3 py-[25px]" aria-label={`Loading ${meta.title.toLowerCase()}`}>
            <div className={skeleton} />
            <div className={skeleton} />
            <div className={`${skeleton} w-3/5`} />
          </div>
        ) : result && hazard ? (
          <div className="mt-5 flex flex-1 flex-col">
            {result.metric && (
              <p className="mb-3 font-serif text-[clamp(28px,2.6vw,36px)] leading-none tracking-[-1.5px] text-[#123d36]" data-testid={`metric-${kind}`}>
                {result.metric}
              </p>
            )}
            <p className="mb-3 text-[13px] leading-[1.75] text-[#52665f]">{result.text}</p>
            {result.detail && <p className="mb-5 text-[12px] font-medium leading-[1.7] text-[#2f5a48]" data-testid={`detail-${kind}`}>{result.detail}</p>}
            <div className="mt-auto flex gap-3 rounded-xl border border-[#cbd9d2] bg-[#f7faf6] p-4 text-[#123d36] [&>svg]:shrink-0">
              <ArrowUpRight size={18} />
              <div>
                <h4 className="text-[12px] font-medium">{hazard.action || meta.action}</h4>
                <p className="mt-1.5 text-[11px] leading-[1.7] text-[#64746f]">{meta.actionDetail}</p>
                {meta.href && (
                  <a className="mt-2 inline-flex items-center gap-[5px] text-[11px] text-[#295a40] underline underline-offset-[3px]" href={meta.href} target="_blank" rel="noreferrer">
                    {meta.linkLabel}
                    <ArrowUpRight size={12} />
                  </a>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </article>
      {result && hazard && !loading && (
        <Collapsible className="border-t border-[#e6ece3] bg-[#f7f9f5] text-[#52665f]">
          <CollapsibleTrigger className="flex w-full items-center justify-between px-6 py-[15px] text-[11px] font-medium data-[state=open]:[&>svg]:rotate-180 [&>span]:flex [&>span]:items-center [&>span]:gap-[7px] [&>svg]:transition-transform">
            <span><ScanLine size={14} />How we know this</span>
            <ChevronDown size={15} />
          </CollapsibleTrigger>
          <CollapsibleContent className="border-t border-[#e6ece3] px-6 pt-[18px] pb-[22px] text-[11px] leading-[1.7] [&_dl]:mt-0 [&_dl]:mb-[13px] [&_dl]:grid [&_dl]:gap-3 [&_dl>div]:grid [&_dl>div]:gap-1 [&_dt]:text-[#71847d] [&_dd]:m-0 [&_dd]:[overflow-wrap:anywhere] [&_h4]:text-[11px] [&_h4]:font-medium [&_ul]:mt-2 [&_ul]:pl-4">
            <dl>
              <div><dt>Source</dt><dd>{hazard.source.name}</dd></div>
              <div><dt>Observed</dt><dd>{hazard.source.dates || "The data files don’t record the full set of pass dates for this layer."}</dd></div>
              <div><dt>Resolution</dt><dd>{hazard.source.resolution_m !== null ? `${hazard.source.resolution_m} m` : "Not provided"}</dd></div>
            </dl>
            <h4>What this can’t tell you</h4>
            {hazard.source.limitations.length ? (
              <ul>{hazard.source.limitations.map((limit, i) => <li key={i}>{limit}</li>)}</ul>
            ) : (
              <p>Limitations were not provided by the data service. Interpret this observation with care.</p>
            )}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
