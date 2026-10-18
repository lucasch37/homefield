"use client";
import { ArrowRight, ArrowUpRight, LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { DEMO_PLACES } from "@/lib/search";
import { HaloSearchInput } from "./ui/halo-search";

export function AddressSearch({
  loading,
  onSearch,
}: {
  loading: boolean;
  onSearch: (query: string) => void;
}) {
  const [address, setAddress] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const suggestionRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    const query = address.trim();
    const looksLikeCoordinates = /^-?\d{1,3}(?:\.\d+)?\s*,\s*-?\d{1,3}(?:\.\d+)?$/.test(query);
    if (!suggestionsOpen || loading || query.length < 3 || looksLikeCoordinates) {
      return;
    }

    const controller = new AbortController();
    suggestionRequest.current = controller;
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/address-suggestions?q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );
        if (!response.ok) return;
        const result = (await response.json()) as { suggestions?: unknown };
        if (controller.signal.aborted) return;
        const next = Array.isArray(result.suggestions)
          ? result.suggestions.filter((value): value is string => typeof value === "string")
          : [];
        setSuggestions(next);
        setActiveSuggestion(-1);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setSuggestions([]);
        }
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
      if (suggestionRequest.current === controller) {
        suggestionRequest.current = null;
      }
    };
  }, [address, loading, suggestionsOpen]);

  function closeSuggestions() {
    suggestionRequest.current?.abort();
    suggestionRequest.current = null;
    setSuggestionsOpen(false);
    setSuggestions([]);
    setActiveSuggestion(-1);
  }

  function chooseSuggestion(value: string) {
    closeSuggestions();
    setAddress(value);
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!suggestions.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggestion((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggestion((index) =>
        index <= 0 ? suggestions.length - 1 : index - 1,
      );
    } else if (event.key === "Enter" && activeSuggestion >= 0) {
      event.preventDefault();
      chooseSuggestion(suggestions[activeSuggestion]);
    } else if (event.key === "Escape") {
      closeSuggestions();
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    closeSuggestions();
    const addressInput = event.currentTarget.elements.namedItem("address");
    if (addressInput instanceof HTMLInputElement) {
      addressInput.blur();
    }
    if (address.trim()) {
      onSearch(address.trim());
    }
  }
  return (
    <div className="mb-8 max-[760px]:mb-[25px]">
      <form
        className="flex items-center gap-2 max-[760px]:flex-wrap max-[760px]:gap-[9px] max-[760px]:p-[7px]"
        onSubmit={submit}
        autoComplete="off"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            closeSuggestions();
          }
        }}
        aria-label="Look up a home"
      >
        <label htmlFor="address" className="sr-only">
          King County street address
        </label>
        <div className="relative min-w-0 flex-1 max-[760px]:basis-full">
          <HaloSearchInput
            className="w-full max-w-none"
            id="address"
            name="address"
            autoComplete="off"
            placeholder="Enter a King County address"
            value={address}
            onChange={(event) => {
              const value = event.target.value;
              suggestionRequest.current?.abort();
              setSuggestions([]);
              setActiveSuggestion(-1);
              setAddress(value);
              setSuggestionsOpen(true);
              if (
                value.trim().length < 3 ||
                /^-?\d{1,3}(?:\.\d+)?\s*,\s*-?\d{1,3}(?:\.\d+)?$/.test(
                  value.trim(),
                )
              ) {
                setSuggestions([]);
                setActiveSuggestion(-1);
              }
            }}
            onKeyDown={handleSearchKeyDown}
            onClear={() => {
              closeSuggestions();
              setAddress("");
            }}
            isLoading={loading}
            loadingText="Finding your place…"
            blobTranslucent
            maxLength={300}
            required
            disabled={loading}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={suggestionsOpen && !loading && suggestions.length > 0}
            aria-controls="address-suggestions"
            aria-activedescendant={
              activeSuggestion >= 0
                ? `address-suggestion-${activeSuggestion}`
                : undefined
            }
          />
          {suggestionsOpen && !loading && suggestions.length > 0 && (
            <ul
              id="address-suggestions"
              role="listbox"
              className="absolute z-30 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-white/25 bg-[#0d443a]/98 p-1.5 text-left text-white shadow-[0_18px_45px_-18px_rgba(0,0,0,0.75)] backdrop-blur-xl"
            >
              {suggestions.map((suggestion, index) => (
                <li
                  id={`address-suggestion-${index}`}
                  role="option"
                  aria-selected={index === activeSuggestion}
                  key={suggestion}
                >
                  <button
                    type="button"
                    className={`w-full rounded-xl px-4 py-3 text-left text-[12px] leading-5 transition-colors ${index === activeSuggestion ? "bg-[#d8f58e] text-[#123d36]" : "text-white/90 hover:bg-white/12"}`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => chooseSuggestion(suggestion)}
                  >
                    {suggestion}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          className="flex h-full items-center justify-center gap-2 rounded-full border-0 bg-primary px-[21px] py-4 text-xs !text-[var(--primary-foreground)] transition-colors hover:not-disabled:bg-[color-mix(in_srgb,var(--primary),black_12%)] disabled:cursor-not-allowed disabled:opacity-55 max-[760px]:w-full max-[760px]:p-[13px] max-[760px]:text-[11px]"
          type="submit"
          disabled={loading || !address.trim()}
          onPointerDown={(event) => {
            closeSuggestions();
            const addressInput = event.currentTarget.form?.elements.namedItem("address");
            if (addressInput instanceof HTMLInputElement) {
              addressInput.blur();
            }
          }}
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
      <div className="flex flex-wrap items-center gap-[15px] pt-3 text-[11px] text-muted-foreground max-[760px]:gap-2.5 max-[760px]:text-[10px]">
        <span>Try a place</span>
        {DEMO_PLACES.map((place) => (
          <button
            className="flex items-center gap-1 border-0 border-b border-border bg-transparent p-0 text-muted-foreground hover:text-primary disabled:opacity-50"
            type="button"
            key={place.label}
            disabled={loading}
            onClick={() => {
              chooseSuggestion(place.query);
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
