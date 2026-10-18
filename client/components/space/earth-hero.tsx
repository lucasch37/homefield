"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useDive } from "./dive-context";
import { CENTER_Y_LANDSCAPE, CENTER_Y_PORTRAIT, FILL_HEIGHT, FILL_WIDTH } from "./earth-layout";
import { usePrefersReducedMotion } from "./use-reduced-motion";

const EarthScene = dynamic(() => import("./earth-scene"), { ssr: false });

export default function EarthHero({ className }: { className?: string }) {
  const wrapper = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [ready, setReady] = useState(false);
  const [dipped, setDipped] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const { diving, setSceneReady, finishDive } = useDive();
  const onReady = useCallback(() => {
    setReady(true);
    setSceneReady(true);
  }, [setSceneReady]);
  const onDip = useCallback(() => setDipped(true), []);
  useEffect(() => () => setDipped(false), []);

  useEffect(() => {
    const el = wrapper.current;
    if (!diving || !el) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < 0 || rect.bottom > window.innerHeight) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [diving]);

  useEffect(() => {
    const el = wrapper.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const size = `min(${FILL_HEIGHT * 100}cqh, ${FILL_WIDTH * 100}cqw)`;

  return (
    <div
      ref={wrapper}
      className={diving
        ? "pointer-events-none fixed inset-0 z-30 h-svh w-screen [container-type:size]"
        : cn("relative [container-type:size]", className)}
      role="img"
      aria-label="A rotating Earth with a satellite orbiting it, observing the surface"
    >
      <div
        className={cn(
          "absolute left-1/2 top-[var(--cy-l)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full shadow-[0_0_80px_rgba(80,160,255,.35)] transition-opacity duration-1000 portrait:top-[var(--cy-p)]",
          ready ? "opacity-0" : "opacity-100",
        )}
        style={
          {
            width: size,
            height: size,
            "--cy-l": `${CENTER_Y_LANDSCAPE * 100}%`,
            "--cy-p": `${CENTER_Y_PORTRAIT * 100}%`,
          } as React.CSSProperties
        }
        aria-hidden="true"
      >
        <Image src="/earth.png" alt="" fill priority sizes="900px" className="object-cover" />
      </div>
      <div className={cn("absolute inset-0 transition-opacity duration-1000", ready ? "opacity-100" : "opacity-0")}>
        <EarthScene
          animate={visible && !reducedMotion}
          onReady={onReady}
          diving={diving}
          onDip={onDip}
          onDiveEnd={finishDive}
        />
      </div>
      <div
        className={cn(
          "pointer-events-none fixed inset-0 z-50 bg-black transition-opacity duration-[250ms] ease-in",
          dipped ? "opacity-100" : "opacity-0",
        )}
        aria-hidden="true"
      />
    </div>
  );
}
