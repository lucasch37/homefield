"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export const DIVE_FLAG = "homefield:dive";
export const DIVE_TARGET = "/search";
export const DIVE_NAV_EVENT = "homefield:dive-nav";

type Dive = {
  diving: boolean;
  sceneReady: boolean;
  setSceneReady: (ready: boolean) => void;
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
  const [sceneReady, setSceneReady] = useState(false);

  // cacheComponents keeps this page's state while it's hidden, so reset when the user leaves.
  useEffect(() => () => setDiving(false), []);

  const finishDive = useCallback(() => {
    window.dispatchEvent(new CustomEvent(DIVE_NAV_EVENT, { detail: false }));
    try {
      sessionStorage.setItem(DIVE_FLAG, "1");
    } catch {}
    window.scrollTo({ top: 0, behavior: "instant" });
    router.push(DIVE_TARGET);
  }, [router]);

  const startDive = useCallback(() => {
    router.prefetch(DIVE_TARGET);
    if (sceneReady) {
      window.dispatchEvent(new CustomEvent(DIVE_NAV_EVENT, { detail: true }));
      setDiving(true);
    }
    else finishDive();
  }, [router, sceneReady, finishDive]);

  const value = useMemo(
    () => ({ diving, sceneReady, setSceneReady, startDive, finishDive }),
    [diving, sceneReady, startDive, finishDive],
  );

  return (
    <DiveContext.Provider value={value}>
      <div className={`group/dive ${className ?? ""}`} data-diving={diving}>
        {children}
      </div>
    </DiveContext.Provider>
  );
}
