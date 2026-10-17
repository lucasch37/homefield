import "server-only";
import { normalizeReport } from "./types";

export class ServiceError extends Error {
  constructor(message: string, public status = 502) { super(message); }
}
export async function getReport(address: string) {
  const backend = process.env.BACKEND_URL;
  if (!backend) throw new ServiceError("The report service isn’t connected yet. Please try again once the data service is available.", 503);
  const url = new URL(`${backend.replace(/\/$/, "")}/hazards`);
  url.searchParams.set("address", address);
  let response: Response;
  try { response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(9000) }); }
  catch { throw new ServiceError("The report service took too long or couldn’t be reached. Please try again.", 504); }
  if (response.status === 404) throw new ServiceError("We couldn’t find that address. Try including the city and ZIP code.", 404);
  if (!response.ok) throw new ServiceError("The report service is unavailable right now. Please try again.");
  try { return normalizeReport(await response.json()); }
  catch { throw new ServiceError("The report service returned an incomplete response. Please try again."); }
}
