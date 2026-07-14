import { createServerFn } from "@tanstack/react-start";
import { parse } from "node-html-parser";

const BASE = "https://yallasellit.com";

export interface YSMatch {
  id: string;
  home: string;
  away: string;
  time: string;
  status: string;
  live: boolean;
  finished: boolean;
  streamUrl?: string; // primary embed URL (best-guess channel player)
  playerUrl?: string; // direct player/embed URL discovered from match page
  pageUrl?: string; // original match page URL as a fallback
  channelUrls?: string[]; // extra candidate channel URLs across providers
  channel?: string;
  day: "yesterday" | "today" | "tomorrow";
}

const PAGES: Record<YSMatch["day"], string> = {
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

function extractPlayerUrl(html: string, baseUrl: string): string | undefined {
  const root = parse(html);
  const iframes = root
    .querySelectorAll("iframe[src]")
    .map((iframe) => cleanUrl(iframe.getAttribute("src"), baseUrl))
    .filter(Boolean) as string[];

  const preferred = iframes.find((url) => /player|embed|stream|live|twitch\.tv|m3u8/i.test(url));
  if (preferred) return preferred;
  if (iframes[0]) return iframes[0];

  const sourceMatch = html.match(
    /(?:file|source|src)\s*[:=]\s*["']([^"']+(?:m3u8|embed|player|stream)[^"']*)["']/i,
  );
  return cleanUrl(sourceMatch?.[1], baseUrl);
}

/**
 * Return a list of candidate embed URLs for a given TV channel across
 * multiple known providers. The stream modal will auto-cycle through them
 * so a single dead provider doesn't leave the user with a black screen.
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

async function resolvePlayerUrl(pageUrl: string): Promise<string | undefined> {
  const res = await fetch(pageUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; BouibAcademyBot/1.0; +https://edu.bouibacademy.me)",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "ar,en;q=0.8",
    },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return undefined;
  return extractPlayerUrl(await res.text(), pageUrl);
}

function parseCard(html: string, day: YSMatch["day"]): YSMatch | null {
  const normalized = html.replace(/=\s*'([^']*)'/g, '="$1"');
  const root = parse(`<div>${normalized}</div>`);
  const teams = root.querySelectorAll(".MT_Team");
  const t1 = teams.find((t) => (t.getAttribute("class") || "").includes("TM1"));
  const t2 = teams.find((t) => (t.getAttribute("class") || "").includes("TM2"));
  if (!t1 || !t2) return null;
  const home = t1.querySelector(".TM_Name")?.text.trim() || "";
  const away = t2.querySelector(".TM_Name")?.text.trim() || "";
  if (!home || !away) return null;
  const time = root.querySelector(".MT_Time")?.text.trim() || "";
  const status = root.querySelector(".MT_Stat")?.text.trim() || "";
  const channel = root.querySelector(".MT_Info li:first-child span")?.text.trim() || undefined;
  const finished = status.includes("انتهت");
  const live =
    !finished && (status.includes("جارية") || status.includes("مباشر") || /^\d+\s*'/.test(status));
  const href = root.querySelector("a[href]")?.getAttribute("href") || "";

  // Keep the match page as a fallback, then enrich it with the real iframe URL
  // in `scrape()` so the app embeds the player instead of an ad-heavy page.
  const pageUrl = cleanUrl(href);
  const channelUrls = channel ? channelPlayerUrls(channel) : [];
  const streamUrl = channelUrls[0] || pageUrl;

  const id = `${home}-${away}-${day}`.replace(/\s+/g, "-");
  return {
    id,
    home,
    away,
    time,
    status,
    live,
    finished,
    streamUrl,
    pageUrl,
    channelUrls,
    channel,
    day,
  };
}

async function scrape(day: YSMatch["day"]): Promise<YSMatch[]> {
  const res = await fetch(PAGES[day], {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; BouibAcademyBot/1.0; +https://edu.bouibacademy.me)",
      Accept: "text/html",
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) return [];
  const html = await res.text();
  const parts = html.split('<div class="AY_Match');
  const cards: YSMatch[] = [];
  for (let i = 1; i < parts.length; i++) {
    const chunk = '<div class="AY_Match' + parts[i].split('<div class="AY_Match')[0];
    const m = parseCard(chunk, day);
    if (m) cards.push(m);
  }
  return Promise.all(
    cards.map(async (card) => {
      if (!card.pageUrl) return card;
      const playerUrl = await resolvePlayerUrl(card.pageUrl).catch(() => undefined);
      // If we already mapped the listed TV channel to a direct Alba player,
      // keep it as the primary player. The match page often exposes a generic
      // Twitch iframe that is unreliable when embedded on our domain.
      if (card.streamUrl && card.streamUrl !== card.pageUrl) {
        return { ...card, playerUrl: card.streamUrl };
      }
      return playerUrl ? { ...card, playerUrl } : card;
    }),
  );
}

export const getYallasellitMatches = createServerFn({ method: "GET" }).handler(async () => {
  const [yesterday, today, tomorrow] = await Promise.all([
    scrape("yesterday").catch(() => []),
    scrape("today").catch(() => []),
    scrape("tomorrow").catch(() => []),
  ]);
  return { yesterday, today, tomorrow, fetchedAt: new Date().toISOString() };
});
