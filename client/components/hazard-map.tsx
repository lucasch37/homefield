"use client";
if (typeof window !== "undefined") {
  (window as Window & { __hazardMap?: boolean }).__hazardMap = true;
}
import { useEffect, useRef, useState } from "react";
import { LocateFixed, MapPin, Satellite } from "lucide-react";
import type { Map as MapLibreMap, Marker as MapLibreMarker } from "maplibre-gl";
import type { Report } from "@/lib/types";

export function HazardMap({
  report,
  loading,
}: {
  report: Report | null;
  loading: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const marker = useRef<MapLibreMarker | null>(null);
  const [error, setError] = useState(false);
  const [ready, setReady] = useState(false);
  const [activeLayer, setActiveLayer] = useState<
    "flood" | "heat" | "ground_motion"
  >("heat");
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
            },

            center: [-121.95, 47.48],
            zoom: 8.3,
            attributionControl: { compact: true },
          });
          map.current = instance;
          instance.addControl(
            new maplibre.NavigationControl({ showCompass: false }),
            "top-right",
          );
          instance.on("load", () => {
            if (!disposed) {
              instance.addSource("hazard-overlay", {
                type: "geojson",
                data: { type: "FeatureCollection", features: [] },
              });
              instance.addLayer({
                id: "hazard-overlay-flood-glow",
                type: "circle",
                source: "hazard-overlay",
                layout: { visibility: "none" },
                paint: {
                  "circle-color": "#35d0c0",
                  "circle-radius": 34,
                  "circle-opacity": 0.22,
                  "circle-blur": 0.9,
                },
              });
              instance.addLayer({
                id: "hazard-overlay-flood",
                type: "circle",
                source: "hazard-overlay",
                layout: { visibility: "none" },
                paint: {
                  "circle-color": [
                    "match",
                    ["get", "status"],
                    "flooded",
                    "#ff4f9a",
                    "permanent_water",
                    "#27c7b7",
                    "#d7e8df",
                  ],
                  "circle-radius": 15,
                  "circle-opacity": 0.92,
                  "circle-stroke-color": "#fff7fb",
                  "circle-stroke-width": 3,
                },
              });
              instance.addLayer({
                id: "hazard-overlay-flood-ring",
                type: "circle",
                source: "hazard-overlay",
                layout: { visibility: "none" },
                paint: {
                  "circle-color": "transparent",
                  "circle-radius": 24,
                  "circle-opacity": 0,
                  "circle-stroke-color": "#ff7fb4",
                  "circle-stroke-width": 2,
                  "circle-stroke-opacity": 0.7,
                },
              });
              instance.addLayer({
                id: "hazard-overlay-heat-glow",
                type: "circle",
                source: "hazard-overlay",
                layout: { visibility: "visible" },
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
                layout: { visibility: "visible" },
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
              instance.addLayer({
                id: "hazard-overlay-ground_motion-glow",
                type: "circle",
                source: "hazard-overlay",
                layout: { visibility: "none" },
                paint: {
                  "circle-color": "#7c6cff",
                  "circle-radius": 36,
                  "circle-opacity": 0.28,
                  "circle-blur": 0.9,
                },
              });
              instance.addLayer({
                id: "hazard-overlay-ground_motion",
                type: "circle",
                source: "hazard-overlay",
                layout: { visibility: "none" },
                paint: {
                  "circle-color": "#7c6cff",
                  "circle-radius": [
                    "interpolate",
                    ["linear"],
                    ["abs", ["get", "velocity_mm_per_yr"]],
                    0,
                    13,
                    5,
                    19,
                    15,
                    25,
                  ],
                  "circle-opacity": 0.92,
                  "circle-stroke-color": "#ffffff",
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
    };
  }, []);
  useEffect(() => {
    if (!ready || !map.current) return;
    let active = true;
    marker.current?.remove();
    if (!report) {
      map.current.flyTo({
        center: [-121.95, 47.48],
        zoom: 8.3,
        essential: true,
      });
      return;
    }
    import("maplibre-gl").then((maplibre) => {
      if (!active || !map.current) return;
      const pin = document.createElement("div");
      pin.className =
        "size-[22px] rounded-full border-4 border-white bg-[var(--brand-accent)] shadow-[0_0_0_12px_color-mix(in_srgb,var(--brand-accent),transparent_82%),0_2px_10px_#0004]";
      pin.setAttribute("aria-label", report.address);
      pin.setAttribute("role", "img");
      marker.current = new maplibre.Marker({ element: pin })
        .setLngLat([report.lon, report.lat])
        .addTo(map.current);
      map.current.flyTo({
        center: [report.lon, report.lat],
        zoom: 14,
        essential: true,
      });
    });
    return () => {
      active = false;
    };
  }, [report, ready]);
  useEffect(() => {
    if (!ready || !map.current) return;
    const layers = ["flood", "heat", "ground_motion"] as const;
    for (const layer of layers) {
      const ids =
        layer === "flood"
          ? [
              "hazard-overlay-flood-glow",
              "hazard-overlay-flood",
              "hazard-overlay-flood-ring",
            ]
          : layer === "heat"
            ? ["hazard-overlay-heat-glow", "hazard-overlay-heat"]
            : [
                "hazard-overlay-ground_motion-glow",
                "hazard-overlay-ground_motion",
              ];
      for (const id of ids) {
        map.current.setLayoutProperty(
          id,
          "visibility",
          layer === activeLayer ? "visible" : "none",
        );
      }
    }
  }, [activeLayer, ready]);
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
              properties: {
                status: report.hazards.flood.status,
                surface_temp_f: report.hazards.heat.surface_temp_f ?? 0,
                velocity_mm_per_yr:
                  report.hazards.ground_motion.velocity_mm_per_yr ?? 0,
              },
            },
          ]
        : [],
    });
  }, [report, ready]);
  return (
    <section
      className="relative h-[clamp(430px,55vw,640px)] overflow-hidden rounded-[16px] bg-secondary shadow-[0_22px_55px_-38px_#002f28] max-[760px]:h-[370px] [&_.maplibregl-ctrl-top-right]:!top-[14px] [&_.maplibregl-ctrl-top-right]:!right-[10px] [&_.maplibregl-ctrl-group]:!rounded-[5px] [&_.maplibregl-ctrl-group]:!border [&_.maplibregl-ctrl-group]:!border-border [&_.maplibregl-ctrl-group]:!shadow-[0_1px_8px_#001f1a66]"
      aria-label="Map of the selected address"
    >
      <div ref={container} className="absolute inset-0 h-full w-full" />
      <div className="absolute top-5 left-[18px] flex items-center gap-[7px] rounded bg-card/95 px-3 py-2.5 text-[8px] font-semibold tracking-[1.2px] text-card-foreground">
        <span className="size-[5px] rounded-full bg-primary" /> KING COUNTY,
        WASHINGTON
      </div>
      <div
        className="absolute top-[58px] left-[18px] flex gap-1 rounded-md bg-card/95 p-1 shadow-[0_2px_8px_#001f1a33]"
        aria-label="Hazard map layers"
      >
        {(["flood", "heat", "ground_motion"] as const).map((layer) => (
          <button
            key={layer}
            className={`rounded px-2 py-1.5 text-[8px] font-medium transition-colors ${activeLayer === layer ? "bg-primary text-primary-foreground" : "text-card-foreground hover:bg-muted"}`}
            type="button"
            onClick={() => setActiveLayer(layer)}
          >
            {layer === "ground_motion"
              ? "Movement"
              : layer === "flood"
                ? "Flood"
                : "Heat"}
          </button>
        ))}
      </div>
      <div
        className="absolute top-[83px] left-7 text-center text-[9px] text-foreground"
        aria-hidden="true"
      >
        N<span className="block text-[28px] leading-[1.1]">↑</span>
      </div>
      {error && (
        <div
          className="absolute inset-x-[18px] top-[42%] rounded-[5px] bg-card/95 p-[15px] text-center text-xs text-card-foreground"
          role="status"
        >
          The map couldn’t load. You can still read the report.
        </div>
      )}
      <button
        className="absolute top-[99px] right-5 grid size-8 place-items-center rounded-[5px] bg-card text-foreground disabled:cursor-not-allowed"
        type="button"
        aria-label="Recenter map"
        disabled={!ready}
        onClick={() =>
          map.current?.flyTo({
            center: report ? [report.lon, report.lat] : [-121.95, 47.48],
            zoom: report ? 14 : 8.3,
            essential: true,
          })
        }
      >
        <LocateFixed size={18} />
      </button>
      <div className="pointer-events-none absolute right-[19px] bottom-[20px] left-[19px] flex items-center gap-[13px] rounded-md bg-card/95 px-[17px] py-[19px] text-card-foreground shadow-[0_3px_18px_#001f1a44] max-[760px]:right-[13px] max-[760px]:bottom-[58px] max-[760px]:left-[13px] max-[760px]:p-3.5">
        <div className="grid size-[38px] shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
          {report ? <MapPin size={20} /> : <Satellite size={21} />}
        </div>
        <div>
          <strong className="block text-xs leading-[1.5] font-medium max-[760px]:text-[11px]">
            {loading
              ? "Finding your place…"
              : report
                ? report.address
                : "A closer look at the place you call home."}
          </strong>
          <p className="mt-[5px] text-[10px] leading-[1.5] text-[#c1d3ce] max-[760px]:text-[9px]">
            {report
              ? `${report.lat.toFixed(5)}° N · ${Math.abs(report.lon).toFixed(5)}° W`
              : "Start with an address. See what satellites observed."}
          </p>
        </div>
      </div>
    </section>
  );
}
