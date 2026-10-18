"use client";

import { useRouter } from "next/navigation";
<<<<<<< HEAD
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
=======
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
>>>>>>> origin/master

export const DIVE_FLAG = "homefield:dive";
export const DIVE_TARGET = "/search";
export const DIVE_NAV_EVENT = "homefield:dive-nav";

type Dive = {
  diving: boolean;
<<<<<<< HEAD
  landed: boolean;
  sceneReady: boolean;
  setSceneReady: (ready: boolean) => void;
  warmUp: () => void;
=======
  sceneReady: boolean;
  setSceneReady: (ready: boolean) => void;
>>>>>>> origin/master
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
<<<<<<< HEAD
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
=======
  const [sceneReady, setSceneReady] = useState(false);

  // cacheComponents keeps this page's state while it's hidden, so reset when the user leaves.
  useEffect(() => () => setDiving(false), []);

  const finishDive = useCallback(() => {
>>>>>>> origin/master
    window.dispatchEvent(new CustomEvent(DIVE_NAV_EVENT, { detail: false }));
    try {
      sessionStorage.setItem(DIVE_FLAG, "1");
    } catch {}
    window.scrollTo({ top: 0, behavior: "instant" });
    router.push(DIVE_TARGET);
  }, [router]);

<<<<<<< HEAD
  // The screen is black by now. Stop the 3D scenes, and switch pages once that has painted.
  const finishDive = useCallback(() => {
    setLanded(true);
    requestAnimationFrame(() => requestAnimationFrame(navigate));
  }, [navigate]);

  const startDive = useCallback(() => {
    warmUp();
=======
  const startDive = useCallback(() => {
    router.prefetch(DIVE_TARGET);
>>>>>>> origin/master
    if (sceneReady) {
      window.dispatchEvent(new CustomEvent(DIVE_NAV_EVENT, { detail: true }));
      setDiving(true);
    }
<<<<<<< HEAD
    else navigate();
  }, [warmUp, sceneReady, navigate]);

  const value = useMemo(
    () => ({ diving, landed, sceneReady, setSceneReady, warmUp, startDive, finishDive }),
    [diving, landed, sceneReady, warmUp, startDive, finishDive],
=======
    else finishDive();
  }, [router, sceneReady, finishDive]);

  const value = useMemo(
    () => ({ diving, sceneReady, setSceneReady, startDive, finishDive }),
    [diving, sceneReady, startDive, finishDive],
>>>>>>> origin/master
  );

  return (
    <DiveContext.Provider value={value}>
<<<<<<< HEAD
      <div className={`group/dive ${className ?? ""}`} data-diving={diving} data-landed={landed}>
=======
      <div className={`group/dive ${className ?? ""}`} data-diving={diving}>
>>>>>>> origin/master
        {children}
      </div>
    </DiveContext.Provider>
  );
}
