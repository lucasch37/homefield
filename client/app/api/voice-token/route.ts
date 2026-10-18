import { isSameOrigin, xaiApiKey, xaiBaseUrl, xaiRealtimeUrl } from "@/lib/xai";

// Mints a short-lived xAI realtime token so the browser can open the Grok Voice WebSocket
// without ever seeing XAI_API_KEY.
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Forbidden" }, { status: 403 });
  const apiKey = xaiApiKey();
  if (!apiKey)
    return Response.json(
      {
        error:
          "Voice isn’t connected yet. The observation cards have everything currently available for this address.",
      },
      { status: 503 },
    );
  try {
    const response = await fetch(`${xaiBaseUrl()}/realtime/client_secrets`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expires_after: { seconds: 300 } }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      console.warn(`[api/voice-token] xAI token request failed with HTTP ${response.status}`);
      throw new Error("Token unavailable");
    }
    const data = await response.json();
    if (typeof data?.value !== "string" || !data.value) throw new Error("Invalid token");
    return Response.json(
      { value: data.value, url: xaiRealtimeUrl() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "We couldn’t connect voice. Please try again." },
      { status: 502 },
    );
  }
}
