import "server-only";

// xAI endpoints. The API key is only ever read here, on the server. XAI_BASE_URL and XAI_REALTIME_URL
// exist so local tests can point at a stand-in; production leaves them unset.

export const xaiApiKey = () => process.env.XAI_API_KEY?.trim() || undefined;

export const xaiBaseUrl = () => (process.env.XAI_BASE_URL?.trim() || "https://api.x.ai/v1").replace(/\/$/, "");

export const xaiTextModel = () => process.env.XAI_TEXT_MODEL?.trim() || "grok-4.7";

/** The realtime WebSocket the browser opens with its ephemeral token. */
export const xaiRealtimeUrl = () =>
  process.env.XAI_REALTIME_URL?.trim() || "wss://api.x.ai/v1/realtime?model=grok-voice-latest";

/** Only our own pages may spend the account's credits (blocks cross-site token minting). */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  try {
    return !!host && new URL(origin).host === host;
  } catch {
    return false;
  }
}
