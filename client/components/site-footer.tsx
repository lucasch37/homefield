import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="flex items-center justify-between border-t border-border py-[25px] pb-[30px] max-[760px]:flex-wrap max-[760px]:gap-2">
      <Link
        className="inline-flex items-center text-[23px] font-bold tracking-[-1.4px]"
        href="/"
      >
        homefield<span className="text-[var(--brand-accent)]">.</span>
      </Link>
      <p className="font-serif text-xs italic text-muted-foreground max-[760px]:ml-auto max-[760px]:text-[10px]">
        A closer look. A more informed next step.
      </p>
      <span className="text-[8px] tracking-[1px] text-muted-foreground max-[760px]:basis-full max-[760px]:text-[7px]">
        MADE FOR OUR NEIGHBORS ↗
      </span>
    </footer>
  );
}
