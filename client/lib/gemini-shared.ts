// Gemini helpers without secrets or server-only imports, so they can be unit-tested.

export type SummaryProblem =
  | "missing_key"
  | "bad_key"
  | "quota"
  | "rate_limited"
  | "model_unavailable"
  | "unreachable"
  | "upstream_error";

/** Plain-language reasons shown under the summary and in server logs. They never include the key. */
export const GEMINI_PROBLEM_MESSAGES: Record<SummaryProblem, string> = {
  missing_key: "Gemini isn’t connected: GEMINI_API_KEY isn’t set on the web server. Add it to client/.env.local (or the repo-root .env) and restart the app.",
  bad_key: "Gemini isn’t connected: Google rejected GEMINI_API_KEY, or the key can’t use the Gemini API. Check the key at aistudio.google.com and restart the app.",
  quota: "Gemini isn’t connected: the Gemini API quota for this key is used up. Check usage and billing at aistudio.google.com.",
  rate_limited: "Gemini is busy right now (rate limited). Please try again in a moment.",
  model_unavailable: "Gemini isn’t connected: the configured model isn’t available to this key. Set GEMINI_MODEL or leave it unset.",
  unreachable: "Gemini isn’t connected: the web server couldn’t reach generativelanguage.googleapis.com.",
  upstream_error: "Gemini had a problem writing the summary. Please try again.",
};

/** Maps a Gemini API HTTP status and error body to a reason. */
export function classifyGeminiStatus(status: number, body = ""): SummaryProblem {
  const text = body.toLowerCase();
  if (/api_key_invalid|api key not valid|api key expired|unauthenticated/.test(text) || status === 401) return "bad_key";
  if (status === 404 || (status === 400 && /model/.test(text) && /not found|not supported|no longer available|unknown/.test(text))) return "model_unavailable";
  if (status === 403) return "bad_key";
  if (status === 429) return /quota|billing|exceeded your current/.test(text) && !/per minute|rate/.test(text) ? "quota" : "rate_limited";
  return "upstream_error";
}

/** Picks a text model from GET /models, preferring the configured one, then stable fast Gemini models. */
export function pickGeminiModel(models: { name?: string; supportedGenerationMethods?: string[] }[], preferred?: string): string | undefined {
  const ids = models
    .filter((m) => typeof m.name === "string" && (m.supportedGenerationMethods ?? []).includes("generateContent"))
    .map((m) => (m.name as string).replace(/^models\//, ""));
  if (preferred && ids.includes(preferred)) return preferred;
  const usable = ids.filter((id) => /^gemini/i.test(id) && !/tts|image|audio|live|embed|vision|computer|customtools|robotics/i.test(id));
  const rank = (id: string) =>
    (id === "gemini-flash-latest" ? 100 : 0) + (/flash/.test(id) ? 10 : 0) + (/lite/.test(id) ? -3 : 0) + (/preview|exp/.test(id) ? -5 : 0);
  const version = (id: string) => Number(/gemini-(\d+(?:\.\d+)?)/.exec(id)?.[1] ?? 0);
  return usable.sort((a, b) => rank(b) - rank(a) || version(b) - version(a) || a.localeCompare(b))[0];
}

/** Text from a generateContent response (skips "thought" parts). */
export function geminiText(data: unknown): string | undefined {
  const parts = (data as { candidates?: { content?: { parts?: { text?: unknown; thought?: unknown }[] } }[] })
    ?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return undefined;
  const text = parts.filter((p) => !p.thought && typeof p.text === "string").map((p) => p.text).join("");
  return text || undefined;
}
