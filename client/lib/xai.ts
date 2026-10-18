import "server-only";
import { classifyXaiStatus, pickTextModel, XAI_PROBLEM_MESSAGES, type XaiProblem } from "./xai-shared";

// xAI endpoints. The API key is only ever read here, on the server. XAI_BASE_URL and XAI_REALTIME_URL
// exist so local tests can point at a stand-in; production leaves them unset.

export const xaiApiKey = () => process.env.XAI_API_KEY?.trim().replace(/^Bearer\s+/i, "") || undefined;

export const xaiBaseUrl = () => (process.env.XAI_BASE_URL?.trim() || "https://api.x.ai/v1").replace(/\/$/, "");

export const xaiTextModel = () => process.env.XAI_TEXT_MODEL?.trim() || "grok-4.7";

/** The realtime WebSocket the browser opens with its ephemeral token. */
export const xaiRealtimeUrl = () =>
  process.env.XAI_REALTIME_URL?.trim() || "wss://api.x.ai/v1/realtime?model=grok-voice-latest";

/** Only our own pages may spend the account's credits (blocks cross-site token minting). */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const hosts = [request.headers.get("x-forwarded-host"), request.headers.get("host")].filter(Boolean);
  try {
    return hosts.includes(new URL(origin).host);
  } catch {
    return false;
  }
}

export type XaiStatus = { connected: boolean; problem?: XaiProblem; message?: string; model?: string };

let cachedModels: { at: number; ids: string[] } | null = null;

/** Lists the account's models (cached 10 minutes). Throws an XaiProblem string on failure. */
export async function listModels(apiKey: string): Promise<string[]> {
  if (cachedModels && Date.now() - cachedModels.at < 600_000) return cachedModels.ids;
  let response: Response;
  try {
    response = await fetch(`${xaiBaseUrl()}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw "unreachable" satisfies XaiProblem;
  }
  if (!response.ok) throw classifyXaiStatus(response.status, await response.text().catch(() => ""));
  const data = await response.json().catch(() => ({}));
  const ids = Array.isArray(data?.data) ? data.data.map((m: { id?: unknown }) => m?.id).filter((id: unknown): id is string => typeof id === "string") : [];
  cachedModels = { at: Date.now(), ids };
  return ids;
}

/** A text model this account can use: the configured one if listed, otherwise the best available Grok model. */
export async function resolveTextModel(apiKey: string): Promise<string> {
  const configured = xaiTextModel();
  try {
    const ids = await listModels(apiKey);
    return pickTextModel(ids, configured) ?? configured;
  } catch {
    return configured;
  }
}

/** Checks the key against xAI so the UI can say exactly why Grok isn't connected. */
export async function checkXai(): Promise<XaiStatus> {
  const apiKey = xaiApiKey();
  if (!apiKey) return { connected: false, problem: "missing_key", message: XAI_PROBLEM_MESSAGES.missing_key };
  let reason: XaiProblem;
  try {
    const ids = await listModels(apiKey);
    return { connected: true, model: pickTextModel(ids, xaiTextModel()) ?? xaiTextModel() };
  } catch (problem) {
    reason = (typeof problem === "string" ? problem : "unreachable") as XaiProblem;
  }
  // Keys can be limited to some endpoints; a one-token chat call settles whether the key works.
  if (reason !== "unreachable") {
    try {
      const response = await fetch(`${xaiBaseUrl()}/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: xaiTextModel(), max_tokens: 1, messages: [{ role: "user", content: "ok" }] }),
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      });
      if (response.ok) return { connected: true, model: xaiTextModel() };
      reason = classifyXaiStatus(response.status, await response.text().catch(() => ""));
    } catch {
      reason = "unreachable";
    }
  }
  console.warn(`[xai] status check failed: ${reason}`);
  return { connected: false, problem: reason, message: XAI_PROBLEM_MESSAGES[reason] };
}
