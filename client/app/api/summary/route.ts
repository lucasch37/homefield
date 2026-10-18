import { writeSummary } from "@/lib/summary";
import { normalizeReport } from "@/lib/types";
import { isSameOrigin, xaiApiKey, xaiBaseUrl, xaiTextModel } from "@/lib/xai";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Forbidden" }, { status: 403 });
  let report;
  try {
    const body = await request.text();
    if (body.length > 40000) throw new Error("Too large");
    report = normalizeReport(JSON.parse(body));
    if (!report.in_king_county) throw new Error("Outside coverage");
  } catch {
    return Response.json(
      { error: "A valid report is needed to write a summary." },
      { status: 400 },
    );
  }
  const result = await writeSummary(report, {
    apiKey: xaiApiKey(),
    baseUrl: xaiBaseUrl(),
    model: xaiTextModel(),
    log: (message) => console.warn(`[api/summary] ${message}`),
  });
  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}
