import { Quote, Sparkles } from "lucide-react";
export function ReportSummary({
  loading,
  summary,
  error,
}: {
  loading: boolean;
  summary: string;
  error: string;
}) {
  const skeleton = "h-2.5 w-full animate-pulse rounded bg-white/10";
  return (
    <section
      className="relative mb-[15px] overflow-hidden rounded-[22px] border border-white/10 bg-[#0d0b24]/60 px-[clamp(22px,4vw,48px)] py-[clamp(24px,4vw,43px)] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_24px_48px_-28px_rgba(0,0,0,.85)] backdrop-blur-md before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-gradient-to-b before:from-teal-300 before:via-sky-300 before:to-violet-400"
      aria-busy={loading}
      aria-live="polite"
    >
      <div className="absolute -top-12 -right-10 size-56 rounded-full bg-violet-400/10 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-20 left-1/4 size-48 rounded-full bg-teal-300/5 blur-3xl" aria-hidden="true" />
      <div className="relative flex items-center gap-2.5 text-teal-200">
        <span className="grid size-8 place-items-center rounded-full border border-teal-300/25 bg-teal-300/10">
          <Sparkles size={16} />
        </span>
        <h3 className="text-[10px] font-semibold tracking-[1.6px] uppercase">
          Your home, in perspective
        </h3>
        <span className="ml-auto shrink-0 rounded-full border border-white/15 px-2.5 py-1 font-mono text-[8px] tracking-[1.2px] whitespace-nowrap text-slate-400">GROK SUMMARY</span>
      </div>
      {loading ? (
        <div className="grid max-w-[880px] gap-3 pt-7">
          <div className={skeleton} />
          <div className={skeleton} />
          <div className={`${skeleton} w-3/5`} />
        </div>
      ) : (
        <div className="relative mt-6 grid grid-cols-[32px_1fr] gap-3 max-[560px]:grid-cols-1">
          <Quote className="mt-1 text-teal-300/60" size={24} strokeWidth={1.5} aria-hidden="true" />
          <p className="m-0 max-w-[900px] font-serif text-[clamp(20px,2.3vw,31px)] leading-[1.38] tracking-[-.45px] text-foreground">
            {summary ||
              error ||
              "Explore the observations above while we prepare your summary."}
          </p>
        </div>
      )}
    </section>
  );
}
