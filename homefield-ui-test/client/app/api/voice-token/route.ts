export async function POST() {
  if (!process.env.XAI_API_KEY)
    return Response.json(
      {
        error:
          "Voice isn’t connected yet. The observation cards have everything currently available for this address.",
      },
      { status: 503 },
    );
  try {
    const response = await fetch(
      "https://api.x.ai/v1/realtime/client_secrets",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.XAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ expires_after: { seconds: 300 } }),
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!response.ok) throw new Error("Token unavailable");
    const data = await response.json();
    if (typeof data.value !== "string") throw new Error("Invalid token");
    return Response.json(
      { value: data.value },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "We couldn’t connect voice. Please try again." },
      { status: 502 },
    );
  }
}
