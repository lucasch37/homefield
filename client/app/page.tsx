import Link from "next/link";
import { ArrowUpRight, Droplets, Satellite, Sun, Waves, type LucideIcon } from "lucide-react";
import EarthHero from "@/components/space/earth-hero";
import SpaceBackground from "@/components/space/space-background";

const HAZARDS: { icon: LucideIcon; color: string; label: string; title: string; body: string; source: string }[] = [
  {
    icon: Droplets,
    color: "text-chart-1",
    label: "FLOOD HISTORY",
    title: "Water observed over time.",
    body: "Whether radar satellites saw water at the exact spot, and when the data could not tell.",
    source: "NASA JPL OPERA DSWx-S1 · radar passes since Sep 2024 · 30 m",
  },
  {
    icon: Sun,
    color: "text-chart-2",
    label: "SURFACE HEAT",
    title: "A midday view of heat.",
    body: "Ground and roof surface temperature compared with the rest of King County.",
    source: "Landsat 8/9 · clear summer days 2013–2025 · 30 m",
  },
  {
    icon: Waves,
    color: "text-chart-3",
    label: "GROUND MOVEMENT",
    title: "Slow change, measured carefully.",
    body: "Millimeter-scale movement with its direction, resolution, and limitations attached.",
    source: "NASA JPL OPERA DISP-S1 · 2016–2025 · 30 m",
  },
];

function HazardPanel({ hazard, compact = false }: { hazard: (typeof HAZARDS)[number]; compact?: boolean }) {
  const Icon = hazard.icon;
  return (
    <article
      className={`rounded-2xl border border-white/10 bg-[#070b1d]/55 shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_20px_40px_-20px_rgba(0,0,0,.8)] backdrop-blur-md ${compact ? "p-4" : "p-5"}`}
    >
      <div className="mb-2.5 flex items-center gap-2.5">
        <Icon className={`size-[18px] ${hazard.color}`} />
        <p className="m-0 text-[9px] font-semibold tracking-[1.6px] text-slate-400">{hazard.label}</p>
      </div>
      <h2 className={`m-0 font-serif font-normal tracking-[-.6px] ${compact ? "text-lg" : "text-xl"}`}>{hazard.title}</h2>
      {!compact && <p className="mt-2 text-xs leading-[1.7] text-slate-400">{hazard.body}</p>}
      <p className="mt-3 border-t border-white/10 pt-3 font-mono text-[10px] leading-[1.6] text-sky-200/70">
        {hazard.source}
      </p>
    </article>
  );
}

export default function Home() {
  return (
    <main id="main-content" className="relative text-[#eef3ff]">
      <SpaceBackground />

      <section className="relative flex flex-col items-center min-[1200px]:block min-[1200px]:h-[max(calc(100svh-94px),720px)]">
        <div className="relative z-10 pt-6 text-center min-[1200px]:pt-[2vh]">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-sky-300/25 bg-sky-300/5 px-3 py-1.5 text-[10px] font-semibold tracking-[1.8px] text-sky-200/90 backdrop-blur-sm">
            <Satellite size={13} /> OBSERVED FROM ORBIT
          </p>
          <h1 className="m-0 font-serif text-[clamp(42px,4.6vw,70px)] font-normal leading-[1.06] tracking-[-2.5px] max-[760px]:text-[44px] max-[760px]:tracking-[-1.5px]">
            Know the place.{" "}
            <br className="min-[1200px]:hidden" />
            Feel more{" "}
            <em className="bg-gradient-to-r from-sky-300 via-indigo-300 to-violet-300 bg-clip-text font-normal text-transparent">
              at home.
            </em>
          </h1>
        </div>

        <div className="relative z-10 mt-5 max-w-[520px] text-center min-[1200px]:absolute min-[1200px]:left-0 min-[1200px]:top-[57%] min-[1200px]:mt-0 min-[1200px]:w-[min(300px,19vw)] min-[1200px]:-translate-y-1/2 min-[1200px]:text-left">
          <p className="m-0 text-[15px] leading-[1.8] text-slate-300/85 max-[760px]:text-[13px]">
            A clearer picture of flooding, heat, and ground movement. Observed
            from space. Made for the place you live.
          </p>
          <Link
            className="mt-6 inline-flex items-center gap-[18px] rounded-md bg-gradient-to-r from-sky-400 to-indigo-400 px-5 py-[15px] text-xs font-semibold !text-[#050816] shadow-[0_0_32px_rgba(96,165,250,.35)] transition hover:-translate-y-0.5 hover:shadow-[0_0_44px_rgba(129,140,248,.55)]"
            href="/search"
          >
            Explore an address <ArrowUpRight size={17} />
          </Link>
        </div>

        <EarthHero className="pointer-events-none relative h-[min(112vw,680px)] w-screen shrink-0 min-[1200px]:absolute min-[1200px]:inset-y-0 min-[1200px]:left-1/2 min-[1200px]:h-auto min-[1200px]:-translate-x-1/2" />

        <div className="relative z-10 hidden w-[min(290px,19vw)] flex-col gap-3 min-[1200px]:absolute min-[1200px]:right-0 min-[1200px]:top-[57%] min-[1200px]:flex min-[1200px]:-translate-y-1/2">
          {HAZARDS.map((hazard) => (
            <HazardPanel key={hazard.label} hazard={hazard} compact />
          ))}
        </div>
      </section>

      <section
        className="mb-[60px] grid grid-cols-3 gap-5 max-[900px]:grid-cols-1 min-[1200px]:hidden"
        aria-label="What the report covers"
      >
        {HAZARDS.map((hazard) => (
          <HazardPanel key={hazard.label} hazard={hazard} />
        ))}
      </section>
    </main>
  );
}
