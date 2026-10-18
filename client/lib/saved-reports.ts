export type SavedReport = {
  address: string;
  query: string;
  summary: string;
  savedAt: string;
};

const PREFIX = "homefield_report_";
const MAX_REPORTS = 20;
const YEAR = 60 * 60 * 24 * 365;

function key(address: string): string {
  // Stable, short cookie names keep address text out of the cookie name.
  let hash = 2166136261;
  for (const character of address.trim().toLowerCase()) {
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  }
  return `${PREFIX}${(hash >>> 0).toString(36)}`;
}

function parseCookie(value: string): SavedReport | null {
  try {
    const item = JSON.parse(decodeURIComponent(value)) as Partial<SavedReport>;
    if (
      typeof item.address !== "string" || !item.address ||
      typeof item.query !== "string" || !item.query ||
      typeof item.summary !== "string" || !item.summary ||
      typeof item.savedAt !== "string" || Number.isNaN(Date.parse(item.savedAt))
    ) return null;
    return { address: item.address, query: item.query, summary: item.summary, savedAt: item.savedAt };
  } catch {
    return null;
  }
}

export function readSavedReports(cookieString = document.cookie): SavedReport[] {
  return cookieString.split(/;\s*/).flatMap((part) => {
    const separator = part.indexOf("=");
    if (separator < 0 || !part.slice(0, separator).startsWith(PREFIX)) return [];
    const report = parseCookie(part.slice(separator + 1));
    return report ? [report] : [];
  }).sort((a, b) => Date.parse(b.savedAt) - Date.parse(a.savedAt));
}

export function saveReport(item: SavedReport): void {
  const name = key(item.address);
  const value = encodeURIComponent(JSON.stringify(item));
  document.cookie = `${name}=${value}; Path=/; Max-Age=${YEAR}; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;

  const saved = readSavedReports();
  for (const old of saved.slice(MAX_REPORTS)) {
    document.cookie = `${key(old.address)}=; Path=/; Max-Age=0; SameSite=Lax`;
  }
}
