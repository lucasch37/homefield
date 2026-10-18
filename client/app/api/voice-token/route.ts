import { isSameOrigin, xaiApiKey, xaiBaseUrl, xaiRealtimeUrl } from "@/lib/xai";
import { classifyXaiStatus, tokenValue, XAI_PROBLEM_MESSAGES } from "@/lib/xai-shared";

// Mints a short-lived xAI realtime token so the browser can open the Grok Voice WebSocket
// without ever seeing XAI_API_KEY.
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Forbidden" }, { status: 403 });
  const apiKey = xaiApiKey();
  if (!apiKey) return Response.json({ error: XAI_PROBLEM_MESSAGES.missing_key, problem: "missing_key" }, { status: 503 });
  let response: Response;
  try {
    response = await fetch(`${xaiBaseUrl()}/realtime/client_secrets`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ expires_after: { seconds: 300 } }),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    console.warn("[api/voice-token] could not reach xAI");
    return Response.json({ error: XAI_PROBLEM_MESSAGES.unreachable, problem: "unreachable" }, { status: 502 });
  }
  if (!response.ok) {
    const problem = classifyXaiStatus(response.status, await response.text().catch(() => ""));
    console.warn(`[api/voice-token] xAI token request failed with HTTP ${response.status} (${problem})`);
    return Response.json({ error: XAI_PROBLEM_MESSAGES[problem], problem }, { status: 502 });
  }
  const value = tokenValue(await response.json().catch(() => null));
  if (!value) {
    console.warn("[api/voice-token] xAI token response had no token value");
    return Response.json({ error: XAI_PROBLEM_MESSAGES.upstream_error, problem: "upstream_error" }, { status: 502 });
  }
  return Response.json({ value, url: xaiRealtimeUrl() }, { headers: { "Cache-Control": "no-store" } });
}
