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
  const skeleton = "h-2.5 w-full animate-pulse rounded bg-white/15";
  return (
    <section
      className="relative overflow-hidden rounded-[18px] bg-[#063d34] px-[clamp(22px,4vw,48px)] py-[clamp(24px,4vw,43px)] text-white shadow-[0_22px_55px_-32px_#002f28] before:absolute before:inset-y-0 before:left-0 before:w-[6px] border-4 border-[#c9f222]"
      aria-busy={loading}
      aria-live="polite"
      aria-label="Summary"
    >
      <div
        className="absolute -top-8 -right-6 size-40 rounded-full bg-[#c9f222]/10 blur-2xl"
        aria-hidden="true"
      />
      <div className="relative flex items-center gap-2.5 text-[#c9f222]">
        <span className="grid size-8 place-items-center rounded-full bg-[#c9f222]/12">
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
            className="mt-1 text-[#c9f222]/65"
            size={24}
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <div>
            <p
              className="m-0 max-w-[900px] font-serif text-[clamp(19px,2.1vw,28px)] leading-[1.42] tracking-[-.45px] text-white"
              data-testid="summary-text"
            >
              {summary ||
                error ||
                "Explore the observations below while we prepare your summary."}
            </p>
            {note && !error && (
              <p className="mt-4 text-[11px] text-white/60">{note}</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
