// xAI helpers without secrets or server-only imports, so they can be unit-tested.

export type XaiProblem =
  | "missing_key"
  | "bad_key"
  | "no_credits"
  | "rate_limited"
  | "model_unavailable"
  | "unreachable"
  | "upstream_error";

/** Plain-language reasons shown in the UI and server logs. They never include the key. */
export const XAI_PROBLEM_MESSAGES: Record<XaiProblem, string> = {
  missing_key: "Grok isn’t connected: XAI_API_KEY isn’t set on the web server. Add it to client/.env.local (or the repo-root .env) and restart the app.",
  bad_key: "Grok isn’t connected: xAI rejected the API key, or the key isn’t allowed to use this endpoint. Check XAI_API_KEY and the key’s permissions (chat and voice) at console.x.ai, then restart the app.",
  no_credits: "Grok isn’t connected: the xAI account has no credits or is blocked. Add credits at console.x.ai.",
  rate_limited: "Grok is busy right now (rate limited). Please try again in a moment.",
  model_unavailable: "Grok isn’t connected: the configured text model isn’t available on this xAI account. Set XAI_TEXT_MODEL or leave it unset.",
  unreachable: "Grok isn’t connected: the web server couldn’t reach api.x.ai.",
  upstream_error: "Grok had a problem answering. Please try again.",
};

/** Maps an xAI HTTP status (and error text) to a reason. */
export function classifyXaiStatus(status: number, body = ""): XaiProblem {
  const text = body.toLowerCase();
  if (status === 401) return "bad_key";
  if (status === 403 && /credit|billing|spend|balance|permission/.test(text)) return "no_credits";
  if (status === 403) return "bad_key";
  if (status === 402) return "no_credits";
  if (status === 429) return /credit|quota|spend|balance/.test(text) ? "no_credits" : "rate_limited";
  if ((status === 400 || status === 404) && /model/.test(text)) return "model_unavailable";
  if (status === 400 && /api key|apikey|incorrect.*key/.test(text)) return "bad_key";
  return "upstream_error";
}

/** Picks a chat model from GET /v1/models, preferring the configured one, then fast non-reasoning Grok models. */
export function pickTextModel(ids: string[], preferred?: string): string | undefined {
  if (preferred && ids.includes(preferred)) return preferred;
  const usable = ids.filter((id) => /^grok/i.test(id) && !/voice|image|imagine|video|vision|tts|stt|speech|embed|transcri|code|build/i.test(id));
  const version = (id: string) => Number(/grok-(\d+(?:\.\d+)?)/i.exec(id)?.[1] ?? 0);
  const rank = (id: string) => (/non-reasoning/i.test(id) ? 2 : /fast|mini/i.test(id) ? 1 : 0);
  return usable.sort((a, b) => rank(b) - rank(a) || version(b) - version(a) || a.localeCompare(b))[0];
}

/** Reads an ephemeral realtime token from the shapes xAI and OpenAI-compatible APIs return. */
export function tokenValue(data: unknown): string | undefined {
  const record = (data ?? {}) as Record<string, unknown>;
  const nested = (record.client_secret ?? {}) as Record<string, unknown>;
  for (const value of [record.value, nested.value, record.token, record.secret]) {
    if (typeof value === "string" && value) return value;
  }
  return undefined;
}
