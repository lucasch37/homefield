import { DiveProvider } from "@/components/space/dive-context";
import EarthHero from "@/components/space/earth-hero";
import { ExploreButton } from "@/components/space/explore-button";
import SpaceBackground from "@/components/space/space-background";
import { ArrowUpRight } from "lucide-react";

const FADE =
  "transition-opacity duration-500 group-data-[diving=true]/dive:pointer-events-none group-data-[diving=true]/dive:opacity-0";

export default function Home() {
  return (
    <main id="main-content" className="relative text-[#eef1ff]">
      <DiveProvider>
        <div className="group-data-[landed=true]/dive:hidden">
          <SpaceBackground />
        </div>

        <section className="relative flex flex-col items-center min-[1200px]:block min-[1200px]:h-[max(calc(100svh-94px),720px)]">
          <div
            className={`relative z-10 pt-6 text-center min-[1200px]:pt-[2vh] ${FADE}`}
          >
            <h1 className="mt-5 font-serif text-[clamp(42px,4.6vw,70px)] font-normal leading-[1.06] tracking-[-2.5px] max-[760px]:text-[44px] max-[760px]:tracking-[-1.5px]">
              Know the place. <br className="min-[1200px]:hidden" />
              Feel more{" "}
              <em className="text-violet-300 font-normal">at home.</em>
            </h1>
          </div>

          <div
            className={`relative z-10 mt-5 max-w-[520px] text-center min-[1200px]:absolute min-[1200px]:left-0 min-[1200px]:top-[57%] min-[1200px]:mt-0 min-[1200px]:w-[min(300px,19vw)] min-[1200px]:-translate-y-1/2 min-[1200px]:text-left ${FADE}`}
          >
            <p className="m-0 text-[15px] leading-[1.8] text-slate-300/85 max-[760px]:text-[13px]">
              A clearer picture of flooding, heat, and ground movement. Observed
              from space. Made for the place you live.
            </p>
            <ExploreButton className="mt-6 gap-[18px] px-5 py-[15px] text-xs font-semibold">
              Explore an address <ArrowUpRight size={17} />
            </ExploreButton>
          </div>

          <EarthHero className="pointer-events-none relative h-[min(112vw,680px)] w-screen shrink-0 min-[1200px]:absolute min-[1200px]:inset-y-0 min-[1200px]:left-1/2 min-[1200px]:h-auto min-[1200px]:-translate-x-1/2" />
        </section>
      </DiveProvider>
    </main>
  );
}
