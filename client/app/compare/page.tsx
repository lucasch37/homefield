import { ReportCompare } from "@/components/report-compare";
import { Suspense } from "react";

export default function ComparePage() {
  return (
    <main
      id="main-content"
      className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen min-h-[calc(100vh-190px)] bg-background text-foreground"
    >
      <section className="rounded-b-[clamp(34px,5vw,72px)] border-b border-violet-300/15 bg-[#120b1f] px-[6.3%] text-[#eef1ff] max-[1050px]:px-[5%] max-[760px]:rounded-b-[30px] max-[760px]:px-[6%]">
        <div className="mx-auto max-w-[1240px] py-16 max-[760px]:py-12">
          <h1 className="font-serif text-[clamp(48px,5.1vw,73px)] font-normal leading-[1.06] tracking-[-3px]">
            Compare <span className="italic text-violet-300">places.</span>
          </h1>
          <p className="mt-6 max-w-[650px] text-sm leading-7 text-white/70">
            The same satellite observations, side by side.
          </p>
        </div>
      </section>

      <section className="hfd-space w-full px-[6.3%] py-14 pb-20 max-[1050px]:px-[5%] max-[760px]:px-[6%]">
        <div className="mx-auto max-w-[1240px]">
          <Suspense fallback={null}>
            <ReportCompare />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
