import { createServerFn } from "@tanstack/react-start";
import { parse } from "node-html-parser";

const BASE = "https://yalladown.net";

export interface YDMatch {
  id: string;
  home: string;
  away: string;
  time: string;
  status: string;
  live: boolean;
  finished: boolean;
  homeBadge?: string;
  awayBadge?: string;
  channel?: string;
  league?: string;
  streamUrls: string[]; // candidate embed URLs
  pageUrl?: string;
  day: "yesterday" | "today" | "tomorrow";
}

const PAGES: Record<YDMatch["day"], string> = {
  yesterday: `${BASE}/matches-yesterday/`,
  today: `${BASE}/matches-today/`,
  tomorrow: `${BASE}/matches-tomorrow/`,
};

function cleanUrl(value: string | undefined, base = BASE): string | undefined {
  if (!value) return undefined;
  const decoded = value.replace(/&amp;|&#038;/g, "&").trim();
  try {
    const u = new URL(decoded, base);
    return ["http:", "https:"].includes(u.protocol) ? u.toString() : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Map an Arabic channel name (e.g. "beIN SPORTS MAX 1", "SSC 2") to a list of
 * candidate embed URLs across multiple providers. The stream modal cycles
 * through them automatically if one fails.
 */
function channelPlayerUrls(channel: string): string[] {
  const normalized = channel
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .toLowerCase();
  const urls: string[] = [];
  const max = normalized.match(/(?:bein\s*)?(?:sports\s*)?max\s*(?:hd\s*)?(\d+)/i);
  if (max?.[1]) {
    const n = max[1];
    urls.push(
      `https://topx.poiy.online/albaplayer/max${n}/`,
      `https://embedsports.top/embed/alpha/beinmax${n}/1`,
      `https://embedsports.me/embed/alpha/beinmax${n}/1`,
      `https://embedsports.top/embed/bravo/beinmax${n}/1`,
      `https://weblivehdplay.ru/?player=desktop&live=beinmax${n}`,
    );
    return urls;
  }
  const xtra = normalized.match(/(?:bein\s*)?xtra\s*(\d+)/i);
  if (xtra?.[1]) {
    const n = xtra[1];
    urls.push(
      `https://topx.poiy.online/albaplayer/xtra${n}/`,
      `https://embedsports.top/embed/alpha/beinxtra${n}/1`,
    );
    return urls;
  }
  const bein = normalized.match(/bein\s*(?:sports?\s*)?(?:hd\s*)?(\d+)/i);
  if (bein?.[1]) {
    const n = bein[1];
    urls.push(
      `https://topx.poiy.online/albaplayer/bein${n}/`,
      `https://embedsports.top/embed/alpha/beinsports${n}/1`,
    );
    return urls;
  }
  const ssc = normalized.match(/ssc\s*(?:hd\s*)?(\d+)/i);
  if (ssc?.[1]) {
    const n = ssc[1];
    urls.push(
      `https://topx.poiy.online/albaplayer/ssc${n}/`,
      `https://embedsports.top/embed/alpha/ssc${n}/1`,
    );
  }
  return urls;
}

function extractIframeUrls(html: string, baseUrl: string): string[] {
  const root = parse(html);
  const iframes = root
    .querySelectorAll("iframe[src]")
    .map((el) => cleanUrl(el.getAttribute("src"), baseUrl))
    .filter(Boolean) as string[];
  return Array.from(new Set(iframes));
}

async function resolvePageIframes(pageUrl: string): Promise<string[]> {
  try {
    const res = await fetch(pageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; BouibAcademyBot/1.0; +https://www.bouibacademy.me)",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "ar,en;q=0.8",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    return extractIframeUrls(await res.text(), pageUrl);
  } catch {
    return [];
  }
}

function parseCard(html: string, day: YDMatch["day"]): YDMatch | null {
  const normalized = html.replace(/=\s*'([^']*)'/g, '="$1"');
  const root = parse(`<div>${normalized}</div>`);
  const teams = root.querySelectorAll(".MT_Team");
  const t1 = teams.find((t) => (t.getAttribute("class") || "").includes("TM1"));
  const t2 = teams.find((t) => (t.getAttribute("class") || "").includes("TM2"));
  if (!t1 || !t2) return null;
  const home = t1.querySelector(".TM_Name")?.text.trim() || "";
  const away = t2.querySelector(".TM_Name")?.text.trim() || "";
  if (!home || !away) return null;
  const homeImg = t1.querySelector("img");
  const awayImg = t2.querySelector("img");
  const homeBadge =
    cleanUrl(homeImg?.getAttribute("data-src") || homeImg?.getAttribute("src"));
  const awayBadge =
    cleanUrl(awayImg?.getAttribute("data-src") || awayImg?.getAttribute("src"));
  const time = root.querySelector(".MT_Time")?.text.trim() || "";
  const status = root.querySelector(".MT_Stat")?.text.trim() || "";
  const infoItems = root.querySelectorAll(".MT_Info li span").map((s) => s.text.trim());
  const channel = infoItems[0];
  const league = infoItems[2];
  const finished = status.includes("انتهت");
  const live =
    !finished &&
    (status.includes("جارية") || status.includes("مباشر") || /^\d+\s*'/.test(status));
  const href = root.querySelector("a[href]")?.getAttribute("href") || "";
  const pageUrl = cleanUrl(href);
  const isRealPage = pageUrl && !/^https?:\/\/[^/]+\/?$/.test(pageUrl);
  const streamUrls = channel ? channelPlayerUrls(channel) : [];
  const id = `${home}-${away}-${day}`.replace(/\s+/g, "-");
  return {
    id,
    home,
    away,
    time,
    status,
    live,
    finished,
    homeBadge,
    awayBadge,
    channel,
    league,
    streamUrls,
    pageUrl: isRealPage ? pageUrl : undefined,
    day,
  };
}

async function scrape(day: YDMatch["day"]): Promise<YDMatch[]> {
  const res = await fetch(PAGES[day], {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; BouibAcademyBot/1.0; +https://www.bouibacademy.me)",
      Accept: "text/html",
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) return [];
  const html = await res.text();
  const parts = html.split('<div class="AY_Match');
  const cards: YDMatch[] = [];
  for (let i = 1; i < parts.length; i++) {
    const chunk = '<div class="AY_Match' + parts[i].split('<div class="AY_Match')[0];
    const m = parseCard(chunk, day);
    if (m) cards.push(m);
  }
  // Enrich live/soon matches with iframe URLs from their match pages.
  return Promise.all(
    cards.map(async (card) => {
      if (!card.pageUrl) return card;
      if (card.finished) return card;
      const iframes = await resolvePageIframes(card.pageUrl);
      if (iframes.length) {
        return { ...card, streamUrls: [...iframes, ...card.streamUrls] };
      }
      return card;
    }),
  );
}

export const getYalladownMatches = createServerFn({ method: "GET" }).handler(async () => {
  const [yesterday, today, tomorrow] = await Promise.all([
    scrape("yesterday").catch(() => [] as YDMatch[]),
    scrape("today").catch(() => [] as YDMatch[]),
    scrape("tomorrow").catch(() => [] as YDMatch[]),
  ]);
  return { yesterday, today, tomorrow, fetchedAt: new Date().toISOString() };
});
