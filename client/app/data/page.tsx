import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Data — Homefield",
  description:
    "The NASA-backed satellite observations behind Homefield: Sentinel-1 radar flood maps, Landsat summer heat, and OPERA ground motion.",
};

type Figure = { src: string; width: number; height: number; alt: string };

const STATS = [
  { value: "1,158", label: "radar flood maps" },
  { value: "45", label: "clear Landsat summers" },
  { value: "9", label: "years of ground motion" },
  { value: "30 m", label: "detail" },
];

const SECTIONS: { title: string; text: string; source: string; figures: Figure[] }[] = [
  {
    title: "Flood",
    text: "Sentinel-1 radar sees through storm clouds. NASA JPL's OPERA project turns each pass into a water map; we processed all 1,158 passes over King County since September 2024 and recorded, for every 30 m square, how often it was underwater and when.",
    source: "NASA JPL OPERA DSWx-S1",
    figures: [
      {
        src: "/data-figures/flood_snoqualmie_dec2025_dark.png",
        width: 1799,
        height: 1278,
        alt: "Side-by-side radar water maps of the Snoqualmie Valley before and during the December 2025 flood, showing the river spreading across farmland near Duvall and Carnation",
      },
    ],
  },
  {
    title: "Heat",
    text: "45 clear summer days of Landsat thermal data since 2013. Each day, every spot is compared to the rest of lowland King County, so the weather cancels out and 13 summers become comparable.",
    source: "Landsat 8/9 Collection 2 surface temperature (NASA/USGS)",
    figures: [
      {
        src: "/data-figures/heat_map_seattle.png",
        width: 1270,
        height: 1432,
        alt: "Map of Seattle and the Eastside colored by summer surface heat relative to lowland King County, with SODO and Bellevue running hot and Discovery Park and parks running cool",
      },
      {
        src: "/data-figures/heat_trends.png",
        width: 1455,
        height: 743,
        alt: "Line chart of summer surface heat from 2013 to 2025, with SODO staying about 15 to 20 degrees Fahrenheit hotter than lowland King County while Discovery Park cools by about 10 degrees",
      },
    ],
  },
  {
    title: "Ground motion",
    text: "Radar interferometry measures millimeters of movement. We chained 8 of NASA's 119 files, about 51 GB, into one record from 2016 to 2025. UW's east campus has moved about 14 cm, consistent with sinking.",
    source: "NASA JPL OPERA DISP-S1",
    figures: [
      {
        src: "/data-figures/ground_motion_seattle.png",
        width: 1270,
        height: 1432,
        alt: "Map of ground velocity across Seattle and the Eastside from 2016 to 2025, mostly stable with a red hotspot of movement away from the satellite at the UW east campus",
      },
      {
        src: "/data-figures/ground_motion_uw.png",
        width: 1299,
        height: 743,
        alt: "Chart of ground movement at the UW east campus falling steadily from 0 in July 2016 to about minus 145 millimeters in 2025",
      },
    ],
  },
];

export default function DataPage() {
  return (
    <main
      id="main-content"
      className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen min-h-[calc(100vh-190px)] bg-[#05030A] text-[#EDE7FA]"
    >
      <section className="px-[6.3%] max-[1050px]:px-[5%] max-[760px]:px-[6%]">
        <div className="mx-auto max-w-[1240px] pt-16 pb-10 max-[760px]:pt-12">
          <h1 className="font-serif text-[clamp(44px,5.1vw,73px)] font-normal leading-[1.06] tracking-[-3px]">
            What the satellites <span className="italic text-[#C4B5FD]">saw</span>
          </h1>
          <p className="mt-6 max-w-[650px] text-[15px] leading-7 text-[#B8A9D9]">
            Every number in HomeField comes from NASA-backed satellite observations, processed ahead
            of time so a report loads in about a second.
          </p>

          <ul className="mt-10 grid grid-cols-4 gap-4 max-[760px]:grid-cols-2 max-[760px]:gap-3">
            {STATS.map((stat) => (
              <li
                key={stat.label}
                className="rounded-2xl border border-[#1F1632] bg-[#0B0614] px-5 py-5 max-[760px]:px-4"
              >
                <p className="text-[clamp(26px,2.6vw,36px)] font-semibold leading-none text-[#C4B5FD]">
                  {stat.value}
                </p>
                <p className="mt-2 text-[13px] leading-5 text-[#B8A9D9]">{stat.label}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="px-[6.3%] pb-20 max-[1050px]:px-[5%] max-[760px]:px-[6%]">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-6">
          {SECTIONS.map((section) => (
            <article
              key={section.title}
              className="grid grid-cols-[minmax(0,320px)_minmax(0,1fr)] gap-8 rounded-3xl border border-[#1F1632] bg-[#0B0614] p-8 max-[1050px]:grid-cols-1 max-[1050px]:gap-6 max-[760px]:p-5"
            >
              <div>
                <h2 className="text-2xl font-semibold text-[#EDE7FA]">{section.title}</h2>
                <p className="mt-4 text-[15px] leading-7 text-[#B8A9D9]">{section.text}</p>
                <p className="mt-5 text-[13px] leading-5 text-[#C4B5FD]">Source: {section.source}</p>
              </div>
              <div
                className={`grid items-start gap-4 ${section.figures.length > 1 ? "grid-cols-2 max-[760px]:grid-cols-1" : "grid-cols-1"}`}
              >
                {section.figures.map((figure) => (
                  <Image
                    key={figure.src}
                    src={figure.src}
                    width={figure.width}
                    height={figure.height}
                    alt={figure.alt}
                    loading="lazy"
                    sizes={
                      section.figures.length > 1
                        ? "(max-width: 760px) 88vw, (max-width: 1050px) 45vw, 440px"
                        : "(max-width: 1050px) 90vw, 880px"
                    }
                    className="h-auto w-full rounded-xl border border-[#1F1632]"
                  />
                ))}
              </div>
            </article>
          ))}

          <p className="mt-4 text-xs leading-5 text-[#B8A9D9]">
            Contains modified Copernicus Sentinel data processed by ESA, analyzed by NASA JPL/Caltech&apos;s
            OPERA project. Landsat courtesy of USGS and NASA.
          </p>
        </div>
      </section>
    </main>
  );
}
