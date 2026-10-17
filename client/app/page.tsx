import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Droplets, Sun, Waves } from "lucide-react";
import Topography from "@/components/topography";

export default function Home() {
  return (
    <main
      id="main-content"
      className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-[#f6f7f4] text-[#123d36]"
    >
      <section className="relative z-[1] -mt-[94px] overflow-hidden rounded-b-[clamp(34px,5vw,72px)] bg-[#023e34] pt-[94px] text-[#f6f6f6] shadow-[0_18px_42px_rgba(0,40,33,.1)] max-[760px]:-mt-[77px] max-[760px]:rounded-b-[30px] max-[760px]:pt-[77px]">
        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(90deg,rgba(2,62,52,.64)_0%,rgba(2,62,52,.42)_48%,rgba(2,62,52,.3)_100%)]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0 z-[2] opacity-48 mix-blend-screen [mask-image:linear-gradient(to_bottom,black_0%,black_85%,transparent_100%)]"
          aria-hidden="true"
        >
          <Topography
            color="#699684"
            lineCount={22}
            lineWidth={1.1}
            majorLines
            elevation={0.9}
            foreground={0.12}
            scale={1.2}
            detail={0.35}
            tilt={34}
            speed={0.12}
            direction="forward"
            morph={0.12}
            glow={0.45}
            depthOfField={0.35}
            fog={0.42}
            brightness={0.76}
            opacity={0.88}
            mouseInteraction
            hoverEffect="lift"
            clickEffect="pulse"
            intro
            dpr={1.25}
            style={{ width: "100%", height: "100%" }}
          />
        </div>
        <div
          className="pointer-events-none absolute inset-0 z-[3] bg-[linear-gradient(90deg,rgba(2,62,52,.66)_0%,rgba(2,62,52,.58)_36%,rgba(2,62,52,.42)_54%,rgba(2,62,52,.24)_70%,transparent_88%)] max-[760px]:bg-[radial-gradient(ellipse_100%_48%_at_50%_27%,rgba(2,62,52,.68)_0%,rgba(2,62,52,.56)_48%,rgba(2,62,52,.32)_76%,transparent_100%)]"
          aria-hidden="true"
        />
        <div className="relative z-10 mx-auto grid min-h-[calc(100vh-250px)] max-w-[1536px] grid-cols-[1.25fr_.75fr] items-center gap-[8%] px-[6.3%] py-[70px] max-[1050px]:px-[5%] max-[760px]:min-h-auto max-[760px]:grid-cols-1 max-[760px]:px-[6%] max-[760px]:py-[52px] max-[760px]:pb-[72px]">
          <div className="max-w-[760px]">
            <h1 className="m-0 font-serif text-[clamp(48px,5.1vw,73px)] font-normal leading-[1.06] tracking-[-3px] max-[760px]:text-[52px] max-[760px]:tracking-[-2px] [&_em]:font-normal [&_em]:text-ring">
              Know the place.
              <br />
              Feel more <em>at home.</em>
            </h1>
            <p className="mt-[21px] max-w-[610px] text-base leading-[1.8] text-muted-foreground max-[760px]:text-[13px]">
              A clearer picture of flooding, heat, and ground movement. Observed
              from space. Made for the place you live.
            </p>
            <Link
              className="mt-[30px] inline-flex items-center gap-[18px] rounded-md bg-primary px-5 py-[15px] text-xs !text-[var(--primary-foreground)] transition hover:-translate-y-0.5 hover:bg-[color-mix(in_srgb,var(--primary),black_12%)]"
              href="/search"
            >
              Explore an address <ArrowUpRight size={17} />
            </Link>
          </div>
          <div
            className="relative m-auto aspect-square w-[min(470px,37vw)] max-[760px]:mt-10 max-[760px]:w-[min(350px,88vw)]"
            aria-label="Illustration of a satellite observing Earth, with a close-up observation lens for flood and heat data"
            role="img"
          >
            <div className="absolute inset-[11%] rounded-full bg-[#0b6557]/45 blur-[42px]" />

            <div className="absolute inset-[3%] overflow-hidden rounded-full shadow-[0_28px_65px_rgba(0,0,0,.38),0_0_0_1px_rgba(255,255,255,.12)]">
              <Image
                src="/earth.png"
                alt=""
                fill
                priority
                sizes="(max-width: 760px) 310px, 470px"
                className="object-cover"
              />
              <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_58%_42%,transparent_45%,rgba(0,18,35,.48)_78%,rgba(0,8,20,.75)_100%)]" />
            </div>

            <div className="absolute inset-[-8%] -rotate-[18deg] rounded-[50%] border border-primary/35" />
            <div className="absolute inset-[-1%] rotate-[28deg] rounded-[50%] border border-white/20" />

            <div className="absolute inset-[-16%] animate-[spin_20s_linear_infinite] motion-reduce:animate-none">
              <div className="absolute left-1/2 top-[-3%] w-[18%] -translate-x-1/2 rotate-[14deg] drop-shadow-[0_12px_16px_rgba(0,0,0,.55)]">
                <Image
                  src="/satellite.png"
                  alt=""
                  width={750}
                  height={600}
                  sizes="90px"
                  className="h-auto w-full"
                />
              </div>
            </div>

            <svg
              className="pointer-events-none absolute inset-0 z-10 overflow-visible"
              viewBox="0 0 100 100"
              aria-hidden="true"
            >
              <path
                d="M 35 36 C 52 40, 65 64, 84 80"
                fill="none"
                stroke="rgba(201,242,34,.76)"
                strokeWidth=".42"
                strokeDasharray="1.4 1.4"
              />
            </svg>
            <span className="absolute left-[34%] top-[34.5%] z-20 size-3 rounded-full border-2 border-[#023e34] bg-primary shadow-[0_0_0_6px_rgba(201,242,34,.24)]" />

            <div className="absolute -bottom-[2%] -right-[9%] z-20 size-[32%] min-h-[118px] min-w-[118px] overflow-hidden rounded-full border-2 border-primary bg-[#062f2a] shadow-[0_20px_36px_rgba(0,0,0,.38),0_0_0_7px_rgba(201,242,34,.1)] max-[760px]:right-0">
              <Image
                src="/hazard-zoom-neighborhood.png"
                alt=""
                fill
                sizes="150px"
                className="object-cover"
              />
              <span className="absolute inset-[10%] rounded-full border border-white/45" />
            </div>
          </div>
        </div>
      </section>
      <section
        className="mx-auto mb-[60px] grid max-w-[1344px] grid-cols-3 border-y border-[#123d36]/20 max-[760px]:grid-cols-1 [&_article]:border-r [&_article]:border-[#123d36]/20 [&_article]:px-8 [&_article]:py-14 [&_article]:pb-14 max-[760px]:[&_article]:border-r-0 max-[760px]:[&_article]:border-b max-[760px]:[&_article]:px-[6%] max-[760px]:[&_article]:py-9 [&_article:last-child]:border-r-0 max-[760px]:[&_article:last-child]:border-b-0 [&_article>svg]:mb-7 [&_article>svg]:size-[26px] [&_article>p:last-child]:text-xs [&_article>p:last-child]:leading-[1.8] [&_article>p:last-child]:text-[#64746f]"
        aria-label="What the report covers"
      >
        <article>
          <Droplets className="text-chart-1" />
          <p className="m-0 text-[9px] font-semibold tracking-[1.6px] text-muted-foreground">
            FLOOD HISTORY
          </p>
          <h2 className="my-3 font-serif text-2xl font-normal tracking-[-.9px]">
            Water observed over time.
          </h2>
          <p>
            See whether radar satellites observed water at the exact spot—and
            when the data could not tell.
          </p>
        </article>
        <article>
          <Sun className="text-chart-2" />
          <p className="m-0 text-[9px] font-semibold tracking-[1.6px] text-muted-foreground">
            SURFACE HEAT
          </p>
          <h2 className="my-3 font-serif text-2xl font-normal tracking-[-.9px]">
            A midday view of heat.
          </h2>
          <p>
            Compare ground and roof surface temperature with the rest of King
            County.
          </p>
        </article>
        <article>
          <Waves className="text-chart-3" />
          <p className="m-0 text-[9px] font-semibold tracking-[1.6px] text-muted-foreground">
            GROUND MOVEMENT
          </p>
          <h2 className="my-3 font-serif text-2xl font-normal tracking-[-.9px]">
            Slow change, measured carefully.
          </h2>
          <p>
            Review satellite observations with their direction, resolution, and
            limitations attached.
          </p>
        </article>
      </section>
    </main>
  );
}
