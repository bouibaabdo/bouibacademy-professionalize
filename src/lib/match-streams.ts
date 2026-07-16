import type { YSMatch } from "./yallasellit.functions";
import type { YDMatch } from "./yalladown.functions";

/**
 * Aggressive Arabic normalization so team names from different providers match.
 * Strips diacritics, common prefixes (منتخب / نادي / فريق), leading ال,
 * punctuation and spaces, then lower-cases.
 */
export function normalizeArName(s: string): string {
  return s
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/(منتخب|نادي|فريق|المنتخب)/g, "")
    .replace(/^ال/, "")
    .replace(/[^\p{L}\p{N}]/gu, "")
    .toLowerCase();
}

function nameMatches(a: string, b: string): boolean {
  const na = normalizeArName(a);
  const nb = normalizeArName(b);
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

export interface StreamEntry {
  home: string;
  away: string;
  urls: string[];
  source: "yalladown" | "yallasellit";
}

type YSData = { today?: YSMatch[]; tomorrow?: YSMatch[]; yesterday?: YSMatch[] } | undefined;
type YDData = { today?: YDMatch[]; tomorrow?: YDMatch[]; yesterday?: YDMatch[] } | undefined;

/**
 * Build a lookup keyed on team names. Only Yalladown page URLs
 * (n.hdshoo.online/…) are exposed — every other provider was returning
 * broken/ad-heavy embeds so we intentionally drop them.
 */
export function buildStreamLookup(
  yd: YDData | null | undefined,
  _ys: YSData | null | undefined,
) {
  const entries: StreamEntry[] = [];

  const pushYd = (m: YDMatch) => {
    if (!m.pageUrl) return;
    entries.push({ home: m.home, away: m.away, urls: [m.pageUrl], source: "yalladown" });
  };

  yd?.today?.forEach(pushYd);
  yd?.tomorrow?.forEach(pushYd);
  yd?.yesterday?.forEach(pushYd);

  function find(home: string, away: string): string[] | undefined {
    const combined: string[] = [];
    for (const e of entries) {
      if (
        (nameMatches(e.home, home) && nameMatches(e.away, away)) ||
        (nameMatches(e.home, away) && nameMatches(e.away, home))
      ) {
        combined.push(...e.urls);
      }
    }
    const unique = Array.from(new Set(combined));
    return unique.length ? unique : undefined;
  }

  return {
    find,
    get(key: string) {
      const [h, a] = key.split("|");
      return find(h ?? "", a ?? "");
    },
  };
}

export type StreamLookup = ReturnType<typeof buildStreamLookup>;
