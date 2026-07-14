// Client helpers for SportSRC free sports stream API (used by tv.bouibacademy.me).
// Docs: https://sportsrc.org — CORS-enabled, no auth key.

const API = "https://api.sportsrc.org";

export type SRCTeam = { name: string; badge?: string };
export type SRCMatch = {
  id: string;
  title: string;
  category: string;
  date: number; // ms timestamp
  popular?: boolean;
  poster?: string;
  teams: { home: SRCTeam; away: SRCTeam };
};

export type SRCSource = {
  source: string;
  id: string;
  streamNo: number;
  embedUrl?: string;
  url?: string;
  iframe?: string;
  src?: string;
  href?: string;
  streamUrl?: string;
  embed?: string;
  hd?: boolean;
  viewers?: number;
  language?: string;
};

export type SRCDetail = {
  id: string;
  title: string;
  category: string;
  date: number;
  teams: { home: SRCTeam; away: SRCTeam };
  sources: SRCSource[];
};

function extractIframeSrc(value: string) {
  const match = value.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  return match?.[1] || value;
}

function safeHttpUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const raw = extractIframeSrc(value.trim());
  try {
    const url = new URL(raw);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function embedUrl(s: SRCSource) {
  return (
    safeHttpUrl(s.embedUrl) ||
    safeHttpUrl(s.url) ||
    safeHttpUrl(s.iframe) ||
    safeHttpUrl(s.src) ||
    safeHttpUrl(s.href) ||
    safeHttpUrl(s.streamUrl) ||
    safeHttpUrl(s.embed) ||
    `https://embed.st/embed/${encodeURIComponent(s.source)}/${encodeURIComponent(s.id)}/${encodeURIComponent(String(s.streamNo))}`
  );
}

/** Normalize team names for fuzzy matching. */
function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(fc|national|team|the|of|and|&|republic|rep\.?)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Common aliases between TheSportsDB and SportSRC/broadcaster naming.
const ALIASES: Record<string, string[]> = {
  "united states": ["usa", "us", "united states"],
  usa: ["united states", "usa"],
  "south korea": ["korea republic", "korea south", "south korea"],
  "korea republic": ["south korea", "korea republic"],
  "north korea": ["korea dpr", "korea north"],
  "ivory coast": ["cote d ivoire", "cote divoire"],
  "cote d ivoire": ["ivory coast"],
  "czech republic": ["czechia"],
  "cape verde": ["cabo verde"],
  "dr congo": ["congo dr", "democratic republic congo"],
};

function candidates(name: string): string[] {
  const n = norm(name);
  const set = new Set<string>([n]);
  (ALIASES[n] || []).forEach((a) => set.add(norm(a)));
  return [...set];
}

function teamsMatch(home: string, away: string, m: SRCMatch): boolean {
  const H = candidates(home);
  const A = candidates(away);
  const mh = norm(m.teams.home.name);
  const ma = norm(m.teams.away.name);
  const eq = (a: string, b: string) =>
    a === b || (a.length >= 3 && b.length >= 3 && (a.includes(b) || b.includes(a)));
  const straight = H.some((h) => eq(h, mh)) && A.some((a) => eq(a, ma));
  const swapped = H.some((h) => eq(h, ma)) && A.some((a) => eq(a, mh));
  return straight || swapped;
}

let matchesCache: { at: number; data: SRCMatch[] } | null = null;
const CACHE_MS = 60_000;

export async function fetchFootballMatches(): Promise<SRCMatch[]> {
  if (matchesCache && Date.now() - matchesCache.at < CACHE_MS) return matchesCache.data;
  const r = await fetch(`${API}/?data=matches&category=football`, {
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const j = await r.json();
  const data: SRCMatch[] = j?.success && Array.isArray(j.data) ? j.data : [];
  matchesCache = { at: Date.now(), data };
  return data;
}

/** Find a SportSRC match by team names + kickoff proximity (± 3 h). */
export function findMatch(
  matches: SRCMatch[],
  home: string,
  away: string,
  kickoffIso: string,
): SRCMatch | null {
  const t = new Date(kickoffIso).getTime();
  const nearby = matches.filter((m) => Math.abs(m.date - t) < 3 * 3600_000);
  const pool = nearby.length ? nearby : matches;
  const hit = pool.find((m) => teamsMatch(home, away, m));
  return hit || null;
}

export async function fetchMatchDetail(id: string): Promise<SRCDetail | null> {
  const r = await fetch(`${API}/?data=detail&category=football&id=${encodeURIComponent(id)}`, {
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const j = await r.json();
  if (!j?.success || !j.data) return null;
  return j.data as SRCDetail;
}
