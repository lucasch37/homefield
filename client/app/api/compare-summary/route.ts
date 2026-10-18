import { MAX_COMPARE, MIN_COMPARE } from "@/lib/compare";
import { findGeminiModel, geminiApiKey, geminiBaseUrl, geminiModel } from "@/lib/gemini";
import { writeComparison } from "@/lib/summary";
import { normalizeReport, type Report } from "@/lib/types";
import { isSameOrigin } from "@/lib/xai";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Forbidden" }, { status: 403 });
  let reports: Report[];
  try {
    const body = await request.text();
    if (body.length > 120000) throw new Error("Too large");
    const raw = (JSON.parse(body) as { reports?: unknown }).reports;
    if (!Array.isArray(raw) || raw.length < MIN_COMPARE || raw.length > MAX_COMPARE) throw new Error("Wrong count");
    reports = raw.map((item) => {
      const report = normalizeReport(item);
      if (!report.in_king_county) throw new Error("Outside coverage");
      return report;
    });
  } catch {
    return Response.json(
      { error: "Two or three valid reports are needed to write a comparison." },
      { status: 400 },
    );
  }
  const apiKey = geminiApiKey();
  const result = await writeComparison(reports, {
    apiKey,
    baseUrl: geminiBaseUrl(),
    model: geminiModel(),
    findModel: async () => (apiKey ? findGeminiModel(apiKey) : undefined),
    log: (message) => console.warn(`[api/compare-summary] ${message}`),
  });
  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}
