import { createServerFn } from "@tanstack/react-start";

const API = "https://www.thesportsdb.com/api/v1/json/3";
const LEAGUE_ID = "4429"; // FIFA World Cup
const SEASON = "2026";

export interface WCMatch {
  id: string;
  home: string;
  away: string;
  homeBadge?: string;
  awayBadge?: string;
  homeScore: number | null;
  awayScore: number | null;
  timestamp: string; // ISO UTC
  date: string;
  round: string;
  venue?: string;
  status: string; // FT, NS, LIVE...
  thumb?: string;
}

interface RawEvent {
  idLeague?: string;
  idEvent: string;
  strHomeTeam: string;
  strAwayTeam: string;
  strHomeTeamBadge?: string;
  strAwayTeamBadge?: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  strTimestamp: string;
  dateEvent: string;
  intRound: string;
  strVenue?: string;
  strStatus?: string;
  strThumb?: string;
  strPostponed?: string;
}

const ROUND_NAMES: Record<string, string> = {
  "1": "الجولة الأولى",
  "2": "الجولة الثانية",
  "3": "الجولة الثالثة",
  "125": "دور الـ32",
  "150": "دور الـ16",
  "200": "ربع النهائي",
  "500": "نصف النهائي",
  "150001": "تحديد المركز الثالث",
  "175": "تحديد المركز الثالث",
  "250": "تحديد المركز الثالث",
  "160": "المباراة النهائية",
};

function transformEvent(e: RawEvent): WCMatch {
  return {
    id: e.idEvent,
    home: e.strHomeTeam,
    away: e.strAwayTeam,
    homeBadge: e.strHomeTeamBadge,
    awayBadge: e.strAwayTeamBadge,
    homeScore: e.intHomeScore != null && e.intHomeScore !== "" ? Number(e.intHomeScore) : null,
    awayScore: e.intAwayScore != null && e.intAwayScore !== "" ? Number(e.intAwayScore) : null,
    timestamp: e.strTimestamp || `${e.dateEvent}T00:00:00`,
    date: e.dateEvent,
    round: ROUND_NAMES[e.intRound] ?? `الجولة ${e.intRound}`,
    venue: e.strVenue,
    status: e.strStatus ?? "NS",
    thumb: e.strThumb,
  };
}

export const getWorldCupMatches = createServerFn({ method: "GET" }).handler(async () => {
  const urls = [
    `${API}/eventsseason.php?id=${LEAGUE_ID}&s=${SEASON}`,
    `${API}/eventspastleague.php?id=${LEAGUE_ID}`,
    `${API}/eventsnextleague.php?id=${LEAGUE_ID}`,
  ];
  const results = await Promise.all(
    urls.map((u) =>
      fetch(u, { headers: { Accept: "application/json" } })
        .then((r) => (r.ok ? (r.json() as Promise<{ events: RawEvent[] | null }>) : { events: [] }))
        .catch(() => ({ events: [] as RawEvent[] | null })),
    ),
  );
  const merged = new Map<string, RawEvent>();
  for (const r of results) {
    for (const ev of r.events ?? []) {
      if (ev.idLeague && ev.idLeague !== LEAGUE_ID) continue;
      merged.set(ev.idEvent, ev);
    }
  }
  const matches = Array.from(merged.values())
    .map(transformEvent)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  return { matches };
});


export interface WCStanding {
  rank: number;
  team: string;
  badge?: string;
  group: string;
  played: number;
  win: number;
  draw: number;
  loss: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  form?: string;
}

interface RawStanding {
  intRank: string;
  strTeam: string;
  strBadge?: string;
  strGroup: string;
  intPlayed: string;
  intWin: string;
  intDraw: string;
  intLoss: string;
  intGoalsFor: string;
  intGoalsAgainst: string;
  intGoalDifference: string;
  intPoints: string;
  strForm?: string;
}

export const getWorldCupStandings = createServerFn({ method: "GET" }).handler(async () => {
  const url = `${API}/lookuptable.php?l=${LEAGUE_ID}&s=${SEASON}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return { standings: [] as WCStanding[] };
  const json = (await res.json()) as { table: RawStanding[] | null };
  const standings: WCStanding[] = (json.table ?? []).map((r) => ({
    rank: Number(r.intRank),
    team: r.strTeam,
    badge: r.strBadge,
    group: r.strGroup,
    played: Number(r.intPlayed),
    win: Number(r.intWin),
    draw: Number(r.intDraw),
    loss: Number(r.intLoss),
    gf: Number(r.intGoalsFor),
    ga: Number(r.intGoalsAgainst),
    gd: Number(r.intGoalDifference),
    points: Number(r.intPoints),
    form: r.strForm,
  }));
  return { standings };
});

