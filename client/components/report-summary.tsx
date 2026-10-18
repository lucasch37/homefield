import { Quote, Sparkles } from "lucide-react";

export function ReportSummary({
  loading,
  summary,
  source,
  note,
  error,
}: {
  loading: boolean;
  summary: string;
  source?: "gemini" | "data";
  note?: string;
  error: string;
}) {
  const skeleton = "h-2.5 w-full animate-pulse rounded bg-white/10";
  return (
    <section
      className="relative mb-[15px] overflow-hidden rounded-[22px] border bg-[#0d0918]/80 px-[clamp(22px,4vw,48px)] py-[clamp(24px,4vw,43px)] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_24px_48px_-28px_rgba(0,0,0,.85)] backdrop-blur-md before:absolute before:inset-y-0 before:left-0 before:w-[3px] border-violet-300/50"
      aria-busy={loading}
      aria-live="polite"
      aria-label="Summary"
    >
      <div
        className="absolute -top-12 -right-10 size-56 rounded-full bg-violet-400/10 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative flex items-center gap-2.5 text-violet-200">
        <span className="grid size-8 place-items-center rounded-full border border-violet-300/50 bg-violet-300/10">
          <Sparkles size={16} />
        </span>
        <h3 className="text-[10px] font-semibold tracking-[1.4px] uppercase">
          AI SUMMARY
        </h3>
      </div>
      {loading ? (
        <div
          className="grid max-w-[880px] gap-3 pt-7"
          aria-label="Writing the summary"
        >
          <div className={skeleton} />
          <div className={skeleton} />
          <div className={`${skeleton} w-3/5`} />
        </div>
      ) : (
        <div className="relative mt-6 grid grid-cols-[32px_1fr] gap-3 max-[560px]:grid-cols-1">
          <Quote
            className="mt-1 text-violet-300/60"
            size={24}
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <div>
            <p
              className="m-0 max-w-[900px] font-serif text-[clamp(20px,2.3vw,31px)] leading-[1.38] tracking-[-.45px] text-foreground"
              data-testid="summary-text"
            >
              {summary ||
                error ||
                "Explore the observations below while we prepare your summary."}
            </p>
            {note && !error && (
              <p className="mt-4 text-[11px] text-slate-400">{note}</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
