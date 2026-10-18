import "server-only";
import { normalizeReport } from "./types";

export class ServiceError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.status = status;
  }
}

export type ReportQuery = { address: string } | { lat: number; lon: number };

function upstreamMessage(value: unknown) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
  const detail = (value as Record<string, unknown>).detail;
  return typeof detail === "string" && detail.length <= 500 ? detail : undefined;
}

/** Calls FastAPI GET /hazards. The backend URL stays on the server. */
export async function getReport(query: ReportQuery) {
  const backend = process.env.BACKEND_URL || (process.env.NODE_ENV === "development" ? "http://127.0.0.1:8000" : undefined);
  if (!backend) throw new ServiceError("The report service isn’t connected yet. Please try again once the data service is available.", 503);
  let url: URL;
  try { url = new URL("hazards", `${backend.replace(/\/$/, "")}/`); }
  catch { throw new ServiceError("The report service is not configured correctly.", 503); }
  if ("address" in query) url.searchParams.set("address", query.address);
  else {
    url.searchParams.set("lat", String(query.lat));
    url.searchParams.set("lon", String(query.lon));
  }
  let response: Response;
  try { response = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" }, signal: AbortSignal.timeout(9000) }); }
  catch { throw new ServiceError("The report service took too long or couldn’t be reached. Please try again.", 504); }
  let body: unknown;
  try { body = await response.json(); }
  catch { throw new ServiceError("The report service returned an unreadable response. Please try again."); }
  if (!response.ok) {
    const message = upstreamMessage(body);
    if (response.status === 404) throw new ServiceError(message || "We couldn’t find that address. Try including the city and ZIP code.", 404);
    if (response.status === 422) throw new ServiceError("Enter a complete street address, city, and ZIP code.", 422);
    if (response.status === 502 || response.status === 504) throw new ServiceError(message || "The address service is unavailable right now. Please try again.", response.status);
    throw new ServiceError("The report service is unavailable right now. Please try again.");
  }
  try { return normalizeReport(body); }
  catch { throw new ServiceError("The report service returned an incomplete response. Please try again."); }
}
