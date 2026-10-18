"use client";
import { ArrowRight, ArrowUpRight, LoaderCircle } from "lucide-react";
import { useState, type FormEvent } from "react";
import { affiliateParams, redfinLinkPath, zillowUrl } from "@/lib/listing-links";
import { DEMO_PLACES } from "@/lib/search";
import { HaloSearchInput } from "./ui/halo-search";

// Inlined at build time; set these to your affiliate query strings (see lib/listing-links.ts).
const ZILLOW_PARAMS = affiliateParams(process.env.NEXT_PUBLIC_ZILLOW_AFFILIATE_PARAMS);

export function AddressSearch({
  loading,
  onSearch,
  listingAddress,
}: {
  loading: boolean;
  onSearch: (query: string) => void;
  /** Street address of the current report; partner links appear when there is one. */
  listingAddress?: string | null;
}) {
  const [address, setAddress] = useState("400 Broad St, Seattle, WA 98109");
  function submit(event: FormEvent) {
    event.preventDefault();
    if (address.trim()) onSearch(address.trim());
  }
  return (
    <div className="mb-8 max-[760px]:mb-[25px]">
      <form
        className="flex items-center gap-2 max-[760px]:flex-wrap max-[760px]:gap-[9px] max-[760px]:p-[7px]"
        onSubmit={submit}
        aria-label="Look up a home"
      >
        <label htmlFor="address" className="sr-only">
          King County street address
        </label>
        <HaloSearchInput
          className="min-w-0 max-w-none flex-1"
          id="address"
          name="address"
          autoComplete="street-address"
          placeholder="Enter a King County address"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          onClear={() => setAddress("")}
          isLoading={loading}
          loadingText="Finding your place…"
          blobTranslucent
          maxLength={300}
          required
          disabled={loading}
        />
        <button
          className="flex h-full items-center justify-center gap-2 rounded-full border-0 bg-primary px-[21px] py-4 text-xs !text-[var(--primary-foreground)] transition-colors hover:not-disabled:bg-[color-mix(in_srgb,var(--primary),black_12%)] disabled:cursor-not-allowed disabled:opacity-55 max-[760px]:w-full max-[760px]:p-[13px] max-[760px]:text-[11px]"
          type="submit"
          disabled={loading || !address.trim()}
        >
          {loading ? (
            <>
              <LoaderCircle size={17} className="animate-spin" /> Looking up
            </>
          ) : (
            <>
              Explore this home <ArrowRight size={17} />
            </>
          )}
        </button>
      </form>
      {listingAddress && !loading && (
        <div className="flex flex-wrap items-center justify-end gap-2 pt-3 max-[760px]:justify-start" data-testid="listing-links">
          <span className="mr-1 text-[10px] text-muted-foreground">See this home on</span>
          {[
            { name: "Zillow", href: zillowUrl(listingAddress, ZILLOW_PARAMS) },
            { name: "Redfin", href: redfinLinkPath(listingAddress) },
          ].map((link) => (
            <a
              key={link.name}
              href={link.href}
              target="_blank"
              rel="sponsored noopener"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3.5 py-2 text-[11px] font-medium text-white transition-colors hover:border-primary hover:bg-primary hover:text-[var(--primary-foreground)]"
            >
              {link.name}
              <ArrowUpRight size={13} />
            </a>
          ))}
          <span className="basis-full text-right text-[9px] text-muted-foreground max-[760px]:text-left">Partner links. Homefield may earn a commission.</span>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-[15px] pt-3 text-[11px] text-muted-foreground max-[760px]:gap-2.5 max-[760px]:text-[10px]">
        <span>Try a place</span>
        {DEMO_PLACES.map((place) => (
          <button
            className="flex items-center gap-1 border-0 border-b border-border bg-transparent p-0 text-muted-foreground hover:text-primary disabled:opacity-50"
            type="button"
            key={place.label}
            disabled={loading}
            onClick={() => {
              setAddress(place.query);
              onSearch(place.query);
            }}
          >
            {place.label}
            <ArrowUpRight size={12} />
          </button>
        ))}
        <span className="basis-full text-[10px] opacity-80">You can also enter coordinates, like “47.664, -121.92”.</span>
      </div>
    </div>
  );
}
