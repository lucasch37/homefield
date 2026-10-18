"use client";

import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";
import { DIVE_TARGET, useDive } from "./dive-context";
import { usePrefersReducedMotion } from "./use-reduced-motion";

export function ExploreButton({ className, children }: { className?: string; children: ReactNode }) {
  const { diving, startDive } = useDive();
  const reducedMotion = usePrefersReducedMotion();

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (reducedMotion || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    if (!diving) startDive();
  };

  return (
    <Link className={className} href={DIVE_TARGET} onClick={onClick} aria-disabled={diving || undefined}>
      {children}
    </Link>
  );
}
