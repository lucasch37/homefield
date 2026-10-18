"use client";

import { MapPin } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import PillNav from "./ui/pill-nav/pill-nav";

export function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <>
      <header className="relative z-20 flex h-[94px] items-center justify-between max-[760px]:h-[77px]">
        <Link
          className={`inline-flex items-center text-[27px] font-bold tracking-[-1.4px] max-[760px]:text-2xl ${isHome ? "text-[#eef1ff]" : ""}`}
          href="/"
          aria-label="Homefield home"
        >
          homefield<span className="text-[var(--brand-accent)]">.</span>
        </Link>
        <div className="max-[760px]:w-[min(150px,44vw)] max-[760px]:shrink-0">
          <PillNav
            items={[
              { label: "Home", href: "/" },
              { label: "Search", href: "/search" },
              { label: "About", href: "/about" },
            ]}
            linkComponent={Link}
            activeHref={pathname}
            itemStyle="pill"
            hoverEffect="fill"
            indicator="dot"
            onItemClick={() => {}}
            highlightColor="var(--primary)"
            highlightTextColor="var(--primary-foreground)"
            barColor={isHome ? "rgba(13, 11, 36, .9)" : "rgba(11, 15, 31, .96)"}
            textColor="var(--foreground)"
            size="lg"
            style={{
              "--pn-tile":
                "linear-gradient(180deg, rgba(255,255,255,.17), rgba(255,255,255,.08))",
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
            className={`flex items-center gap-[7px] whitespace-nowrap max-[840px]:hidden ${isHome ? "text-white/75" : "text-muted-foreground"}`}
          >
            <MapPin size={13} />
            King County, WA
          </span>
        </div>
      </header>
    </>
  );
}
