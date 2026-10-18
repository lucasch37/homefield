import { getReport, ServiceError, type ReportQuery } from "@/lib/backend";

function parseQuery(params: URLSearchParams): ReportQuery | string {
  const address = params.get("address")?.trim();
  const lat = params.get("lat");
  const lon = params.get("lon");
  if (address) {
    return address.length > 300 ? "Enter a shorter address: a street address, city, and ZIP code." : { address };
  }
  if (lat !== null && lon !== null) {
    const query = { lat: Number(lat), lon: Number(lon) };
    if (lat.trim() && lon.trim() && Number.isFinite(query.lat) && Number.isFinite(query.lon)
      && Math.abs(query.lat) <= 90 && Math.abs(query.lon) <= 180) return query;
    return "Enter a valid latitude and longitude.";
  }
  return "Enter a street address, city, and ZIP code.";
}

export async function GET(request: Request) {
  const query = parseQuery(new URL(request.url).searchParams);
  if (typeof query === "string") return Response.json({ error: query }, { status: 400 });
  try {
    return Response.json(await getReport(query), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof ServiceError
            ? error.message
            : "We couldn’t load this report. Please try again.",
      },
      { status: error instanceof ServiceError ? error.status : 502 },
    );
  }
}
