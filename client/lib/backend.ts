import "server-only";
import { normalizeReport } from "./types";

export class ServiceError extends Error {
  constructor(message: string, public status = 502) { super(message); }
}

function upstreamMessage(value: unknown) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
  const detail = (value as Record<string, unknown>).detail;
  return typeof detail === "string" && detail.length <= 500 ? detail : undefined;
}

// The geocoder can't place a bare street address ("16575 NE 120th Way"), but every address
// we cover is in Washington, so one retry with the state usually finds it.
const hasState = (address: string) => /\b(wa|washington)\b/i.test(address);

export async function getReport(address: string) {
  try {
    return await requestReport(address);
  } catch (error) {
    if (error instanceof ServiceError && error.status === 404 && !hasState(address)) return requestReport(`${address}, WA`);
    throw error;
  }
}

async function requestReport(address: string) {
  const backend = process.env.BACKEND_URL || (process.env.NODE_ENV === "development" ? "http://127.0.0.1:8000" : undefined);
  if (!backend) throw new ServiceError("The report service isn’t connected yet. Please try again once the data service is available.", 503);
  let url: URL;
  try { url = new URL("hazards", `${backend.replace(/\/$/, "")}/`); }
  catch { throw new ServiceError("The report service is not configured correctly.", 503); }
  url.searchParams.set("address", address);
  let response: Response;
  try { response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(9000) }); }
  catch (error) {
    const unreachable = process.env.NODE_ENV === "development" && !(error instanceof DOMException && error.name === "TimeoutError");
    throw new ServiceError(unreachable ? `The backend at ${backend} isn’t running. Start it from server/ with: DATA_DIR=./data .venv/bin/uvicorn app.main:app --reload --port 8000` : "The report service took too long or couldn’t be reached. Please try again.", 504);
  }
  let body: unknown;
  try { body = await response.json(); }
  catch { throw new ServiceError("The report service returned an unreadable response. Please try again."); }
  if (!response.ok) {
    const message = upstreamMessage(body);
    if (response.status === 404) throw new ServiceError(message || "We couldn’t find that address. Try including the city and ZIP code.", 404);
    if (response.status === 422) throw new ServiceError(message || "Enter a complete street address, city, and ZIP code.", 422);
    if (response.status === 502 || response.status === 504) throw new ServiceError(message || "The address service is unavailable right now. Please try again.", response.status);
    throw new ServiceError("The report service is unavailable right now. Please try again.");
  }
  try { return normalizeReport(body); }
  catch { throw new ServiceError("The report service returned an incomplete response. Please try again."); }
}
