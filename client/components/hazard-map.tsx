"use client";
if (typeof window !== "undefined") {
  (window as Window & { __hazardMap?: boolean }).__hazardMap = true;
}
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowUpRight, LocateFixed, MapPin, Satellite } from "lucide-react";
import type { Map as MapLibreMap, Marker as MapLibreMarker } from "maplibre-gl";
import { finding } from "@/lib/hazards";
import { formatCoordinate, placeLabel } from "@/lib/format";
import { affiliateParams, zillowUrl } from "@/lib/listing-links";
import type { Report } from "@/lib/types";

const COUNTY_CENTER: [number, number] = [-121.95, 47.48];
const COUNTY_ZOOM = 8.3;
// About 3,200 km across, matching the last frame of the homepage dive.
const INTRO_ZOOM = 3.7;
const INTRO_SECONDS = 2.6;
const INTRO_TILE_WAIT_MS = 800;
const HERO_MARKER_OFFSET: [number, number] = [0, 250];
const ESRI_ATTRIBUTION =
  'Imagery © <a href="https://www.esri.com/" target="_blank" rel="noreferrer">Esri</a>, Maxar, Earthstar Geographics, and the GIS User Community';

// Inlined at build time; set these to your affiliate query strings (see lib/listing-links.ts).
const ZILLOW_PARAMS = affiliateParams(process.env.NEXT_PUBLIC_ZILLOW_AFFILIATE_PARAMS);

const GLASS =
  "border border-violet-300/15 bg-[#0b0614]/80 text-[#eef1ff] shadow-[0_8px_24px_-12px_rgba(0,0,0,.8)] backdrop-blur-md";

function collapseAttribution(map: MapLibreMap) {
  const attribution = map
    .getContainer()
    .querySelector<HTMLDetailsElement>(".maplibregl-ctrl-attrib");
  if (!attribution) return;
  attribution.classList.remove("maplibregl-compact-show");
  attribution.open = false;
}

export function HazardMap({
  report,
  loading,
  label,
  variant = "card",
  intro = false,
  replayIntro = 0,
  resetView = 0,
  chromeIn = true,
  onIntroReady,
  onIntroDone,
}: {
  report: Report | null;
  loading: boolean;
  label?: string;
  variant?: "hero" | "card";
  intro?: boolean;
  replayIntro?: number;
  resetView?: number;
  chromeIn?: boolean;
  /** The intro view has drawn and the flight is starting. */
  onIntroReady?: () => void;
  /** The intro flight has finished. */
  onIntroDone?: () => void;
}) {
  const hero = variant === "hero";
  const introPending = useRef(intro);
  // Kept in a ref so new callbacks don't restart the flight.
  const introCallbacks = useRef({ onIntroReady, onIntroDone });
  useLayoutEffect(() => {
    introCallbacks.current = { onIntroReady, onIntroDone };
  });
  const handledReplay = useRef(replayIntro);
  // A layout effect, so a replay requested on arrival is pending before the map is created.
  useLayoutEffect(() => {
    if (replayIntro === handledReplay.current) return;
    handledReplay.current = replayIntro;
    introPending.current = true;
  }, [replayIntro]);
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const marker = useRef<MapLibreMarker | null>(null);
  const [error, setError] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let disposed = false;
    const mark = (message: string) => {
      const target = window as Window & { __mapDebug?: string };
      target.__mapDebug = `${target.__mapDebug || ""} | ${message}`;
    };
    mark("effect");
    import("maplibre-gl")
      .then((maplibre) => {
        mark(
          `then disposed=${disposed} container=${Boolean(container.current)} map=${typeof maplibre.Map}`,
        );
        if (disposed || !container.current) return;
        try {
          maplibre.setWorkerUrl("/maplibre-worker.mjs");
          const instance = new maplibre.Map({
            container: container.current,
            style: {
              version: 8,

              sources: {
                satellite: {
                  type: "raster",
                  tiles: [
                    "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
                  ],
                  tileSize: 256,
                  attribution: ESRI_ATTRIBUTION,
                },

                labels: {
                  type: "raster",
                  tiles: [
                    "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
                  ],
                  tileSize: 256,
                },
              },

              layers: [
                {
                  id: "satellite",
                  type: "raster",
                  source: "satellite",
                  paint: {
                    "raster-saturation": -0.15,
                    "raster-contrast": 0.1,
                    "raster-brightness-max": 0.85,
                  },
                },
                {
                  id: "location-labels",
                  type: "raster",
                  source: "labels",
                  paint: {
                    "raster-opacity": 0.9,
                  },
                },
              ],
              ...(introPending.current && { projection: { type: "globe" } }),
            },

            center: COUNTY_CENTER,
            zoom: introPending.current ? INTRO_ZOOM : COUNTY_ZOOM,
            attributionControl: { compact: true },
          });
          map.current = instance;
          instance.addControl(
            new maplibre.NavigationControl({ showCompass: false }),
            "top-right",
          );
          instance.on("load", () => {
            if (!disposed) {
              collapseAttribution(instance);
              instance.addSource("hazard-overlay", {
                type: "geojson",
                data: { type: "FeatureCollection", features: [] },
              });
              instance.addLayer({
                id: "hazard-overlay-heat-glow",
                type: "circle",
                source: "hazard-overlay",
                paint: {
                  "circle-color": [
                    "interpolate",
                    ["linear"],
                    ["get", "surface_temp_f"],
                    75,
                    "#ffd166",
                    95,
                    "#ff6b35",
                    105,
                    "#ed2f87",
                  ],
                  "circle-radius": 38,
                  "circle-opacity": 0.3,
                  "circle-blur": 0.85,
                },
              });
              instance.addLayer({
                id: "hazard-overlay-heat",
                type: "circle",
                source: "hazard-overlay",
                paint: {
                  "circle-color": [
                    "interpolate",
                    ["linear"],
                    ["get", "surface_temp_f"],
                    75,
                    "#dfe9e3",
                    95,
                    "#f151bb",
                    105,
                    "#ed2f87",
                  ],
                  "circle-radius": 16,
                  "circle-opacity": 0.94,
                  "circle-stroke-color": "#fff8ef",
                  "circle-stroke-width": 3,
                },
              });
              // The map is initialized inside a responsive grid. MapLibre can
              // measure the absolute container before the grid has finished
              // laying it out, leaving its canvas at the default 300px height.
              // Resize once the style is ready so the basemap fills the panel.
              instance.resize();
              setReady(true);
              setError(false);
            }
          });
          instance.on("error", () => {
            if (!disposed && !instance.isStyleLoaded()) setError(true);
          });
          const resizeObserver = new ResizeObserver(() => instance.resize());
          resizeObserver.observe(container.current);
          instance.once("remove", () => resizeObserver.disconnect());
        } catch (err) {
          mark(`ctor ${err instanceof Error ? err.stack : String(err)}`);
          setError(true);
        }
      })
      .catch((err: unknown) => {
        mark(`catch ${err instanceof Error ? err.stack : String(err)}`);
        if (!disposed) setError(true);
      });
    return () => {
      disposed = true;
      mark("cleanup");
      marker.current?.remove();
      map.current?.remove();
      map.current = null;
      // cacheComponents hides this page instead of unmounting it, and the map is rebuilt when
      // the page is shown again, so everything keyed on `ready` must wait for the new map.
      setReady(false);
    };
  }, []);
  useEffect(() => {
    const instance = map.current;
    if (!ready || !instance) return;
    let active = true;
    let cancelWait: (() => void) | null = null;
    const introFlight = introPending.current;
    introPending.current = false;
    const flyTo = (center: [number, number], zoom: number) => {
      const fly = () =>
        instance.flyTo({
          center,
          zoom,
          essential: true,
          ...(hero && { offset: HERO_MARKER_OFFSET }),
          ...(introFlight && { duration: INTRO_SECONDS * 1000, curve: 1.2 }),
        });
      if (!introFlight) {
        fly();
        return;
      }
      instance.setProjection({ type: "globe" });
      instance.jumpTo({ center: COUNTY_CENTER, zoom: INTRO_ZOOM });
      // Hold the intro view until its first tiles draw (capped), so the arrival veil lifts onto a real map.
      const start = () => {
        cancelWait?.();
        cancelWait = null;
        introCallbacks.current.onIntroReady?.();
        instance.once("moveend", () => introCallbacks.current.onIntroDone?.());
        fly();
      };
      if (instance.areTilesLoaded()) {
        start();
        return;
      }
      const timer = window.setTimeout(start, INTRO_TILE_WAIT_MS);
      instance.once("idle", start);
      cancelWait = () => {
        window.clearTimeout(timer);
        instance.off("idle", start);
      };
    };
    const cleanup = () => {
      active = false;
      if (!cancelWait) return;
      cancelWait();
      introCallbacks.current.onIntroReady?.();
      introCallbacks.current.onIntroDone?.();
    };
    marker.current?.remove();
    if (!report) {
      flyTo(COUNTY_CENTER, COUNTY_ZOOM);
      return cleanup;
    }
    import("maplibre-gl").then((maplibre) => {
      if (!active) return;
      const pin = document.createElement("div");
      pin.className =
        "size-[22px] rounded-full border-4 border-white bg-[var(--brand-accent)] shadow-[0_0_0_12px_color-mix(in_srgb,var(--brand-accent),transparent_82%),0_2px_10px_#0004]";
      pin.setAttribute("aria-label", placeLabel(report));
      pin.setAttribute("role", "img");
      marker.current = new maplibre.Marker({ element: pin })
        .setLngLat([report.lon, report.lat])
        .addTo(instance);
      flyTo([report.lon, report.lat], 14);
    });
    return cleanup;
  }, [hero, report, ready, replayIntro, resetView]);
  useEffect(() => {
    if (!ready || !map.current) return;
    const source = map.current.getSource("hazard-overlay") as
      | {
          setData: (data: {
            type: "FeatureCollection";
            features: unknown[];
          }) => void;
        }
      | undefined;
    if (!source) return;
    source.setData({
      type: "FeatureCollection",
      features: report
        ? [
            {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [report.lon, report.lat],
              },
              properties:
                report.hazards.heat.status === "ok" &&
                report.hazards.heat.surface_temp_f !== undefined
                  ? { surface_temp_f: report.hazards.heat.surface_temp_f }
                  : {},
            },
          ]
        : [],
    });
  }, [report, ready]);
  const heatFinding = report ? finding(report.hazards.heat, "heat") : null;
  const fadeIn = chromeIn
    ? "opacity-100 transition-opacity duration-500"
    : "pointer-events-none opacity-0";
  return (
    <section
      className={
        hero
          ? "relative h-svh min-h-[520px] overflow-hidden bg-[#030207] [&_.maplibregl-ctrl-top-right]:!top-auto [&_.maplibregl-ctrl-top-right]:!bottom-[150px] [&_.maplibregl-ctrl-top-right]:!right-[10px] max-[760px]:[&_.maplibregl-ctrl-top-right]:!bottom-[140px] [&_.maplibregl-ctrl-group]:!rounded-[8px] [&_.maplibregl-ctrl-group]:!border [&_.maplibregl-ctrl-group]:!border-violet-300/15 [&_.maplibregl-ctrl-group]:!bg-[#0b0614]/90 [&_.maplibregl-ctrl-group_button_span]:invert"
          : "relative h-[clamp(430px,55vw,640px)] overflow-hidden rounded-[16px] bg-[#05060f] shadow-[0_22px_55px_-38px_#000] max-[760px]:h-[370px] [&_.maplibregl-ctrl-top-right]:!top-[14px] [&_.maplibregl-ctrl-top-right]:!right-[10px] [&_.maplibregl-ctrl-group]:!rounded-[5px] [&_.maplibregl-ctrl-group]:!border [&_.maplibregl-ctrl-group]:!border-white/10 [&_.maplibregl-ctrl-group]:!shadow-[0_1px_8px_#0006]"
      }
      aria-label="Map of the selected address"
    >
      <div ref={container} className="absolute inset-0 h-full w-full" />
      <div
        className={`absolute left-[18px] flex flex-col items-start gap-2 ${hero ? "bottom-[112px] max-[760px]:bottom-[100px]" : "top-5"} ${fadeIn}`}
      >
        <div
          className={`flex items-center gap-[7px] rounded-md px-3 py-2.5 text-[8px] font-semibold tracking-[1.2px] ${GLASS}`}
        >
          <span className="size-[5px] rounded-full bg-primary" /> KING COUNTY,
          WASHINGTON
        </div>
        {report && (
          <div
            className={`max-w-[min(320px,calc(100vw-36px))] rounded-md px-3 py-2 text-[10px] leading-[1.5] ${GLASS}`}
            data-testid="map-reading"
          >
            <span className="font-semibold">Heat at this pin:</span>{" "}
            {heatFinding?.label}
            {heatFinding?.metric ? ` · ${heatFinding.metric}` : ""}
          </div>
        )}
      </div>
      {error && (
        <div
          className={`absolute inset-x-[18px] top-[42%] rounded-md p-[15px] text-center text-xs ${GLASS}`}
          role="status"
        >
          The map couldn’t load. You can still read the report.
        </div>
      )}
      <button
        className={`absolute right-[20px] grid size-[29px] place-items-center rounded-[8px] disabled:cursor-not-allowed ${hero ? "bottom-[112px] max-[760px]:bottom-[100px]" : "top-[99px]"} ${GLASS} ${fadeIn}`}
        type="button"
        aria-label="Recenter map"
        disabled={!ready}
        onClick={() =>
          map.current?.flyTo({
            center: report ? [report.lon, report.lat] : COUNTY_CENTER,
            zoom: report ? 14 : COUNTY_ZOOM,
            essential: true,
            ...(hero && { offset: HERO_MARKER_OFFSET }),
          })
        }
      >
        <LocateFixed size={16} />
      </button>
      <div
        className={`hfm-addressCard pointer-events-none absolute right-[19px] bottom-[20px] left-[19px] flex items-center gap-[13px] rounded-xl px-[17px] py-[19px] max-[760px]:right-[13px] max-[760px]:bottom-[max(12px,env(safe-area-inset-bottom))] max-[760px]:left-[13px] max-[760px]:p-3.5 ${GLASS} ${fadeIn}`}
      >
        <div className="grid size-[38px] shrink-0 place-items-center">
          {report ? (
            <MapPin size={32} strokeWidth={1} />
          ) : (
            <Satellite size={32} strokeWidth={1} />
          )}
        </div>
        <div>
          <strong className="block text-xs leading-[1.5] font-medium max-[760px]:text-[11px]">
            {loading
              ? "Finding your place…"
              : report
                ? label || report.address || "Selected point"
                : "A closer look at the place you call home."}
          </strong>
          <div className="mt-[5px] flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <p className="m-0 text-[10px] leading-[1.5] text-[#9aa3c7] max-[760px]:text-[9px]">
              {report
                ? `${formatCoordinate(report.lat)}° N · ${formatCoordinate(Math.abs(report.lon))}° W`
                : "Start with an address. See what satellites observed."}
            </p>
            {report?.address && !loading && (
              <span className="pointer-events-auto flex items-center gap-1.5" data-testid="listing-links">
                <a
                  href={zillowUrl(report.address, ZILLOW_PARAMS)}
                  target="_blank"
                  rel="sponsored noopener"
                  title="See this home on Zillow (partner link; Homefield may earn a commission)"
                  className="inline-flex items-center gap-1 rounded-full border border-violet-300/25 bg-white/5 px-2.5 py-1 text-[10px] font-medium text-[#eef1ff] transition-colors hover:border-primary hover:bg-primary hover:text-[var(--primary-foreground)]"
                >
                  Zillow
                  <ArrowUpRight size={11} />
                </a>
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
