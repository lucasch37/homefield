const SUGGEST_URL =
  "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/suggest";

type ArcGisSuggestion = { text?: unknown; isCollection?: unknown };

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 3 || query.length > 200) {
    return Response.json({ suggestions: [] });
  }

  const url = new URL(SUGGEST_URL);
  url.searchParams.set("text", query);
  url.searchParams.set("f", "json");
  url.searchParams.set("category", "Address");
  url.searchParams.set("countryCode", "USA");
  url.searchParams.set("returnCollections", "false");
  url.searchParams.set("maxSuggestions", "6");
  // Bias results to King County without treating autocomplete as the final
  // county check. The report endpoint remains authoritative.
  url.searchParams.set("searchExtent", "-122.55,47.08,-121.05,47.82");

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return Response.json({ suggestions: [] });
    const payload = (await response.json()) as { suggestions?: ArcGisSuggestion[] };
    const suggestions = (payload.suggestions ?? [])
      .flatMap((item) =>
        typeof item.text === "string" && item.isCollection !== true
          ? [item.text]
          : [],
      )
      .slice(0, 6);
    return Response.json({ suggestions });
  } catch {
    return Response.json({ suggestions: [] });
  }
}
