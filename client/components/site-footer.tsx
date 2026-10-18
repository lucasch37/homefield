import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="flex items-center justify-between mt-8 border-border py-[25px] pb-[30px] max-[760px]:flex-wrap max-[760px]:gap-2">
      <Link
        className="inline-flex items-center text-[23px] font-bold tracking-[-1.4px]"
        href="/"
      >
        homefield<span className="text-[var(--brand-accent)]">.</span>
      </Link>
      <p className="font-serif text-xs italic text-muted-foreground max-[760px]:ml-auto max-[760px]:text-[10px]">
        A closer look. A more informed next step.
      </p>
      <span className="flex flex-col items-end gap-1 text-[8px] tracking-[1px] text-muted-foreground max-[760px]:basis-full max-[760px]:items-start max-[760px]:text-[7px]">
        MADE FOR OUR NEIGHBORS ↗
        <span className="tracking-normal normal-case opacity-80">
          Earth imagery: NASA Blue Marble and Black Marble
        </span>
        <span className="tracking-normal normal-case opacity-80">
          Landsat 8 model: NASA 3D Resources
        </span>
      </span>
    </footer>
  );
}
