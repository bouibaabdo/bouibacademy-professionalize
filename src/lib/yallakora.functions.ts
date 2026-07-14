import { createServerFn } from "@tanstack/react-start";
import { parse, type HTMLElement } from "node-html-parser";

const BASE = "https://www.yallakora.com";

export interface YKMatch {
  id: string;
  home: string;
  away: string;
  homeBadge?: string;
  awayBadge?: string;
  time: string; // e.g. "22:00"
  homeScore: number | null;
  awayScore: number | null;
  status: string; // نصّ: لم تبدأ / انتهت / الشوط الأول / مباشر...
  live: boolean;
  finished: boolean;
  channel?: string;
  commentator?: string;
  league?: string;
  matchUrl: string; // صفحة المباراة على يلا كورة
  day: "yesterday" | "today" | "tomorrow";
}

function fmtDate(d: Date): string {
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

function urlFor(day: YKMatch["day"]): string {
  const now = new Date();
  const offset = day === "yesterday" ? -1 : day === "tomorrow" ? 1 : 0;
  const target = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offset),
  );
  return `${BASE}/match-center?date=${encodeURIComponent(fmtDate(target))}`;
}

function textOf(el: HTMLElement | null | undefined): string {
  return (el?.text || "").replace(/\s+/g, " ").trim();
}

function imgOf(el: HTMLElement | null | undefined): string | undefined {
  const img = el?.querySelector("img");
  const src = img?.getAttribute("src") || img?.getAttribute("data-src");
  if (!src) return undefined;
  // The site uses back-slashes in some team logo paths — leave as-is (browser handles them).
  return src.startsWith("http") ? src : undefined;
}

function classifyStatus(itemClass: string, status: string): { live: boolean; finished: boolean } {
  const cls = itemClass.toLowerCase();
  const s = status;
  const finished = cls.includes("finish") || /انتهت|انتهى/.test(s);
  const live =
    !finished &&
    (cls.includes("live") ||
      /مباشر|جاري|جارية|الشوط\s*الأول|الشوط\s*الثاني|استراحة|الوقت\s*بدل\s*الضائع|الوقت\s*الإضافي/.test(
        s,
      ));
  return { live, finished };
}

function parseMatchItem(
  item: HTMLElement,
  league: string | undefined,
  day: YKMatch["day"],
): YKMatch | null {
  const link = item.querySelector("a[href]");
  const href = link?.getAttribute("href") || "";
  const idAttr = item.getAttribute("liveScoreMatchId") || item.getAttribute("livescorematchid");
  const id = idAttr || href.match(/\/match\/(\d+)/)?.[1] || "";
  if (!id) return null;

  const teamA = item.querySelector(".teams.teamA, .teamA");
  const teamB = item.querySelector(".teams.teamB, .teamB");
  const home =
    textOf(teamA?.querySelector("p")) || teamA?.querySelector("img")?.getAttribute("alt") || "";
  const away =
    textOf(teamB?.querySelector("p")) || teamB?.querySelector("img")?.getAttribute("alt") || "";
  if (!home || !away) return null;

  const scoreEls = item.querySelectorAll(".MResult .score, .teamResult .score");
  const homeScoreRaw = textOf(scoreEls[0]);
  const awayScoreRaw = textOf(scoreEls[1]);
  const homeScore = /^\d+$/.test(homeScoreRaw) ? Number(homeScoreRaw) : null;
  const awayScore = /^\d+$/.test(awayScoreRaw) ? Number(awayScoreRaw) : null;

  const time = textOf(item.querySelector(".MResult .time, .teamResult .time, .time"));
  const status = textOf(item.querySelector(".matchStatus span, .matchStatus"));
  const channel = textOf(item.querySelector(".channel")) || undefined;
  const roundLabel = textOf(item.querySelector(".date")) || undefined;

  const { live, finished } = classifyStatus(item.getAttribute("class") || "", status);

  const matchUrl = href.startsWith("http") ? href : `${BASE}${href}`.split("#")[0];

  return {
    id,
    home,
    away,
    homeBadge: imgOf(teamA),
    awayBadge: imgOf(teamB),
    time,
    homeScore,
    awayScore,
    status: status || (finished ? "انتهت" : live ? "مباشر" : "لم تبدأ"),
    live,
    finished,
    channel,
    league: roundLabel
      ? `${league ?? ""}${league && roundLabel ? " · " : ""}${roundLabel}`
      : league,
    matchUrl,
    day,
  };
}

async function scrape(day: YKMatch["day"]): Promise<YKMatch[]> {
  const res = await fetch(urlFor(day), {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; BouibAcademyBot/1.0; +https://edu.bouibacademy.me)",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "ar,en;q=0.8",
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) return [];
  const html = await res.text();
  const root = parse(html);

  const matches: YKMatch[] = [];
  // Each tour block groups its matches
  const tourBlocks = root.querySelectorAll(".matchCard");
  if (tourBlocks.length === 0) {
    // Fallback: parse any match items directly
    for (const item of root.querySelectorAll("[liveScoreMatchId], [livescorematchid]")) {
      const m = parseMatchItem(item, undefined, day);
      if (m) matches.push(m);
    }
    return matches;
  }

  for (const tour of tourBlocks) {
    const league = textOf(tour.querySelector(".tourTitle h2, .tourTitle")) || undefined;
    const items = tour.querySelectorAll("[liveScoreMatchId], [livescorematchid], .item.liItem");
    for (const item of items) {
      const m = parseMatchItem(item, league, day);
      if (m) matches.push(m);
    }
  }

  // De-dup by id (a match can appear in multiple tour listings)
  const seen = new Set<string>();
  return matches.filter((m) => (seen.has(m.id) ? false : (seen.add(m.id), true)));
}

export const getYallakoraMatches = createServerFn({ method: "GET" }).handler(async () => {
  const [yesterday, today, tomorrow] = await Promise.all([
    scrape("yesterday").catch(() => []),
    scrape("today").catch(() => []),
    scrape("tomorrow").catch(() => []),
  ]);
  return { yesterday, today, tomorrow, fetchedAt: new Date().toISOString() };
});
