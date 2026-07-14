import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Calendar, MapPin, Trophy, Radio, ExternalLink, Clock, Tv, PlayCircle } from "lucide-react";
import {
  getWorldCupMatches,
  getWorldCupStandings,
  type WCMatch,
  type WCStanding,
} from "@/lib/worldcup.functions";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FavoriteButton } from "@/components/favorite-button";
import { useBrowserReminders } from "@/hooks/use-browser-reminders";
import { supabase } from "@/integrations/supabase/client";
import { StreamModal } from "@/components/stream-modal";
import { fetchFootballMatches, findMatch, type SRCMatch } from "@/lib/sportsrc";
import { getYallakoraMatches, type YKMatch } from "@/lib/yallakora.functions";
import { getYallasellitMatches, type YSMatch } from "@/lib/yallasellit.functions";

const srcQuery = queryOptions({
  queryKey: ["sportsrc", "football"],
  queryFn: () => fetchFootballMatches(),
  staleTime: 60_000,
  refetchInterval: 120_000,
});

const wcQuery = queryOptions({
  queryKey: ["worldcup", "2026"],
  queryFn: () => getWorldCupMatches(),
  staleTime: 5 * 60_000,
});
const standingsQuery = queryOptions({
  queryKey: ["worldcup", "standings", "2026"],
  queryFn: () => getWorldCupStandings(),
  staleTime: 5 * 60_000,
});
const ykQuery = queryOptions({
  queryKey: ["yallakora", "matches"],
  queryFn: () => getYallakoraMatches(),
  staleTime: 60_000,
  refetchInterval: 120_000,
});
const ysQuery = queryOptions({
  queryKey: ["yallasellit", "matches"],
  queryFn: () => getYallasellitMatches(),
  staleTime: 60_000,
  refetchInterval: 120_000,
});

export const Route = createFileRoute("/worldcup")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(wcQuery),
      context.queryClient.ensureQueryData(standingsQuery),
    ]);
  },
  head: () => ({
    meta: [
      { title: "كأس العالم 2026 — جدول، ترتيب وبث مباشر" },
      {
        name: "description",
        content:
          "متابعة شاملة لمونديال 2026: جدول كل المباريات، مباريات اليوم مع القنوات الناقلة، ترتيب المجموعات، وروابط البث الرسمي المباشر.",
      },
      { property: "og:title", content: "كأس العالم 2026 — بث مباشر وترتيب المجموعات" },
      {
        property: "og:description",
        content:
          "جدول شامل، ترتيب المجموعات، ومباريات اليوم مع القنوات الناقلة وروابط المشاهدة المباشرة.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://edu.bouibacademy.me/worldcup" },
    ],
    links: [{ rel: "canonical", href: "https://edu.bouibacademy.me/worldcup" }],
  }),
  component: WorldCupPage,
  errorComponent: ({ error }) => (
    <div className="p-10 text-center text-muted-foreground">تعذر التحميل: {error.message}</div>
  ),
});

const TOURNAMENT_START = new Date("2026-06-11T18:00:00Z").getTime();

// Per-match aggregator links. These search engines resolve to the exact match page
// with its official broadcasters and legal stream options per country.
function matchLinks(m: WCMatch) {
  const q = encodeURIComponent(`${m.home} vs ${m.away}`);
  const qAr = encodeURIComponent(`${m.home} ${m.away} بث مباشر`);
  return [
    {
      name: "LiveSoccerTV",
      short: "LiveSoccerTV",
      color: "bg-blue-600 hover:bg-blue-700",
      url: `https://www.livesoccertv.com/search/?q=${q}`,
      note: "القنوات الناقلة حسب بلدك",
    },
    {
      name: "Kooora (كورة)",
      short: "Kooora",
      color: "bg-emerald-600 hover:bg-emerald-700",
      url: `https://www.google.com/search?q=${qAr}+site:kooora.com`,
      note: "تغطية عربية وقنوات النقل",
    },
    {
      name: "FIFA+",
      short: "FIFA+",
      color: "bg-indigo-600 hover:bg-indigo-700",
      url: "https://www.plus.fifa.com/en/tournaments/mens/worldcup",
      note: "بث رسمي مجاني — مناطق مختارة",
    },
    {
      name: "Google بحث مباشر",
      short: "Google",
      color: "bg-slate-700 hover:bg-slate-800",
      url: `https://www.google.com/search?q=${qAr}`,
      note: "نتائج بث فورية",
    },
  ];
}

const OFFICIAL_STREAMS = [
  {
    name: "LiveSoccerTV",
    short: "LiveSoccerTV",
    color: "bg-blue-600 hover:bg-blue-700",
    watchUrl: "https://www.livesoccertv.com/competitions/international/world-cup/",
    note: "دليل شامل للقنوات الناقلة لكل مباراة حسب بلدك",
  },
  {
    name: "FIFA+ (مجاني)",
    short: "FIFA+",
    color: "bg-indigo-600 hover:bg-indigo-700",
    watchUrl: "https://www.plus.fifa.com/en/tournaments/mens/worldcup",
    note: "بث رسمي مجاني للمونديال — مناطق مختارة",
  },
  {
    name: "beIN Sports",
    short: "beIN",
    color: "bg-purple-600 hover:bg-purple-700",
    watchUrl: "https://www.beinsports.com/en/schedule",
    note: "الحقوق الحصرية — الشرق الأوسط وشمال أفريقيا",
  },
  {
    name: "Shahid (MBC)",
    short: "Shahid",
    color: "bg-amber-600 hover:bg-amber-700",
    watchUrl: "https://shahid.mbc.net/ar/live",
    note: "بث SSC / MBC — السعودية والخليج",
  },
  {
    name: "SSC السعودية",
    short: "SSC",
    color: "bg-emerald-600 hover:bg-emerald-700",
    watchUrl: "https://ssc.sa/",
    note: "قنوات SSC الرياضية",
  },
  {
    name: "FOX Sports (USA)",
    short: "FOX",
    color: "bg-slate-700 hover:bg-slate-800",
    watchUrl: "https://www.foxsports.com/soccer/fifa-world-cup",
    note: "الولايات المتحدة الأمريكية",
  },
];

const MATCH_TIMEZONE = "Africa/Casablanca";
const MATCH_TIMEZONE_LABEL = "بتوقيت المغرب";

function formatDateAr(iso: string, timeZone = MATCH_TIMEZONE) {
  try {
    return new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
      timeZone,
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
function formatDayAr(dateStr: string, timeZone = MATCH_TIMEZONE) {
  try {
    return new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
      timeZone,
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(dateStr + "T12:00:00"));
  } catch {
    return dateStr;
  }
}
function formatTimeAr(iso: string, timeZone = MATCH_TIMEZONE) {
  try {
    return new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

function useCountdown(target: number) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = now == null ? 0 : Math.max(0, target - now);
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
    done: now != null && diff === 0,
    ready: now != null,
  };
}

// Convert Yallakora "11:00 PM" (Riyadh, UTC+3) into an ISO string for SRC fuzzy matching.
function ykKickoffIso(day: "yesterday" | "today" | "tomorrow", time: string): string {
  const now = new Date();
  const base = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (day === "yesterday") base.setUTCDate(base.getUTCDate() - 1);
  if (day === "tomorrow") base.setUTCDate(base.getUTCDate() + 1);
  const m = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM|ص|م)?/i);
  if (!m) return base.toISOString();
  let h = Number(m[1]);
  const min = Number(m[2]);
  const ap = (m[3] || "").toUpperCase();
  if ((ap === "PM" || ap === "م") && h < 12) h += 12;
  if ((ap === "AM" || ap === "ص") && h === 12) h = 0;
  base.setUTCHours(h - 3, min, 0, 0); // Riyadh = UTC+3
  return base.toISOString();
}

function statusOf(m: WCMatch) {
  const raw = (m.status || "").trim();
  const status = raw.toUpperCase();
  const finished =
    ["FT", "AET", "PEN"].includes(status) || /انتهت|انتهى|finished|full\s*time/i.test(raw);
  const live =
    !finished &&
    (["LIVE", "1H", "2H", "HT", "ET", "P", "INT"].includes(status) ||
      /مباشر|جاري|جارية|الشوط|استراحة|live/i.test(raw));
  return { finished, live, upcoming: !finished && !live };
}

// Arabic → English aliases for national teams (extend as needed).
// Used to cross-reference Yallakora (AR) with TheSportsDB (EN) authoritative results.
const TEAM_AR_TO_EN: Record<string, string[]> = {
  السعودية: ["saudi arabia"],
  المغرب: ["morocco"],
  مصر: ["egypt"],
  الجزائر: ["algeria"],
  تونس: ["tunisia"],
  قطر: ["qatar"],
  الإمارات: ["united arab emirates", "uae"],
  الأردن: ["jordan"],
  العراق: ["iraq"],
  إيران: ["iran"],
  اليابان: ["japan"],
  "كوريا الجنوبية": ["south korea", "korea republic"],
  أستراليا: ["australia"],
  فرنسا: ["france"],
  إنجلترا: ["england"],
  إسبانيا: ["spain"],
  ألمانيا: ["germany"],
  إيطاليا: ["italy"],
  البرتغال: ["portugal"],
  هولندا: ["netherlands"],
  بلجيكا: ["belgium"],
  كرواتيا: ["croatia"],
  الدنمارك: ["denmark"],
  السويد: ["sweden"],
  النرويج: ["norway"],
  سويسرا: ["switzerland"],
  بولندا: ["poland"],
  صربيا: ["serbia"],
  النمسا: ["austria"],
  أوكرانيا: ["ukraine"],
  اسكتلندا: ["scotland"],
  ويلز: ["wales"],
  البرازيل: ["brazil"],
  الأرجنتين: ["argentina"],
  أوروغواي: ["uruguay"],
  الأوروغواي: ["uruguay"],
  كولومبيا: ["colombia"],
  الإكوادور: ["ecuador"],
  باراغواي: ["paraguay"],
  تشيلي: ["chile"],
  بيرو: ["peru"],
  المكسيك: ["mexico"],
  "الولايات المتحدة": ["united states", "usa"],
  كندا: ["canada"],
  كوستاريكا: ["costa rica"],
  بنما: ["panama"],
  هندوراس: ["honduras"],
  السنغال: ["senegal"],
  الكاميرون: ["cameroon"],
  غانا: ["ghana"],
  نيجيريا: ["nigeria"],
  "كوت ديفوار": ["ivory coast", "côte d'ivoire"],
  "ساحل العاج": ["ivory coast"],
  "الكونغو الديمقراطية": ["dr congo", "congo dr"],
  "جنوب أفريقيا": ["south africa"],
  "البوسنة والهرسك": ["bosnia and herzegovina", "bosnia-herzegovina"],
  "البوسنة الهرسك": ["bosnia and herzegovina"],
};

function normalizeEn(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
function arMatchesEn(ar: string, en: string): boolean {
  const enN = normalizeEn(en);
  const aliases = TEAM_AR_TO_EN[ar.trim()];
  if (!aliases) return false;
  return aliases.some((a) => enN.includes(a) || a.includes(enN));
}
function findWcForYk(yk: YKMatch, wc: WCMatch[]): WCMatch | null {
  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (yk.day === "yesterday") base.setDate(base.getDate() - 1);
  if (yk.day === "tomorrow") base.setDate(base.getDate() + 1);
  const dateStr = base.toISOString().slice(0, 10);
  const sameDay = wc.filter((m) => m.date === dateStr);
  return (
    sameDay.find(
      (m) =>
        (arMatchesEn(yk.home, m.home) && arMatchesEn(yk.away, m.away)) ||
        (arMatchesEn(yk.home, m.away) && arMatchesEn(yk.away, m.home)),
    ) || null
  );
}
// Merge YK with TheSportsDB authoritative score/status when a fixture matches.
function reconcileYk(yk: YKMatch, wc: WCMatch[]): YKMatch {
  const auth = findWcForYk(yk, wc);
  if (!auth) return yk;
  const s = statusOf(auth);
  const swapped = arMatchesEn(yk.home, auth.away);
  const hs = swapped ? auth.awayScore : auth.homeScore;
  const as = swapped ? auth.homeScore : auth.awayScore;
  return {
    ...yk,
    homeScore: hs ?? yk.homeScore,
    awayScore: as ?? yk.awayScore,
    live: yk.live || s.live,
    finished: yk.live ? false : s.finished,
    status: yk.live ? yk.status || "مباشر" : s.finished ? "انتهت" : s.live ? "مباشر" : yk.status,
    league: yk.league || "كأس العالم 2026",
  };
}

function MatchCard({
  m,
  favIds,
  srcMatches,
  onWatch,
  ysStreamMap,
}: {
  m: WCMatch;
  favIds: Set<string>;
  srcMatches: SRCMatch[];
  onWatch: (
    srcId: string,
    title: string,
    fallbackSearch: string,
    directUrl?: string,
    directUrls?: string[],
  ) => void;
  ysStreamMap?: Map<string, string[]>;
}) {
  const s = statusOf(m);
  const src = useMemo(
    () => (srcMatches.length ? findMatch(srcMatches, m.home, m.away, m.timestamp) : null),
    [srcMatches, m.home, m.away, m.timestamp],
  );
  const searchQ = `${m.home} vs ${m.away}`;
  const ysUrls = useMemo(() => {
    if (!ysStreamMap) return undefined;
    const k = `${m.home.replace(/\s+/g, "").toLowerCase()}|${m.away.replace(/\s+/g, "").toLowerCase()}`;
    return ysStreamMap.get(k);
  }, [ysStreamMap, m.home, m.away]);
  const ysUrl = ysUrls?.[0];

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card hover:shadow-elegant transition-all">
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
        <span className="inline-flex items-center gap-1.5">
          <Trophy className="h-3.5 w-3.5 text-primary" />
          {m.round}
        </span>
        <div className="flex items-center gap-2">
          {s.live && (
            <span className="inline-flex items-center gap-1.5 text-red-500 font-semibold">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" /> مباشر
            </span>
          )}
          {s.finished && <span className="font-semibold text-emerald-600">انتهت</span>}
          {s.upcoming && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {formatTimeAr(m.timestamp)}
            </span>
          )}
          {!s.finished && (
            <FavoriteButton
              size="sm"
              matchId={m.id}
              initiallyFavorited={favIds.has(m.id)}
              kickoffAt={m.timestamp}
              matchData={{
                home: m.home,
                away: m.away,
                homeBadge: m.homeBadge,
                awayBadge: m.awayBadge,
                venue: m.venue,
                round: m.round,
              }}
            />
          )}
        </div>
      </div>

      <div dir="ltr" className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex flex-col items-center text-center gap-2">
          {m.homeBadge ? (
            <img
              src={m.homeBadge}
              alt={m.home}
              loading="lazy"
              className="h-14 w-14 object-contain"
            />
          ) : (
            <div className="h-14 w-14 rounded-full bg-surface-muted" />
          )}
          <span dir="rtl" className="font-semibold text-sm">
            {m.home}
          </span>
        </div>

        <div className="text-center min-w-[80px]">
          {s.finished || s.live ? (
            <div className="font-display text-3xl font-extrabold tabular-nums">
              {m.homeScore ?? 0} <span className="text-muted-foreground">-</span> {m.awayScore ?? 0}
            </div>
          ) : (
            <div className="font-display text-lg font-bold text-primary">VS</div>
          )}
        </div>

        <div className="flex flex-col items-center text-center gap-2">
          {m.awayBadge ? (
            <img
              src={m.awayBadge}
              alt={m.away}
              loading="lazy"
              className="h-14 w-14 object-contain"
            />
          ) : (
            <div className="h-14 w-14 rounded-full bg-surface-muted" />
          )}
          <span dir="rtl" className="font-semibold text-sm">
            {m.away}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          {formatDateAr(m.timestamp)}
        </div>
        {m.venue && (
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {m.venue}
          </div>
        )}
      </div>

      {(s.live || s.upcoming) && (
        <div className="mt-4 pt-4 border-t border-border space-y-2">
          {ysUrl ? (
            <button
              onClick={() =>
                onWatch(src?.id || `ys-${m.id}`, `${m.home} vs ${m.away}`, searchQ, ysUrl, ysUrls)
              }
              className={`w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold text-white transition ${
                s.live ? "bg-red-600 hover:bg-red-700 animate-pulse" : "bg-primary hover:opacity-90"
              }`}
            >
              <PlayCircle className="h-4 w-4" />
              {s.live ? "شاهد البث المباشر الآن" : "شاهد البث داخل الموقع"}
            </button>
          ) : src ? (
            <button
              onClick={() => onWatch(src.id, `${m.home} vs ${m.away}`, searchQ)}
              className={`w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold text-white transition ${
                s.live
                  ? "bg-red-600 hover:bg-red-700 animate-pulse"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              <PlayCircle className="h-4 w-4" />
              {s.live ? "شاهد البث المباشر الآن" : "شاهد البث المباشر"}
            </button>
          ) : (
            <a
              href="https://tv.bouibacademy.me/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary hover:opacity-90 px-4 py-2.5 text-sm font-bold text-primary-foreground transition"
            >
              <Tv className="h-4 w-4" />
              افتح البث على StreamHub
            </a>
          )}
          <a
            href={`https://www.livesoccertv.com/search/?q=${encodeURIComponent(searchQ)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-border hover:border-primary px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-primary transition"
          >
            <Radio className="h-3.5 w-3.5" />
            القنوات الناقلة حسب بلدك (LiveSoccerTV)
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  );
}

function YKMatchCard({
  m,
  srcMatches,
  onWatch,
  ysStreamMap,
  featured = false,
}: {
  m: YKMatch;
  srcMatches: SRCMatch[];
  onWatch: (
    srcId: string,
    title: string,
    fallbackSearch: string,
    directUrl?: string,
    directUrls?: string[],
  ) => void;
  ysStreamMap?: Map<string, string[]>;
  featured?: boolean;
}) {
  const iso = useMemo(() => ykKickoffIso(m.day, m.time), [m.day, m.time]);
  const moroccoTime = useMemo(() => formatTimeAr(iso), [iso]);
  const src = useMemo(
    () => (srcMatches.length ? findMatch(srcMatches, m.home, m.away, iso) : null),
    [srcMatches, m.home, m.away, iso],
  );
  const ysUrls = useMemo(() => {
    if (!ysStreamMap) return undefined;
    const k = `${m.home.replace(/\s+/g, "").toLowerCase()}|${m.away.replace(/\s+/g, "").toLowerCase()}`;
    return ysStreamMap.get(k);
  }, [ysStreamMap, m.home, m.away]);
  const ysUrl = ysUrls?.[0];
  const title = `${m.home} vs ${m.away}`;

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border bg-card p-5 shadow-card transition-all hover:shadow-elegant hover:-translate-y-0.5 ${
        m.live
          ? "border-red-500/40 ring-1 ring-red-500/20"
          : featured
            ? "border-primary/30"
            : "border-border"
      }`}
    >
      {m.live && (
        <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br from-red-500/5 via-transparent to-transparent" />
      )}

      <div className="relative flex items-center justify-between text-xs text-muted-foreground mb-3">
        <span className="inline-flex items-center gap-1.5 truncate max-w-[65%]">
          <Trophy className="h-3.5 w-3.5 text-primary" />
          <span className="truncate font-medium">{m.league || "مباراة"}</span>
        </span>
        {m.live ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 text-red-600 px-2 py-0.5 font-bold text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" /> مباشر الآن
          </span>
        ) : m.finished ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 px-2 py-0.5 font-bold text-[11px]">
            انتهت
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 font-semibold text-[11px]">
            <Clock className="h-3 w-3" /> {moroccoTime}
          </span>
        )}
      </div>

      <div dir="ltr" className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex flex-col items-center text-center gap-2">
          {m.homeBadge ? (
            <img
              src={m.homeBadge}
              alt={m.home}
              loading="lazy"
              className="h-16 w-16 object-contain drop-shadow-sm"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-surface-muted" />
          )}
          <span dir="rtl" className="font-semibold text-sm leading-tight">
            {m.home}
          </span>
        </div>
        <div className="text-center min-w-[84px]">
          {m.finished || m.live ? (
            <div className="font-display text-3xl font-extrabold tabular-nums">
              <span className={m.live ? "text-red-600" : ""}>{m.homeScore ?? 0}</span>
              <span className="mx-1 text-muted-foreground">-</span>
              <span className={m.live ? "text-red-600" : ""}>{m.awayScore ?? 0}</span>
            </div>
          ) : (
            <div className="inline-flex flex-col items-center">
              <div className="font-display text-2xl font-extrabold gradient-text">VS</div>
              <div dir="rtl" className="mt-1 text-[10px] text-muted-foreground">
                {MATCH_TIMEZONE_LABEL}
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col items-center text-center gap-2">
          {m.awayBadge ? (
            <img
              src={m.awayBadge}
              alt={m.away}
              loading="lazy"
              className="h-16 w-16 object-contain drop-shadow-sm"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-surface-muted" />
          )}
          <span dir="rtl" className="font-semibold text-sm leading-tight">
            {m.away}
          </span>
        </div>
      </div>

      {(m.channel || m.commentator) && (
        <div className="relative mt-4 pt-4 border-t border-border grid grid-cols-2 gap-2 text-xs">
          {m.channel && (
            <div className="flex items-center gap-1.5 rounded-lg bg-surface-muted/60 px-2.5 py-2">
              <Tv className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="font-semibold text-foreground truncate" title={m.channel}>
                {m.channel}
              </span>
            </div>
          )}
          {m.commentator && (
            <div className="flex items-center gap-1.5 rounded-lg bg-surface-muted/60 px-2.5 py-2">
              <Radio className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="text-muted-foreground truncate" title={m.commentator}>
                {m.commentator}
              </span>
            </div>
          )}
        </div>
      )}

      {!m.finished && (
        <div className="relative mt-4 space-y-2">
          {ysUrl ? (
            <button
              onClick={() => onWatch(src?.id || `ys-${m.id}`, title, title, ysUrl, ysUrls)}
              className={`w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold text-white transition ${
                m.live
                  ? "bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/20"
                  : "bg-gradient-to-l from-primary to-primary/80 hover:opacity-95"
              }`}
            >
              <PlayCircle className="h-4 w-4" />
              {m.live ? "شاهد البث المباشر الآن" : "شاهد البث داخل الموقع"}
            </button>
          ) : src ? (
            <button
              onClick={() => onWatch(src.id, title, title)}
              className={`w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold text-white transition ${
                m.live
                  ? "bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/20"
                  : "bg-gradient-to-l from-primary to-primary/80 hover:opacity-95"
              }`}
            >
              <PlayCircle className="h-4 w-4" />
              {m.live ? "شاهد البث المباشر داخل الموقع" : "افتح المشغّل داخل الموقع"}
            </button>
          ) : (
            <div className="w-full text-center rounded-lg border border-dashed border-border px-4 py-2.5 text-xs text-muted-foreground">
              البث المباشر داخل الموقع غير متاح لهذه المباراة
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StandingsTable({ standings }: { standings: WCStanding[] }) {
  const groups = useMemo(() => {
    const map = new Map<string, WCStanding[]>();
    standings.forEach((s) => {
      if (!map.has(s.group)) map.set(s.group, []);
      map.get(s.group)!.push(s);
    });
    for (const arr of map.values()) arr.sort((a, b) => a.rank - b.rank);
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [standings]);

  if (standings.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        جدول الترتيب سيظهر بعد انطلاق البطولة.
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {groups.map(([group, rows]) => (
        <div
          key={group}
          className="rounded-2xl border border-border bg-card overflow-hidden shadow-card"
        >
          <div className="bg-gradient-to-l from-primary/10 to-transparent px-5 py-3 border-b border-border">
            <h3 className="font-display font-bold text-lg">{group}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="text-right px-3 py-2 font-semibold">#</th>
                  <th className="text-right px-3 py-2 font-semibold">المنتخب</th>
                  <th className="px-2 py-2 font-semibold" title="لعب">
                    ل
                  </th>
                  <th className="px-2 py-2 font-semibold" title="فاز">
                    ف
                  </th>
                  <th className="px-2 py-2 font-semibold" title="تعادل">
                    ت
                  </th>
                  <th className="px-2 py-2 font-semibold" title="خسر">
                    خ
                  </th>
                  <th className="px-2 py-2 font-semibold" title="فارق الأهداف">
                    +/-
                  </th>
                  <th className="px-2 py-2 font-semibold text-primary">نقاط</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.team} className="border-t border-border hover:bg-accent/30 transition">
                    <td className="px-3 py-2.5 font-bold text-muted-foreground">{r.rank}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        {r.badge && (
                          <img
                            src={r.badge}
                            alt=""
                            className="h-5 w-5 object-contain"
                            loading="lazy"
                          />
                        )}
                        <span className="font-semibold">{r.team}</span>
                      </div>
                    </td>
                    <td className="text-center tabular-nums">{r.played}</td>
                    <td className="text-center tabular-nums text-emerald-600 font-semibold">
                      {r.win}
                    </td>
                    <td className="text-center tabular-nums">{r.draw}</td>
                    <td className="text-center tabular-nums text-red-500">{r.loss}</td>
                    <td className="text-center tabular-nums">{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
                    <td className="text-center tabular-nums font-extrabold text-primary">
                      {r.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

type Tab = "live" | "today" | "all" | "standings" | "channels";

function WorldCupPage() {
  const { data } = useSuspenseQuery(wcQuery);
  const { data: standingsData } = useSuspenseQuery(standingsQuery);
  const { data: yk } = useQuery(ykQuery);
  const { data: ys } = useQuery(ysQuery);
  const cd = useCountdown(TOURNAMENT_START);
  const [tab, setTab] = useState<Tab>("live");
  useBrowserReminders();
  const [watch, setWatch] = useState<{
    id: string;
    title: string;
    fallback: string;
    directUrl?: string;
    directUrls?: string[];
    directLabel?: string;
  } | null>(null);
  const { data: srcMatches = [] } = useQuery(srcQuery);
  const onWatch = (
    id: string,
    title: string,
    fallback: string,
    directUrl?: string,
    directUrls?: string[],
  ) =>
    setWatch({
      id,
      title,
      fallback,
      directUrl,
      directUrls,
      directLabel: directUrl ? "يلا سلّيت" : undefined,
    });

  // Build a fast lookup from Yallasellit for direct stream URLs. We match by
  // team names with aggressive Arabic normalization (strip diacritics, common
  // prefixes like "منتخب" / "نادي" / "ال", punctuation, spaces) and accept a
  // match when either team name from Yallakora is a substring of the
  // Yallasellit name (or vice-versa) for BOTH sides, in either order.
  const ysStreamList = useMemo(() => {
    const all: { home: string; away: string; urls: string[] }[] = [];
    const push = (match: YSMatch) => {
      const urls = Array.from(
        new Set(
          [match.playerUrl, match.streamUrl, ...(match.channelUrls ?? []), match.pageUrl].filter(
            Boolean,
          ) as string[],
        ),
      );
      if (!urls.length) return;
      all.push({ home: match.home, away: match.away, urls });
    };
    ys?.today.forEach(push);
    ys?.tomorrow.forEach(push);
    ys?.yesterday.forEach(push);
    return all;
  }, [ys]);

  const ysStreamMap = useMemo(() => {
    const norm = (s: string) =>
      s
        .replace(/[\u064B-\u065F\u0670]/g, "")
        .replace(/[إأآٱ]/g, "ا")
        .replace(/ى/g, "ي")
        .replace(/ة/g, "ه")
        .replace(/(منتخب|نادي|فريق|المنتخب)/g, "")
        .replace(/^ال/, "")
        .replace(/[^\p{L}\p{N}]/gu, "")
        .toLowerCase();
    const matches = (a: string, b: string) => {
      const na = norm(a);
      const nb = norm(b);
      if (!na || !nb) return false;
      return na === nb || na.includes(nb) || nb.includes(na);
    };
    const find = (home: string, away: string): string[] | undefined => {
      for (const s of ysStreamList) {
        if (
          (matches(s.home, home) && matches(s.away, away)) ||
          (matches(s.home, away) && matches(s.away, home))
        ) {
          return s.urls;
        }
      }
      return undefined;
    };
    // Keep the Map-like `.get("home|away")` API used by child components.
    return {
      get(key: string) {
        const [h, a] = key.split("|");
        return find(h ?? "", a ?? "");
      },
    } as unknown as Map<string, string[]>;
  }, [ysStreamList]);

  const { data: favData } = useQuery({
    queryKey: ["favorites", "ids"],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return { ids: [] as string[] };
      const { data: rows } = await supabase.from("match_favorites").select("match_id");
      return { ids: (rows ?? []).map((r) => r.match_id as string) };
    },
    staleTime: 30_000,
  });
  const favIds = useMemo(() => new Set(favData?.ids ?? []), [favData]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayMatches = useMemo(
    () => data.matches.filter((m) => m.date === todayStr),
    [data.matches, todayStr],
  );

  // Group all matches by day for the full schedule tab
  const byDay = useMemo(() => {
    const groups = new Map<string, WCMatch[]>();
    data.matches.forEach((m) => {
      if (!groups.has(m.date)) groups.set(m.date, []);
      groups.get(m.date)!.push(m);
    });
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [data.matches]);

  // Compute time-dependent counts client-side only to avoid SSR hydration mismatches.
  const [nowMs, setNowMs] = useState<number | null>(null);
  useEffect(() => {
    setNowMs(Date.now());
    const t = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  const liveCount = nowMs == null ? 0 : data.matches.filter((m) => statusOf(m).live).length;
  const finishedCount = nowMs == null ? 0 : data.matches.filter((m) => statusOf(m).finished).length;
  const upcomingCount =
    nowMs == null
      ? 0
      : data.matches.filter((m) => {
          const s = statusOf(m);
          return s.upcoming && new Date(m.timestamp).getTime() > nowMs;
        }).length;

  // Reconcile YK with TheSportsDB authoritative scores (priority: TheSportsDB).
  const ykReconciled = useMemo(() => {
    if (!yk) return null;
    const wc = data.matches;
    return {
      yesterday: yk.yesterday.map((m) => reconcileYk(m, wc)),
      today: yk.today.map((m) => reconcileYk(m, wc)),
      tomorrow: yk.tomorrow.map((m) => reconcileYk(m, wc)),
    };
  }, [yk, data.matches]);

  const ykTodayCount = ykReconciled?.today.length ?? 0;
  const ykLiveCount = ykReconciled?.today.filter((m) => m.live).length ?? 0;
  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "live", label: "بث مباشر (يلا كورة)", count: ykLiveCount || ykTodayCount },
    { key: "today", label: "مباريات اليوم", count: todayMatches.length },
    { key: "all", label: "الجدول الكامل", count: data.matches.length },
    { key: "standings", label: "ترتيب المجموعات", count: standingsData.standings.length },
    { key: "channels", label: "قنوات البث" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        {/* HERO */}
        <section className="relative hero-bg overflow-hidden border-b border-border">
          <div className="absolute inset-0 mesh-bg opacity-40 pointer-events-none" />
          <div className="container-page relative py-14 md:py-20 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 backdrop-blur px-4 py-1.5 text-xs font-medium text-muted-foreground mb-6 shadow-soft">
              <Trophy className="h-3.5 w-3.5 text-primary" />
              المونديال 2026 — أمريكا · كندا · المكسيك
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-extrabold leading-tight">
              <span className="gradient-text">كأس العالم 2026</span>
              <br />
              الجدول الكامل · الترتيب · البث المباشر
            </h1>
            <p className="mt-5 mx-auto max-w-2xl text-muted-foreground">
              جميع مباريات المونديال بتوقيت المغرب، ترتيب المجموعات لحظة بلحظة، ومباريات اليوم مع
              القنوات الناقلة وروابط المشاهدة الرسمية المباشرة.
            </p>

            {/* Live stats strip */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
              {[
                { l: "مباشر الآن", v: liveCount, c: "text-red-500" },
                { l: "اليوم", v: todayMatches.length, c: "text-primary" },
                { l: "قادمة", v: upcomingCount, c: "text-blue-600" },
                { l: "منتهية", v: finishedCount, c: "text-emerald-600" },
              ].map((s) => (
                <div
                  key={s.l}
                  className="rounded-xl border border-border bg-card px-4 py-3 shadow-soft"
                >
                  <div className={`font-display text-2xl font-extrabold tabular-nums ${s.c}`}>
                    {s.v}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{s.l}</div>
                </div>
              ))}
            </div>

            {cd.ready && !cd.done && (
              <div className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-border bg-card px-6 py-4 shadow-card">
                {[
                  { v: cd.d, l: "يوم" },
                  { v: cd.h, l: "ساعة" },
                  { v: cd.m, l: "دقيقة" },
                  { v: cd.s, l: "ثانية" },
                ].map((x, i) => (
                  <div key={i} className="text-center min-w-[54px]">
                    <div className="font-display text-2xl md:text-3xl font-extrabold gradient-text tabular-nums">
                      {String(x.v).padStart(2, "0")}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                      {x.l}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* TABS */}
        <section className="container-page py-8">
          <div className="relative mx-auto max-w-3xl mb-8">
            <div className="absolute -top-3 right-4 z-10">
              <span className="inline-block rounded-t-lg border border-b-0 border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft">
                {MATCH_TIMEZONE_LABEL}
              </span>
            </div>

            <div className="rounded-2xl border border-border bg-card p-3 md:p-4 shadow-card">
              <div className="rounded-xl bg-[hsl(140_70%_22%)] text-white text-center font-display text-xl md:text-2xl font-extrabold py-3 md:py-4 shadow-soft">
                جدول المباريات
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 md:gap-3">
                {tabs
                  .slice(0, 3)
                  .reverse()
                  .map((t, idx) => {
                    const palette = [
                      "bg-[hsl(210_75%_35%)]",
                      "bg-[hsl(140_70%_28%)]",
                      "bg-[hsl(25_85%_42%)]",
                    ][idx];
                    const isActive = tab === t.key;
                    return (
                      <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`rounded-xl px-3 py-3 text-sm md:text-base font-bold text-white transition-all shadow-soft ${palette} ${
                          isActive
                            ? "ring-2 ring-offset-2 ring-offset-card ring-white/50 scale-[1.02]"
                            : "opacity-90 hover:opacity-100"
                        }`}
                      >
                        {t.label}
                        {t.count != null && (
                          <span className="mr-2 inline-flex items-center justify-center rounded-full bg-white/25 text-white text-[11px] min-w-5 px-1.5">
                            {t.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>

              {tabs.length > 3 && (
                <div className="mt-3 flex flex-wrap gap-2 justify-center">
                  {tabs.slice(3).map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setTab(t.key)}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs md:text-sm font-medium transition-colors ${
                        tab === t.key
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-surface border-border hover:border-primary hover:text-primary"
                      }`}
                    >
                      {t.label}
                      {t.count != null && (
                        <span
                          className={`text-[11px] rounded-full px-2 py-0.5 ${tab === t.key ? "bg-primary-foreground/20" : "bg-accent"}`}
                        >
                          {t.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* LIVE — Yallakora */}
          {tab === "live" && (
            <div className="space-y-12">
              <div className="text-center mb-2">
                <h2 className="font-display text-2xl md:text-3xl font-bold">
                  بث مباشر — جدول كامل مع القنوات الناقلة
                </h2>
                <p className="mt-2 text-sm text-muted-foreground max-w-2xl mx-auto">
                  جدول شامل لمباريات الأمس واليوم والغد مصدره{" "}
                  <span className="font-semibold text-foreground">يلا كورة</span>، مع القناة الرسمية
                  والمعلّق. المباريات المتاح لها بث مدمج تُشاهَد داخل الموقع بضغطة زر.
                </p>
              </div>

              {!ykReconciled ? (
                <div className="text-center py-16 text-muted-foreground">
                  جارٍ تحميل مباريات اليوم…
                </div>
              ) : (
                <>
                  {ykReconciled.today.length === 0 &&
                    ykReconciled.tomorrow.length === 0 &&
                    ykReconciled.yesterday.length === 0 && (
                      <div className="text-center py-16 text-muted-foreground rounded-2xl border border-dashed border-border space-y-2">
                        <p>
                          لا توجد مباريات مُدرجة على{" "}
                          <span className="font-semibold text-foreground">يلا كورة</span> لهذه
                          الفترة.
                        </p>
                        <p className="text-xs">
                          يمكنك تصفح المباريات من التبويبات الأخرى (البث المباشر / كأس العالم) أو
                          المحاولة لاحقًا.
                        </p>
                      </div>
                    )}

                  {(() => {
                    const liveNow = ykReconciled.today.filter((m) => m.live);
                    const upcomingToday = ykReconciled.today.filter((m) => !m.live && !m.finished);
                    const finishedToday = ykReconciled.today.filter((m) => m.finished);
                    return (
                      <>
                        {liveNow.length > 0 && (
                          <div className="relative">
                            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-red-500/10 via-transparent to-transparent pointer-events-none" />
                            <div className="relative flex items-center gap-3 mb-5">
                              <span className="inline-flex items-center gap-2 rounded-full bg-red-600 text-white px-3 py-1 text-xs font-extrabold shadow-lg shadow-red-500/30">
                                <span className="h-2 w-2 rounded-full bg-white animate-pulse" />{" "}
                                مباشر الآن
                              </span>
                              <h3 className="font-display font-extrabold text-xl">
                                {liveNow.length} مباراة تُبثّ حالياً
                              </h3>
                            </div>
                            <div className="relative grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                              {liveNow.map((m) => (
                                <YKMatchCard
                                  key={m.id}
                                  m={m}
                                  srcMatches={srcMatches}
                                  onWatch={onWatch}
                                  ysStreamMap={ysStreamMap}
                                  featured
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {upcomingToday.length > 0 && (
                          <div>
                            <h3 className="font-display font-bold text-lg text-primary mb-4 flex items-center gap-2">
                              <Clock className="h-5 w-5" /> اليوم · {upcomingToday.length} مباراة
                              قادمة
                            </h3>
                            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                              {upcomingToday.map((m) => (
                                <YKMatchCard
                                  key={m.id}
                                  m={m}
                                  srcMatches={srcMatches}
                                  onWatch={onWatch}
                                  ysStreamMap={ysStreamMap}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {finishedToday.length > 0 && (
                          <div>
                            <h3 className="font-display font-bold text-lg text-emerald-600 mb-4">
                              نتائج اليوم · {finishedToday.length} مباراة
                            </h3>
                            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                              {finishedToday.map((m) => (
                                <YKMatchCard
                                  key={m.id}
                                  m={m}
                                  srcMatches={srcMatches}
                                  onWatch={onWatch}
                                  ysStreamMap={ysStreamMap}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {ykReconciled.tomorrow.length > 0 && (
                    <div>
                      <h3 className="font-display font-bold text-lg text-primary mb-4 flex items-center gap-2">
                        <Calendar className="h-5 w-5" /> الغد · {ykReconciled.tomorrow.length}{" "}
                        مباراة
                      </h3>
                      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {ykReconciled.tomorrow.map((m) => (
                          <YKMatchCard
                            key={m.id}
                            m={m}
                            srcMatches={srcMatches}
                            onWatch={onWatch}
                            ysStreamMap={ysStreamMap}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {ykReconciled.yesterday.length > 0 && (
                    <div>
                      <h3 className="font-display font-bold text-lg text-muted-foreground mb-4">
                        نتائج الأمس · {ykReconciled.yesterday.length} مباراة
                      </h3>
                      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {ykReconciled.yesterday.map((m) => (
                          <YKMatchCard
                            key={m.id}
                            m={m}
                            srcMatches={srcMatches}
                            onWatch={onWatch}
                            ysStreamMap={ysStreamMap}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* TODAY */}
          {tab === "today" && (
            <div>
              <div className="text-center mb-6">
                <h2 className="font-display text-2xl md:text-3xl font-bold">
                  مباريات اليوم مع القنوات الناقلة
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {formatDayAr(todayStr)} — اضغط على القناة لفتح البث المباشر
                </p>
              </div>
              {todayMatches.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground rounded-2xl border border-dashed border-border">
                  لا توجد مباريات مبرمجة اليوم. تفقّد الجدول الكامل للاطلاع على المباريات القادمة.
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {todayMatches.map((m) => (
                    <MatchCard
                      key={m.id}
                      m={m}
                      favIds={favIds}
                      srcMatches={srcMatches}
                      onWatch={onWatch}
                      ysStreamMap={ysStreamMap}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ALL — grouped by day */}
          {tab === "all" && (
            <div className="space-y-10">
              {byDay.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">لم تُنشر مباريات بعد.</div>
              )}
              {byDay.map(([day, matches]) => (
                <div key={day}>
                  <div className="sticky top-16 z-10 mb-4 -mx-4 px-4 py-2 backdrop-blur bg-background/80 border-b border-border">
                    <h3 className="font-display font-bold text-lg text-primary">
                      {formatDayAr(day)}
                    </h3>
                    <p className="text-xs text-muted-foreground">{matches.length} مباراة</p>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {matches.map((m) => (
                      <MatchCard
                        key={m.id}
                        m={m}
                        favIds={favIds}
                        srcMatches={srcMatches}
                        onWatch={onWatch}
                        ysStreamMap={ysStreamMap}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STANDINGS */}
          {tab === "standings" && (
            <div>
              <div className="text-center mb-6">
                <h2 className="font-display text-2xl md:text-3xl font-bold">ترتيب المجموعات</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  يُحدَّث تلقائيًا بعد نهاية كل مباراة — النقاط، فارق الأهداف، وأداء المنتخبات.
                </p>
              </div>
              <StandingsTable standings={standingsData.standings} />
            </div>
          )}

          {/* CHANNELS */}
          {tab === "channels" && (
            <div>
              <div className="text-center mb-8">
                <h2 className="font-display text-2xl md:text-3xl font-bold">
                  قنوات البث الرسمية للمونديال
                </h2>
                <p className="mt-2 text-sm text-muted-foreground max-w-2xl mx-auto">
                  اختر المنصة المتاحة في بلدك لمشاهدة المباريات بجودة عالية وبشكل قانوني — روابط
                  مباشرة إلى صفحات البث.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {OFFICIAL_STREAMS.map((s) => (
                  <a
                    key={s.name}
                    href={s.watchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group rounded-2xl border border-border bg-card p-6 shadow-card hover:shadow-elegant hover:-translate-y-0.5 transition-all"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`inline-flex h-12 w-12 items-center justify-center rounded-xl text-white ${s.color}`}
                      >
                        <Radio className="h-5 w-5" />
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition" />
                    </div>
                    <div className="font-display font-bold text-lg">{s.name}</div>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{s.note}</p>
                    <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-primary">
                      فتح البث المباشر ←
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
      {watch && (
        <StreamModal
          matchId={watch.id}
          title={watch.title}
          fallbackSearch={watch.fallback}
          directUrl={watch.directUrl}
          directUrls={watch.directUrls}
          directLabel={watch.directLabel}
          onClose={() => setWatch(null)}
        />
      )}
    </div>
  );
}
