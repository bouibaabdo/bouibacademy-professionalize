import { createServerFn } from "@tanstack/react-start";

/**
 * Aggregated live-sports stream discovery.
 *
 * Sources (in order of trust):
 *   1. streamed.pk  — free public API, updated daily, multi-source per match.
 *   2. embedsports.top — fuzzy fallback based on team names.
 *
 * We deliberately keep this server-side so browsers never hit the third-party
 * APIs directly (avoids CORS + rate-limit issues on the client).
 */

export interface LiveStreamSource {
  embedUrl: string;
  source: string;
  hd?: boolean;
  language?: string;
  viewers?: number;
}

interface StreamedMatch {
  id: string;
  title: string;
  date: number;
  teams?: { home?: { name?: string }; away?: { name?: string } };
  sources?: { source: string; id: string }[];
}

interface StreamedStream {
  id: string;
  streamNo: number;
  language?: string;
  hd?: boolean;
  embedUrl?: string;
  source: string;
  viewers?: number;
}

/** Rough Arabic → Latin team-name normalization for fuzzy matching. */
const AR_TO_LATIN: Record<string, string> = {
  "فرنسا": "france",
  "اسبانيا": "spain",
  "إسبانيا": "spain",
  "المغرب": "morocco",
  "الجزائر": "algeria",
  "مصر": "egypt",
  "تونس": "tunisia",
  "السعودية": "saudi",
  "قطر": "qatar",
  "المانيا": "germany",
  "ألمانيا": "germany",
  "إنجلترا": "england",
  "انجلترا": "england",
  "الأرجنتين": "argentina",
  "الارجنتين": "argentina",
  "البرازيل": "brazil",
  "البرتغال": "portugal",
  "ايطاليا": "italy",
  "إيطاليا": "italy",
  "هولندا": "netherlands",
  "بلجيكا": "belgium",
  "كرواتيا": "croatia",
  "الاوروغواي": "uruguay",
  "الأوروغواي": "uruguay",
  "المكسيك": "mexico",
  "امريكا": "usa",
  "أمريكا": "usa",
  "كندا": "canada",
  "اليابان": "japan",
  "كوريا": "korea",
  "السنغال": "senegal",
  "غانا": "ghana",
  "الكاميرون": "cameroon",
  "نيجيريا": "nigeria",
  "الاكوادور": "ecuador",
  "الإكوادور": "ecuador",
  "كولومبيا": "colombia",
  "تشيلي": "chile",
  "بيرو": "peru",
  "باراغواي": "paraguay",
  "استراليا": "australia",
  "أستراليا": "australia",
  "ايران": "iran",
  "إيران": "iran",
  "العراق": "iraq",
  "الامارات": "uae",
  "الإمارات": "uae",
  "الكويت": "kuwait",
  "الاردن": "jordan",
  "الأردن": "jordan",
  "لبنان": "lebanon",
  "سوريا": "syria",
  "فلسطين": "palestine",
  "ليبيا": "libya",
  "السودان": "sudan",
  "موريتانيا": "mauritania",
  "اليمن": "yemen",
  "عمان": "oman",
  "البحرين": "bahrain",
};

function normalize(name: string): string {
  const trimmed = name
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/(منتخب|نادي|فريق|المنتخب)/g, "")
    .trim();
  const latin = AR_TO_LATIN[trimmed] ?? trimmed;
  return latin
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u0600-\u06FF]/g, "");
}

function teamsMatch(needleHome: string, needleAway: string, m: StreamedMatch): boolean {
  const h = normalize(m.teams?.home?.name || "");
  const a = normalize(m.teams?.away?.name || "");
  const nh = normalize(needleHome);
  const na = normalize(needleAway);
  const eq = (x: string, y: string) =>
    !!x && !!y && (x === y || (x.length >= 3 && y.length >= 3 && (x.includes(y) || y.includes(x))));
  return (eq(nh, h) && eq(na, a)) || (eq(nh, a) && eq(na, h));
}

// In-memory caches (per Worker instance).
let matchesCache: { at: number; data: StreamedMatch[] } | null = null;
const MATCHES_TTL = 60_000;
const streamCache = new Map<string, { at: number; data: StreamedStream[] }>();
const STREAM_TTL = 60_000;

async function fetchStreamedMatches(): Promise<StreamedMatch[]> {
  if (matchesCache && Date.now() - matchesCache.at < MATCHES_TTL) return matchesCache.data;
  try {
    const res = await fetch("https://streamed.pk/api/matches/football", {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as StreamedMatch[];
    matchesCache = { at: Date.now(), data };
    return data;
  } catch {
    return [];
  }
}

async function fetchStreamedSources(source: string, id: string): Promise<StreamedStream[]> {
  const key = `${source}/${id}`;
  const cached = streamCache.get(key);
  if (cached && Date.now() - cached.at < STREAM_TTL) return cached.data;
  try {
    const res = await fetch(
      `https://streamed.pk/api/stream/${encodeURIComponent(source)}/${encodeURIComponent(id)}`,
      { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as StreamedStream[];
    streamCache.set(key, { at: Date.now(), data });
    return data;
  } catch {
    return [];
  }
}

export const getLiveStreamsFor = createServerFn({ method: "GET" })
  .inputValidator((input: { home: string; away: string }) => ({
    home: String(input?.home ?? "").slice(0, 80),
    away: String(input?.away ?? "").slice(0, 80),
  }))
  .handler(async ({ data }) => {
    const { home, away } = data;
    if (!home || !away) return { sources: [] as LiveStreamSource[] };

    const matches = await fetchStreamedMatches();
    const hits = matches.filter((m) => teamsMatch(home, away, m));
    if (!hits.length) return { sources: [] as LiveStreamSource[] };

    const collected: LiveStreamSource[] = [];
    // Fetch stream lists in parallel across all matched entries × their sources.
    const tasks: Promise<StreamedStream[]>[] = [];
    for (const m of hits) {
      for (const s of m.sources ?? []) {
        tasks.push(fetchStreamedSources(s.source, s.id));
      }
    }
    const results = await Promise.all(tasks);
    for (const list of results) {
      for (const s of list) {
        if (!s.embedUrl) continue;
        collected.push({
          embedUrl: s.embedUrl,
          source: `streamed·${s.source}·${s.streamNo}`,
          hd: s.hd,
          language: s.language,
          viewers: s.viewers,
        });
      }
    }
    // Deduplicate by URL, keep the first occurrence (usually highest quality).
    const seen = new Set<string>();
    const unique = collected.filter((s) => {
      if (seen.has(s.embedUrl)) return false;
      seen.add(s.embedUrl);
      return true;
    });
    return { sources: unique };
  });
