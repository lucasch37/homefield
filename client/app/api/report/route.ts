import { getReport, ServiceError } from "@/lib/backend";

export async function GET(request: Request) {
  const address = new URL(request.url).searchParams.get("address")?.trim();
  if (!address || address.length > 300)
    return Response.json(
      { error: "Enter a street address, city, and ZIP code." },
      { status: 400 },
    );
  try {
    return Response.json(await getReport(address), {
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
