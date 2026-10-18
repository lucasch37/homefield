export async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, cache: "no-store" });
  let data;
  try { data = await response.json(); } catch { throw new Error("The service returned an unreadable response. Please try again."); }
  if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "We couldn’t complete the request. Please try again.");
  return data as T;
}
