import { useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  Radio,
  Loader2,
  ExternalLink,
  Tv,
  Maximize2,
  SkipForward,
  ShieldCheck,
} from "lucide-react";
import { embedUrl, fetchMatchDetail, type SRCDetail, type SRCSource } from "@/lib/sportsrc";

/**
 * Per-host reputation. Higher = cleaner / more reliable.
 * Based on community knowledge of common sports embed providers.
 * Unknown hosts get a neutral 0 score.
 */
const HOST_SCORE: Record<string, number> = {
  // cleaner / fewer popups
  "streamed.su": 6,
  streamed: 6,
  topembed: 5,
  "top-embed": 5,
  sportzonline: 4,
  "1stream": 4,
  cricfree: 3,
  embedsports: 3,
  embedme: 2,
  "embed.st": 1,
  // notoriously ad-heavy / popup-happy
  sportsurge: -3,
  popcaster: -4,
  buffstreams: -2,
  vipbox: -3,
  vipleague: -3,
};

function hostScore(s: SRCSource): number {
  const url = embedUrl(s) || "";
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const parts = host.split(".");
    for (const key of Object.keys(HOST_SCORE)) {
      if (host.includes(key) || parts.some((p) => p === key)) return HOST_SCORE[key];
    }
  } catch {
    /* ignore */
  }
  // fallback: match by source label
  const label = (s.source || "").toLowerCase();
  for (const key of Object.keys(HOST_SCORE)) {
    if (label.includes(key)) return HOST_SCORE[key];
  }
  return 0;
}

/** Rank sources: reputation → HD → viewers → original order. */
function rankSources(sources: SRCSource[]): SRCSource[] {
  return [...sources]
    .map((s, i) => ({ s, i, score: hostScore(s) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if ((b.s.hd ? 1 : 0) !== (a.s.hd ? 1 : 0)) return (b.s.hd ? 1 : 0) - (a.s.hd ? 1 : 0);
      if ((b.s.viewers ?? 0) !== (a.s.viewers ?? 0)) return (b.s.viewers ?? 0) - (a.s.viewers ?? 0);
      return a.i - b.i;
    })
    .map((x) => x.s);
}

function preparePlayerUrl(rawUrl: string): string {
  if (!rawUrl) return rawUrl;
  try {
    const url = new URL(rawUrl.replace(/&amp;|&#038;/g, "&"));
    if (url.hostname === "player.twitch.tv" && typeof window !== "undefined") {
      url.searchParams.delete("parent");
      url.searchParams.append("parent", window.location.hostname);
    }
    return url.toString();
  } catch {
    return rawUrl;
  }
}

/** How long to wait for the iframe to fire "load" before auto-switching (ms). */
const LOAD_TIMEOUT_MS = 5000;

export function StreamModal({
  matchId,
  title,
  fallbackSearch,
  directUrl,
  directUrls,
  directLabel,
  onClose,
}: {
  matchId: string;
  title: string;
  fallbackSearch: string;
  /** When provided, skip SportSRC lookup and use this URL as the single source. */
  directUrl?: string;
  /** Extra direct fallbacks from the same provider. */
  directUrls?: string[];
  /** Label shown for the direct source (default "يلا سلّيت"). */
  directLabel?: string;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<SRCDetail | null>(null);
  const [ranked, setRanked] = useState<SRCSource[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(!directUrl && !directUrls?.length);
  const [err, setErr] = useState<string | null>(null);
  const [autoFallback, setAutoFallback] = useState(true);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [triedAll, setTriedAll] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const iframeKey = useRef(0);

  const active = ranked[activeIdx] || null;
  const activeUrl = useMemo(
    () => (active ? preparePlayerUrl(active.embedUrl || embedUrl(active) || "") : ""),
    [active],
  );

  // Load match sources. If Yallasellit provides a direct URL, keep it first but
  // still append SportSRC sources so the user can switch away from a bad embed.
  useEffect(() => {
    let alive = true;
    (async () => {
      const sources: SRCSource[] = [];
      const providerUrls = Array.from(
        new Set([directUrl, ...(directUrls ?? [])].filter(Boolean) as string[]),
      );
      providerUrls.forEach((url, i) => {
        sources.push({
          id: `yalla-direct-${i + 1}`,
          streamNo: i + 1,
          source: i === 0 ? directLabel || "يلا سلّيت" : `بديل يلا سلّيت ${i + 1}`,
          embedUrl: url,
          hd: true,
          language: "ar",
          viewers: 0,
        } as unknown as SRCSource);
      });
      try {
        const shouldFetchFallback = !matchId.startsWith("ys-");
        const d = shouldFetchFallback ? await fetchMatchDetail(matchId) : null;
        if (!alive) return;
        if (d?.sources?.length) {
          setDetail(d);
          sources.push(...rankSources(d.sources));
        }
        if (!sources.length) {
          setErr("لم يتم العثور على مصادر بث لهذه المباراة بعد. جرّب قبل انطلاق المباراة بقليل.");
          setLoading(false);
          return;
        }
        setRanked(sources);
        setActiveIdx(0);
      } catch (e) {
        if (!alive) return;
        if (sources.length) {
          setRanked(sources);
          setActiveIdx(0);
          setErr(null);
        } else {
          setErr(e instanceof Error ? e.message : "تعذر تحميل البث.");
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [matchId, directUrl, directUrls, directLabel]);

  // Auto-fallback watchdog: if the iframe never loads, jump to the next source.
  useEffect(() => {
    if (!active) return;
    setIframeLoading(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!autoFallback) return;
    timerRef.current = setTimeout(() => {
      // still loading after timeout → treat as bad source and skip
      if (activeIdx + 1 < ranked.length) {
        setActiveIdx((i) => i + 1);
      } else {
        setTriedAll(true);
      }
    }, LOAD_TIMEOUT_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active, activeIdx, ranked.length, autoFallback]);

  // Escape + body scroll lock
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  function nextSource() {
    if (activeIdx + 1 < ranked.length) {
      setActiveIdx((i) => i + 1);
      iframeKey.current += 1;
    } else {
      setTriedAll(true);
    }
  }

  function pickSource(idx: number) {
    setActiveIdx(idx);
    setTriedAll(false);
    iframeKey.current += 1;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 md:p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl bg-card rounded-2xl border border-border shadow-elegant overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Radio className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="font-display font-bold truncate">{title}</div>
              <div className="text-[11px] text-muted-foreground">
                البث المباشر — {active ? `المصدر ${activeIdx + 1} من ${ranked.length}` : "SportSRC"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoFallback}
                onChange={(e) => setAutoFallback(e.target.checked)}
                className="accent-primary"
              />
              تبديل تلقائي
            </label>
            <button
              onClick={onClose}
              aria-label="إغلاق"
              className="h-9 w-9 rounded-lg border border-border hover:bg-accent transition inline-flex items-center justify-center"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Player */}
        <div className="relative bg-black aspect-video">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/80">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-sm">جارٍ تحميل البث…</span>
            </div>
          )}
          {!loading && err && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center p-6">
              <Tv className="h-10 w-10 text-white/40" />
              <p className="text-white/80 text-sm max-w-md">{err}</p>
              <div className="flex gap-2">
                <a
                  href={`https://www.livesoccertv.com/search/?q=${encodeURIComponent(fallbackSearch)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-semibold transition"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> القنوات الناقلة
                </a>
                <a
                  href="https://tv.bouibacademy.me/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary hover:opacity-90 text-primary-foreground px-4 py-2 text-sm font-semibold transition"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> فتح StreamHub
                </a>
              </div>
            </div>
          )}
          {!loading && !err && active && (
            <>
              <iframe
                key={`${iframeKey.current}-${active.source}-${active.id}-${active.streamNo}`}
                src={activeUrl}
                title={title}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                /* Sandbox blocks popup ads and forced redirects from the provider. */
                sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
                referrerPolicy="no-referrer"
                onLoad={() => {
                  setIframeLoading(false);
                  if (timerRef.current) clearTimeout(timerRef.current);
                }}
                onError={() => {
                  if (autoFallback) nextSource();
                }}
                className="absolute inset-0 h-full w-full border-0"
              />
              {iframeLoading && (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 text-white/80">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-xs">
                    جارٍ تجربة المصدر {activeIdx + 1}…{" "}
                    {autoFallback ? "سيتم التبديل تلقائيًا إذا لم يعمل" : ""}
                  </span>
                </div>
              )}
              {triedAll && (
                <div className="pointer-events-none absolute bottom-3 right-3 rounded-lg bg-red-600/90 text-white px-3 py-1.5 text-[11px] font-semibold">
                  جُرِّبت كل المصادر — اختر مصدرًا يدويًا
                </div>
              )}
              <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-2">
                <button
                  onClick={nextSource}
                  disabled={activeIdx + 1 >= ranked.length}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/90 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 px-3 py-1.5 text-xs font-bold shadow-soft transition"
                >
                  <SkipForward className="h-3.5 w-3.5" /> المصدر التالي
                </button>
                <a
                  href={activeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-950 px-3 py-1.5 text-xs font-bold shadow-soft transition"
                >
                  <Maximize2 className="h-3.5 w-3.5" /> فتح بدون إطار
                </a>
              </div>
            </>
          )}
        </div>

        {/* Sources */}
        {ranked.length > 0 && (
          <div className="p-4 border-t border-border">
            <div className="flex items-center justify-between gap-2 text-xs font-semibold text-muted-foreground mb-2.5">
              <div className="inline-flex items-center gap-2">
                <Radio className="h-3.5 w-3.5" /> مصادر البث ({ranked.length})
              </div>
              <div className="inline-flex items-center gap-1.5 text-emerald-600">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span className="text-[11px]">مرتّبة حسب الجودة وقلّة الإعلانات</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {ranked.map((s, i) => {
                const isActive = i === activeIdx;
                const score = hostScore(s);
                const clean = score >= 3;
                return (
                  <div
                    key={`${s.source}-${s.id}-${s.streamNo}-${i}`}
                    className="inline-flex overflow-hidden rounded-lg border border-border bg-surface"
                  >
                    <button
                      onClick={() => pickSource(i)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "hover:text-primary hover:bg-accent"
                      }`}
                    >
                      <span className="opacity-70">#{i + 1}</span>
                      <span className="uppercase">{s.source}</span>
                      {s.hd && (
                        <span className="rounded bg-emerald-500/15 text-emerald-600 px-1.5 py-0.5 text-[10px] font-bold">
                          HD
                        </span>
                      )}
                      {clean && !isActive && (
                        <span className="rounded bg-emerald-500/15 text-emerald-600 px-1.5 py-0.5 text-[10px] font-bold">
                          نظيف
                        </span>
                      )}
                      {score < 0 && (
                        <span className="rounded bg-amber-500/15 text-amber-600 px-1.5 py-0.5 text-[10px] font-bold">
                          إعلانات
                        </span>
                      )}
                      {s.language && (
                        <span className="opacity-70 uppercase text-[10px]">{s.language}</span>
                      )}
                    </button>
                    <a
                      href={preparePlayerUrl(s.embedUrl || embedUrl(s) || "#")}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="فتح المصدر مباشرة"
                      title="فتح المصدر مباشرة بدون iframe"
                      className="inline-flex items-center justify-center border-r border-border px-2 text-muted-foreground hover:text-primary hover:bg-accent transition"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed">
              التطبيق ينتقل تلقائيًا إلى المصدر التالي إذا لم يعمل الحالي خلال{" "}
              {LOAD_TIMEOUT_MS / 1000} ثوانٍ. يمكنك إيقاف التبديل التلقائي من رأس النافذة، أو الضغط
              على "المصدر التالي" يدويًا. للحصول على تجربة بدون أي إعلانات داخل الفيديو، فعّل مانع
              إعلانات مثل uBlock Origin.
            </p>
            <a
              href="https://tv.bouibacademy.me/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border hover:border-primary px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition"
            >
              <ExternalLink className="h-3.5 w-3.5" /> فتح StreamHub مباشرة
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
