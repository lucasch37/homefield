import { connection } from "next/server";
import { checkGemini } from "@/lib/gemini";
import { checkXai } from "@/lib/xai";

// Tells the page whether Grok Voice (xAI) and the Gemini summary are reachable, and if not, why.
// Never exposes a key.
export async function GET() {
  // Run per request: a build-time copy would report on the build machine's environment, not the server's.
  await connection();
  const [voice, summary] = await Promise.all([checkXai(), checkGemini()]);
  return Response.json({ voice, summary }, { headers: { "Cache-Control": "no-store" } });
}
