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
  const skeleton = "h-2.5 w-full animate-pulse rounded bg-muted";
  return (
    <section
      className="relative mb-[15px] overflow-hidden rounded-[18px] border border-[#2f6b61] bg-[#063d34] px-[clamp(22px,4vw,48px)] py-[clamp(24px,4vw,43px)] text-white shadow-[0_22px_55px_-32px_#002f28] before:absolute before:inset-y-0 before:left-0 before:w-[6px] before:bg-[#c9f222]"
      aria-busy={loading}
      aria-live="polite"
    >
      <div className="absolute -top-8 -right-6 size-40 rounded-full bg-[#c9f222]/10 blur-2xl" aria-hidden="true" />
      <div className="relative flex items-center gap-2.5 text-[#c9f222]">
        <span className="grid size-8 place-items-center rounded-full bg-[#c9f222]/12">
          <Sparkles size={16} />
        </span>
        <h3 className="text-[10px] font-semibold tracking-[1.4px] uppercase">
          Your home, in perspective
        </h3>
        <span className="ml-auto rounded-full border border-white/15 px-2.5 py-1 text-[8px] tracking-[1.2px] text-white/65">GROK SUMMARY</span>
      </div>
      {loading ? (
        <div className="grid max-w-[880px] gap-3 pt-7">
          <div className={skeleton} />
          <div className={skeleton} />
          <div className={`${skeleton} w-3/5`} />
        </div>
      ) : (
        <div className="relative mt-6 grid grid-cols-[32px_1fr] gap-3 max-[560px]:grid-cols-1">
          <Quote className="mt-1 text-[#c9f222]/65" size={24} strokeWidth={1.5} aria-hidden="true" />
          <p className="m-0 max-w-[900px] font-serif text-[clamp(20px,2.3vw,31px)] leading-[1.38] tracking-[-.45px] text-white">
            {summary ||
              error ||
              "Explore the observations below while we prepare your summary."}
          </p>
        </div>
      )}
    </section>
  );
}
