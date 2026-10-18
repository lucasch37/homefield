"use client";

import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";
<<<<<<< HEAD
import StarBorder from "@/components/ui/star-border";
=======
>>>>>>> origin/master
import { DIVE_TARGET, useDive } from "./dive-context";
import { usePrefersReducedMotion } from "./use-reduced-motion";

export function ExploreButton({ className, children }: { className?: string; children: ReactNode }) {
<<<<<<< HEAD
  const { diving, startDive, warmUp } = useDive();
=======
  const { diving, startDive } = useDive();
>>>>>>> origin/master
  const reducedMotion = usePrefersReducedMotion();

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (reducedMotion || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    if (!diving) startDive();
  };

  return (
<<<<<<< HEAD
    <StarBorder
      as={Link}
      color="#DDD3FE"
      trailColor="#C4B5FD"
      borderColor="rgba(196, 181, 253, .3)"
      duration={4}
      direction="clockwise"
      stars={1}
      trailLength={0.3}
      thickness={2}
      radius={12}
      glow={0.8}
      hover="lap"
      sparkle={false}
      clickPulse
      theme="dark"
      className={className}
      href={DIVE_TARGET}
      onClick={onClick}
      onPointerEnter={warmUp}
      onFocus={warmUp}
      aria-disabled={diving || undefined}
    >
      {children}
    </StarBorder>
=======
    <Link className={className} href={DIVE_TARGET} onClick={onClick} aria-disabled={diving || undefined}>
      {children}
    </Link>
>>>>>>> origin/master
  );
}
