import "server-only";
import { classifyGeminiStatus, GEMINI_PROBLEM_MESSAGES, pickGeminiModel, type SummaryProblem } from "./gemini-shared";

// Gemini settings for the written summary. The key is only read here, on the server.
// GEMINI_BASE_URL exists so local tests can point at a stand-in; production leaves it unset.

export const geminiApiKey = () => process.env.GEMINI_API_KEY?.trim() || undefined;

export const geminiBaseUrl = () =>
  (process.env.GEMINI_BASE_URL?.trim() || "https://generativelanguage.googleapis.com/v1beta").replace(/\/$/, "");

/** `gemini-flash-latest` always points at Google's current Flash model, so it doesn't go stale. */
export const geminiModel = () => process.env.GEMINI_MODEL?.trim() || "gemini-flash-latest";

let cached: { at: number; models: { name?: string; supportedGenerationMethods?: string[] }[] } | null = null;

/** Lists the key's models (cached 10 minutes). Throws a SummaryProblem string on failure. */
export async function listGeminiModels(apiKey: string) {
  if (cached && Date.now() - cached.at < 600_000) return cached.models;
  let response: Response;
  try {
    response = await fetch(`${geminiBaseUrl()}/models?pageSize=200`, {
      headers: { "x-goog-api-key": apiKey },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw "unreachable" satisfies SummaryProblem;
  }
  if (!response.ok) throw classifyGeminiStatus(response.status, await response.text().catch(() => ""));
  const data = await response.json().catch(() => ({}));
  const models = Array.isArray(data?.models) ? data.models : [];
  cached = { at: Date.now(), models };
  return models;
}

/** Another usable model when the configured one fails. */
export async function findGeminiModel(apiKey: string): Promise<string | undefined> {
  const models = await listGeminiModels(apiKey);
  return pickGeminiModel(models.filter((m: { name?: string }) => m.name !== `models/${geminiModel()}`));
}

export type GeminiStatus = { connected: boolean; problem?: SummaryProblem; message?: string; model?: string };

/** Checks the key against Gemini so the page can say exactly why the summary isn't connected. */
export async function checkGemini(): Promise<GeminiStatus> {
  const apiKey = geminiApiKey();
  if (!apiKey) return { connected: false, problem: "missing_key", message: GEMINI_PROBLEM_MESSAGES.missing_key };
  try {
    const models = await listGeminiModels(apiKey);
    const model = pickGeminiModel(models, geminiModel());
    if (!model) return { connected: false, problem: "model_unavailable", message: GEMINI_PROBLEM_MESSAGES.model_unavailable };
    return { connected: true, model };
  } catch (problem) {
    const reason = (typeof problem === "string" ? problem : "unreachable") as SummaryProblem;
    console.warn(`[gemini] status check failed: ${reason}`);
    return { connected: false, problem: reason, message: GEMINI_PROBLEM_MESSAGES[reason] };
  }
}
