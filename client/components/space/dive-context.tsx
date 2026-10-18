"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export const DIVE_FLAG = "homefield:dive";
export const DIVE_TARGET = "/search";
export const DIVE_NAV_EVENT = "homefield:dive-nav";

type Dive = {
  diving: boolean;
  landed: boolean;
  sceneReady: boolean;
  setSceneReady: (ready: boolean) => void;
  warmUp: () => void;
  startDive: () => void;
  finishDive: () => void;
};

const DiveContext = createContext<Dive | null>(null);

export function useDive() {
  const dive = useContext(DiveContext);
  if (!dive) throw new Error("useDive must be used inside DiveProvider");
  return dive;
}

export function DiveProvider({ children, className }: { children: ReactNode; className?: string }) {
  const router = useRouter();
  const [diving, setDiving] = useState(false);
  const [landed, setLanded] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const warmed = useRef(false);

  // cacheComponents keeps this page's state while it's hidden, so reset when the user leaves.
  useEffect(
    () => () => {
      setDiving(false);
      setLanded(false);
    },
    [],
  );

  const warmUp = useCallback(() => {
    if (warmed.current) return;
    warmed.current = true;
    router.prefetch(DIVE_TARGET);
    import("maplibre-gl").catch(() => {});
  }, [router]);

  const navigate = useCallback(() => {
    window.dispatchEvent(new CustomEvent(DIVE_NAV_EVENT, { detail: false }));
    try {
      sessionStorage.setItem(DIVE_FLAG, "1");
    } catch {}
    window.scrollTo({ top: 0, behavior: "instant" });
    router.push(DIVE_TARGET);
  }, [router]);

  // The screen is black by now. Stop the 3D scenes, and switch pages once that has painted.
  const finishDive = useCallback(() => {
    setLanded(true);
    requestAnimationFrame(() => requestAnimationFrame(navigate));
  }, [navigate]);

  const startDive = useCallback(() => {
    warmUp();
    if (sceneReady) {
      window.dispatchEvent(new CustomEvent(DIVE_NAV_EVENT, { detail: true }));
      setDiving(true);
    }
    else navigate();
  }, [warmUp, sceneReady, navigate]);

  const value = useMemo(
    () => ({ diving, landed, sceneReady, setSceneReady, warmUp, startDive, finishDive }),
    [diving, landed, sceneReady, warmUp, startDive, finishDive],
  );

  return (
    <DiveContext.Provider value={value}>
      <div className={`group/dive ${className ?? ""}`} data-diving={diving} data-landed={landed}>
        {children}
      </div>
    </DiveContext.Provider>
  );
}
