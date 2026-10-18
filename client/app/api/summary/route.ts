import { writeSummary } from "@/lib/summary";
import { normalizeReport } from "@/lib/types";
import { isSameOrigin, listModels, xaiApiKey, xaiBaseUrl, xaiTextModel } from "@/lib/xai";
import { pickTextModel } from "@/lib/xai-shared";

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
  const apiKey = xaiApiKey();
  const result = await writeSummary(report, {
    apiKey,
    baseUrl: xaiBaseUrl(),
    model: xaiTextModel(),
    findModel: async () => apiKey ? pickTextModel((await listModels(apiKey)).filter((id) => id !== xaiTextModel())) : undefined,
    log: (message) => console.warn(`[api/summary] ${message}`),
  });
  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}
