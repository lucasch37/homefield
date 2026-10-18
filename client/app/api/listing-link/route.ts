import { affiliateParams, redfinDestination, redfinHomePath } from "@/lib/listing-links";

// Opens Redfin on the searched home. Redfin has no address search URL, so ask its location
// autocomplete for the home page and redirect there; fall back to the ZIP code page.
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const address = params.get("address")?.trim().slice(0, 300);
  if (params.get("site") !== "redfin" || !address) return Response.json({ error: "Unknown link." }, { status: 400 });
  let homePath: string | undefined;
  try {
    const lookup = new URL("https://www.redfin.com/stingray/do/location-autocomplete");
    lookup.searchParams.set("location", address);
    lookup.searchParams.set("v", "2");
    const response = await fetch(lookup, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Homefield/1.0)", Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    if (response.ok) homePath = redfinHomePath(await response.text());
  } catch {}
  const destination = redfinDestination(address, homePath, affiliateParams(process.env.NEXT_PUBLIC_REDFIN_AFFILIATE_PARAMS));
  return new Response(null, { status: 302, headers: { Location: destination, "Cache-Control": "no-store" } });
}
