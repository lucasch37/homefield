"use client";

import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DIVE_NAV_EVENT } from "./space/dive-context";
import PillNav from "./ui/pill-nav/pill-nav";

export function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
<<<<<<< HEAD
  const isReports = pathname === "/reports" || pathname === "/compare";
=======
  const isReports = pathname === "/reports";
>>>>>>> origin/master
  const isSearch = pathname === "/search";
  const [diveActive, setDiveActive] = useState(false);

  useEffect(() => {
    const onDive = (event: Event) => {
      setDiveActive((event as CustomEvent<boolean>).detail);
    };
    window.addEventListener(DIVE_NAV_EVENT, onDive);
    return () => window.removeEventListener(DIVE_NAV_EVENT, onDive);
  }, []);

  return (
    <>
      <header
        className="relative isolate z-20 flex h-[94px] items-center justify-between max-[760px]:h-[77px]"
        style={isHome && diveActive ? { visibility: "hidden" } : undefined}
      >
        {isReports && (
          <div
            aria-hidden="true"
<<<<<<< HEAD
            className="pointer-events-none absolute inset-y-0 left-1/2 -z-10 w-screen -translate-x-1/2 bg-[#120b1f]"
          />
        )}
        <Link
          className={`inline-flex items-center text-[27px] font-semibold tracking-normal max-[760px]:text-2xl ${isHome ? "text-[#eef1ff]" : ""} ${isSearch ? "relative isolate before:pointer-events-none before:absolute before:inset-[-8px_-22px] before:-z-10 before:rounded-full before:border before:border-violet-300/15 before:bg-[#120b1f]/90 before:shadow-[0_8px_24px_-14px_rgba(0,0,0,.9)] before:content-['']" : ""}`}
=======
            className="pointer-events-none absolute inset-y-0 left-1/2 -z-10 w-screen -translate-x-1/2 bg-[#171025]"
          />
        )}
        <Link
          className={`inline-flex items-center text-[27px] font-semibold tracking-normal max-[760px]:text-2xl ${isHome ? "text-[#eef1ff]" : ""} ${isSearch ? "relative isolate before:pointer-events-none before:absolute before:inset-[-8px_-22px] before:-z-10 before:rounded-full before:border before:border-violet-300/15 before:bg-[#171025]/90 before:shadow-[0_8px_24px_-14px_rgba(0,0,0,.9)] before:content-['']" : ""}`}
>>>>>>> origin/master
          href="/"
          aria-label="Homefield home"
        >
          homefield<span className="text-[var(--brand-accent)]">.</span>
        </Link>
        <div className="max-[760px]:w-[min(220px,60vw)] max-[760px]:shrink-0">
          <PillNav
            items={[
              { label: "Home", href: "/" },
              { label: "Search", href: "/search" },
              { label: "Reports", href: "/reports" },
            ]}
            linkComponent={Link}
<<<<<<< HEAD
            activeHref={isReports ? "/reports" : pathname}
            itemStyle="pill"
            surface="solid"
            hoverEffect="none"
            indicator="dot"
            onItemClick={() => {}}
            highlightColor="#D4C8FE"
            highlightTextColor="#1E1033"
            barColor="#07040D"
            textColor="#B8A9D9"
            size="lg"
            style={{
              "--pn-tile": "#0B0614",
              "--pn-tile-rim": "inset 0 0 0 1px #1F1632",
              "--pn-active-tile": "#C4B5FD",
              "--pn-active-rim": "inset 0 0 0 1px #DDD3FE",
              "--pn-active-hover": "#D4C8FE",
              "--pn-active-ink": "#1E1033",
              "--pn-hover-fill": "rgba(196, 181, 253, .22)",
              "--pn-hover-ink": "#DDD3FE",
              "--pn-edge": "#1F1632",
              "--pn-rim": "transparent",
              "--pn-dot": "#1E1033",
              "--pn-ring": "#DDD3FE",
              "--pn-pill-shadow": "inset 0 0 0 1px #DDD3FE",
              "--pn-row-hover": "#120B1F",
=======
            activeHref={pathname}
            itemStyle="pill"
            surface="solid"
            hoverEffect="fill"
            indicator="dot"
            onItemClick={() => {}}
            highlightColor="var(--primary)"
            highlightTextColor="var(--primary-foreground)"
            barColor="#171025"
            textColor="var(--foreground)"
            size="lg"
            style={{
              "--pn-tile": "rgba(139, 92, 246, .2)",
              "--pn-tile-rim":
                "inset 0 0 0 1px rgba(255,255,255,.17), inset 0 1px 0 rgba(255,255,255,.2), 0 6px 14px -8px #020312",
              "--pn-edge": "rgba(196, 210, 255, .42)",
              "--pn-rim": "rgba(255, 255, 255, .24)",
              "--pn-dot": "var(--primary)",
              "--pn-row-hover":
                "color-mix(in srgb, var(--primary) 12%, transparent)",
>>>>>>> origin/master
            }}
            onMenuToggle={() => {}}
          />
        </div>
        <div className="flex items-center gap-8 text-[13px] max-[840px]:hidden">
          <span
<<<<<<< HEAD
            className={`flex items-center gap-[7px] whitespace-nowrap max-[840px]:hidden ${isHome ? "text-white/75" : "text-white/75"} ${isSearch ? "relative isolate before:pointer-events-none before:absolute before:inset-[-8px_-18px] before:-z-10 before:rounded-full before:border before:border-violet-300/15 before:bg-[#120b1f]/90 before:shadow-[0_8px_24px_-14px_rgba(0,0,0,.9)] before:content-['']" : ""}`}
=======
            className={`flex items-center gap-[7px] whitespace-nowrap max-[840px]:hidden ${isHome ? "text-white/75" : "text-white/75"} ${isSearch ? "relative isolate before:pointer-events-none before:absolute before:inset-[-8px_-18px] before:-z-10 before:rounded-full before:border before:border-violet-300/15 before:bg-[#171025]/90 before:shadow-[0_8px_24px_-14px_rgba(0,0,0,.9)] before:content-['']" : ""}`}
>>>>>>> origin/master
          >
            <MapPin size={13} />
            King County, WA
          </span>
        </div>
      </header>
    </>
  );
}
