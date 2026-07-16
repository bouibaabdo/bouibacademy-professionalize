import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ExternalLink, Tv, ArrowLeft, Clock } from "lucide-react";
import { getYalladownMatches, type YDMatch } from "@/lib/yalladown.functions";
import { normalizeArName } from "@/lib/match-streams";

const STREAM_URL = "https://tv.bouibacademy.me/#sports";

/**
 * Horizontal, snap-scrolling rail of today's live/upcoming matches. Always
 * renders the same outer section shape (heading + fixed-height rail area) so
 * no layout shift occurs when matches arrive or when the query returns empty.
 */
export function TodayMatchesRail({
  variant = "home",
  max = 10,
}: {
  variant?: "home" | "article";
  max?: number;
}) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    if (enabled) return;
    const el = sectionRef.current;
    if (!el) return;
    // Defer fetch until section is near viewport, or after idle time on home
    const idle = window.setTimeout(() => setEnabled(true), 2500);
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            setEnabled(true);
            io.disconnect();
          }
        },
        { rootMargin: "300px" },
      );
      io.observe(el);
      return () => { io.disconnect(); window.clearTimeout(idle); };
    }
    return () => window.clearTimeout(idle);
  }, [enabled]);

  const yd = useQuery({
    queryKey: ["yalladown", "matches"],
    queryFn: () => getYalladownMatches(),
    staleTime: 60_000,
    refetchInterval: enabled ? 120_000 : false,
    enabled,
  });
  const matches: YDMatch[] = useMemo(() => {
    const src: YDMatch[] = [
      ...(yd.data?.today ?? []),
      ...(yd.data?.tomorrow ?? []),
    ];
    const seen = new Set<string>();
    const out: YDMatch[] = [];
    for (const m of src) {
      const key = `${normalizeArName(m.home)}|${normalizeArName(m.away)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (m.finished) continue;
      out.push(m);
      if (out.length >= max) break;
    }
    out.sort((a, b) => Number(b.live) - Number(a.live));
    return out;
  }, [yd.data, max]);

  const heading =
    variant === "home" ? "مباريات اليوم — بث مباشر" : "مباريات اليوم";
  const hasContent = matches.length > 0;
  const showEmpty = yd.isFetched && !hasContent;

  return (
    <section
      ref={sectionRef}
      className={
        variant === "home"
          ? "container-page py-8 md:py-12 min-h-[360px] md:min-h-[380px]"
          : "container-page py-6 min-h-[340px]"
      }
    >
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            {heading}
          </h2>
          {variant === "home" && (
            <p className="mt-1 text-sm text-muted-foreground">
              كأس العالم 2026 وأبرز مباريات اليوم — بتوقيت المغرب
            </p>
          )}
        </div>
        <Link
          to="/worldcup"
          className="inline-flex items-center gap-1 text-xs md:text-sm font-semibold text-primary hover:underline shrink-0"
        >
          كل المباريات <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>

      <div
        className="-mx-4 px-4 flex gap-3 overflow-x-auto snap-x snap-mandatory pb-3 scrollbar-thin min-h-[230px]"
        style={{ scrollbarWidth: "thin" }}
      >
        {!hasContent && !showEmpty && (
          <>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="snap-start shrink-0 w-[280px] md:w-[300px] h-[220px] rounded-2xl border border-border bg-surface-muted animate-pulse"
              />
            ))}
          </>
        )}
        {showEmpty && (
          <div className="w-full flex items-center justify-center text-sm text-muted-foreground min-h-[220px]">
            لا توجد مباريات متاحة الآن
          </div>
        )}
        {hasContent && matches.map((m) => (
          <article
            key={m.id}
            className={`snap-start shrink-0 w-[280px] md:w-[300px] rounded-2xl border bg-card p-4 shadow-card transition ${
              m.live
                ? "border-red-500/50 ring-1 ring-red-500/20"
                : "border-border"
            }`}
          >
            <div className="flex items-center justify-between text-[11px] mb-2">
              <span className="inline-flex items-center gap-1 text-muted-foreground truncate max-w-[65%]">
                <Tv className="h-3 w-3 text-primary shrink-0" />
                <span className="truncate">{m.channel || m.league || "مباراة"}</span>
              </span>
              {m.live ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 text-red-600 px-2 py-0.5 font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" /> مباشر
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 font-semibold">
                  <Clock className="h-3 w-3" /> {m.time}
                </span>
              )}
            </div>
            <div dir="ltr" className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <div className="flex flex-col items-center gap-1 text-center min-w-0">
                {m.homeBadge ? (
                  <img src={m.homeBadge} alt={m.home} width={40} height={40} loading="lazy" decoding="async" className="h-10 w-10 object-contain" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-surface-muted" />
                )}
                <span dir="rtl" className="text-xs font-semibold leading-tight line-clamp-2">{m.home}</span>
              </div>
              <div className="text-center min-w-[52px]">
                <div className="font-display font-extrabold text-lg gradient-text">VS</div>
              </div>
              <div className="flex flex-col items-center gap-1 text-center min-w-0">
                {m.awayBadge ? (
                  <img src={m.awayBadge} alt={m.away} width={40} height={40} loading="lazy" decoding="async" className="h-10 w-10 object-contain" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-surface-muted" />
                )}
                <span dir="rtl" className="text-xs font-semibold leading-tight line-clamp-2">{m.away}</span>
              </div>
            </div>
            <a
              href={STREAM_URL}
              target="_blank"
              rel="noopener"
              className={`mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${
                m.live
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-primary hover:opacity-95 text-primary-foreground"
              }`}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {m.live ? "افتح البث الآن" : "افتح البث المباشر"}
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
