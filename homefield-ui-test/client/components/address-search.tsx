"use client";
import { ArrowRight, ArrowUpRight, LoaderCircle } from "lucide-react";
import { useState, type FormEvent } from "react";
import { HaloSearchInput } from "./ui/halo-search";

export function AddressSearch({
  loading,
  onSearch,
  onClear,
}: {
  loading: boolean;
  onSearch: (address: string) => void;
  onClear?: () => void;
}) {
  const [address, setAddress] = useState("");
  function changeAddress(value: string) {
    if (address.trim() && !value.trim()) onClear?.();
    setAddress(value);
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (address.trim()) onSearch(address.trim());
  }
  return (
    <div>
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
          onChange={(event) => changeAddress(event.target.value)}
          onClear={() => changeAddress("")}
          isLoading={loading}
          loadingText="Finding your place…"
          blobTranslucent
          maxLength={300}
          required
          disabled={loading}
        />
        <button
          className="flex items-center h-full justify-center gap-2 rounded-full border-0 bg-primary px-[21px] py-4 text-xs !text-[var(--primary-foreground)] transition-colors hover:not-disabled:bg-[color-mix(in_srgb,var(--primary),black_12%)] disabled:cursor-not-allowed disabled:opacity-55 max-[760px]:w-full max-[760px]:p-[13px] max-[760px]:text-[11px]"
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
      <div className="flex flex-wrap items-center gap-[15px] pt-3 text-[10px] text-muted-foreground max-[760px]:gap-2.5 max-[760px]:text-[9px]">
        <span>Try a familiar place</span>
        {["400 Broad St, Seattle, WA", "3215 E Union St, Seattle, WA"].map(
          (value, index) => (
            <button
              className="flex items-center gap-1 border-0 border-b border-border bg-transparent p-0 text-muted-foreground hover:text-primary"
              type="button"
              key={value}
              disabled={loading}
              onClick={() => {
                setAddress(value);
                onSearch(value);
              }}
            >
              {index === 0 ? "Seattle Center" : "Central District"}
              <ArrowUpRight size={12} />
            </button>
          ),
        )}
      </div>
    </div>
  );
}
