"use client";
import {
  Activity,
  ArrowUpRight,
  ChevronDown,
  Droplets,
  ScanLine,
  Sun,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { finding, hazardMeta } from "@/lib/hazards";
import type { Hazard, HazardKind } from "@/lib/types";

const icons = { flood: Droplets, heat: Sun, ground_motion: Activity };
const tone = {
  symbol: "border-[#dce7db] bg-[#edf3ea] text-[#295a40]",
  eyebrow: "text-[#6e8772]",
  status: "bg-[#edf3e9] text-[#356244]",
  detail: "text-[#456d4f]",
  arrow: "text-[#295a40]",
};

export function HazardCard({
  kind,
  hazard,
  loading,
}: {
  kind: HazardKind;
  hazard?: Hazard;
  loading: boolean;
}) {
  const meta = hazardMeta[kind];
  const Icon = icons[kind];
  const result = hazard ? finding(hazard, kind) : null;
  const skeleton = "h-2.5 w-full animate-pulse rounded bg-muted";
  const muted =
    hazard &&
    ["error", "not_enough_data", "not_available"].includes(hazard.status);
  return (
    <div id={`finding-${kind}`} className="mx-auto flex w-full scroll-mt-6 flex-col overflow-hidden rounded-[18px] border border-[#dfe6dc] bg-white">
      <article
      className="relative overflow-hidden p-6 text-[#123d36]"
      aria-busy={loading}
    >
      <div className="flex items-center gap-3">
        <div
          className={`grid size-[37px] shrink-0 place-items-center rounded-lg border ${tone.symbol}`}
        >
          <Icon size={20} strokeWidth={1.7} />
        </div>
        <div>
          <p
            className={`mb-[5px] text-[7px] font-semibold tracking-[1.3px] ${tone.eyebrow}`}
          >
            {meta.eyebrow}
          </p>
          <h3 className="font-serif text-[clamp(21px,2.2vw,30px)] font-normal tracking-[-.6px]">{meta.title}</h3>
        </div>
        {result && (
          <span
            className={`ml-auto whitespace-nowrap rounded-full px-3 py-1.5 text-[9px] ${muted ? "bg-[#dceee8] text-[#466b5f]" : tone.status}`}
          >
            {result.label}
          </span>
        )}
      </div>
      {loading ? (
        <div
          className="grid gap-3 py-[25px]"
          aria-label={`Loading ${meta.title}`}
        >
          <div className={skeleton} />
          <div className={skeleton} />
          <div className={`${skeleton} w-3/5`} />
        </div>
      ) : result ? (
        <>
          <div className="mt-5">
            <div>
              {result.metric && (
                <p className="mb-4 font-serif text-[36px] leading-none tracking-[-2px] text-[#123d36]">
                  {result.metric}
                </p>
              )}
              <p className="mb-3 max-w-[680px] text-[13px] leading-[1.8] text-[#52665f]">
                {result.text}
              </p>
              {result.detail && (
                <p className={`mb-5 text-[11px] leading-[1.7] ${tone.detail}`}>
                  {result.detail}
                </p>
              )}
              <div className="flex gap-3 rounded-xl border border-[#cbd9d2] bg-white/75 p-4 text-[#123d36] [&>svg]:shrink-0">
                <ArrowUpRight size={18} />
                <div>
                  <h4 className="text-[12px] font-medium">{meta.action}</h4>
                  <p className="mt-1.5 text-[10px] leading-[1.7] text-[#64746f]">
                    {meta.actionDetail}
                  </p>
                  {meta.href && (
                    <a
                      className="mt-2 inline-flex items-center gap-[5px] text-[10px] text-[#295a40] underline underline-offset-[3px]"
                      href={meta.href}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {meta.linkLabel}
                      <ArrowUpRight size={12} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <p className="my-4 mb-[15px] text-xs leading-[1.75] text-[#52665f]">
            {kind === "flood"
              ? "Where satellites have observed water."
              : kind === "heat"
                ? "How warm the ground and roofs get."
                : "How the land slowly moves over time."}
          </p>
          <p className="mb-0 flex items-center justify-between rounded-xl border border-[#cbd9d2] bg-white/75 px-4 py-3 text-[10px] text-[#52665f]">
            Add an address to see observations{" "}
            <span className={`text-[15px] ${tone.arrow}`}>↗</span>
          </p>
        </>
      )}
      </article>
      {result && hazard && (
        <Collapsible className="overflow-hidden border-t border-[#e6ece3] bg-[#f7f9f5] text-[#52665f]">
          <CollapsibleTrigger className="flex w-full items-center justify-between px-[clamp(20px,3vw,34px)] py-[15px] text-[10px] font-medium data-[state=open]:[&>svg]:rotate-180 [&>span]:flex [&>span]:items-center [&>span]:gap-[7px] [&>svg]:transition-transform">
            <span>
              <ScanLine size={14} />
              How we know this
            </span>
            <ChevronDown size={15} />
          </CollapsibleTrigger>
          <CollapsibleContent className="border-t border-[#e6ece3] px-[clamp(20px,3vw,34px)] pb-[22px] pt-[18px] text-[10px] leading-[1.7] [&_dl]:mb-[13px] [&_dl]:mt-0 [&_dl]:grid [&_dl]:grid-cols-1 [&_dl]:gap-5 max-[760px]:[&_dl]:grid-cols-1 [&_dl>div]:mb-[7px] [&_dl>div]:grid [&_dl>div]:gap-1 [&_dt]:text-[#71847d] [&_dd]:m-0 [&_dd]:[overflow-wrap:anywhere] [&_h4]:text-[11px] [&_h4]:font-medium [&_ul]:mt-2 [&_ul]:pl-4">
            <dl>
              <div>
                <dt>Source</dt>
                <dd>{hazard.source.name}</dd>
              </div>
              <div>
                <dt>Observed</dt>
                <dd>{hazard.source.dates || "Observation dates not provided"}</dd>
              </div>
              <div>
                <dt>Resolution</dt>
                <dd>{hazard.source.resolution_m !== null ? `${hazard.source.resolution_m} m` : "Not provided"}</dd>
              </div>
            </dl>
            <h4>What this can’t tell you</h4>
            {hazard.source.limitations.length ? (
              <ul>
                {hazard.source.limitations.map((limit, i) => <li key={i}>{limit}</li>)}
              </ul>
            ) : (
              <p>Limitations were not provided by the data service. Interpret this observation with care.</p>
            )}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
