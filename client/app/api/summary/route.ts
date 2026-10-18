import { findGeminiModel, geminiApiKey, geminiBaseUrl, geminiModel } from "@/lib/gemini";
import { writeSummary } from "@/lib/summary";
import { normalizeReport } from "@/lib/types";
import { isSameOrigin } from "@/lib/xai";

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
  const apiKey = geminiApiKey();
  const result = await writeSummary(report, {
    apiKey,
    baseUrl: geminiBaseUrl(),
    model: geminiModel(),
    findModel: async () => (apiKey ? findGeminiModel(apiKey) : undefined),
    log: (message) => console.warn(`[api/summary] ${message}`),
  });
  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}
