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
  const isReports = pathname === "/reports";
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
            className="pointer-events-none absolute inset-y-0 left-1/2 -z-10 w-screen -translate-x-1/2 bg-[#171025]"
          />
        )}
        <Link
          className={`inline-flex items-center text-[27px] font-semibold tracking-normal max-[760px]:text-2xl ${isHome ? "text-[#eef1ff]" : ""} ${isSearch ? "relative isolate before:pointer-events-none before:absolute before:inset-[-8px_-22px] before:-z-10 before:rounded-full before:border before:border-violet-300/15 before:bg-[#171025]/90 before:shadow-[0_8px_24px_-14px_rgba(0,0,0,.9)] before:content-['']" : ""}`}
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
            }}
            onMenuToggle={() => {}}
          />
        </div>
        <div className="flex items-center gap-8 text-[13px] max-[840px]:hidden">
          <span
            className={`flex items-center gap-[7px] whitespace-nowrap max-[840px]:hidden ${isHome ? "text-white/75" : "text-white/75"} ${isSearch ? "relative isolate before:pointer-events-none before:absolute before:inset-[-8px_-18px] before:-z-10 before:rounded-full before:border before:border-violet-300/15 before:bg-[#171025]/90 before:shadow-[0_8px_24px_-14px_rgba(0,0,0,.9)] before:content-['']" : ""}`}
          >
            <MapPin size={13} />
            King County, WA
          </span>
        </div>
      </header>
    </>
  );
}
