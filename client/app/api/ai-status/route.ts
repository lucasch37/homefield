import { connection } from "next/server";
import { checkXai } from "@/lib/xai";

// Tells the page whether Grok is reachable, and if not, why (never exposes the key).
export async function GET() {
  // Run per request: a build-time copy would report on the build machine's environment, not the server's.
  await connection();
  return Response.json(await checkXai(), { headers: { "Cache-Control": "no-store" } });
}
