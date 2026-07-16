import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { PlayCircle, Clock } from "lucide-react";
import { listLessons } from "@/lib/lessons.functions";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const lessonsQO = queryOptions({
  queryKey: ["lessons", "public"],
  queryFn: () => listLessons(),
  staleTime: 5 * 60_000,
});

export const Route = createFileRoute("/lessons")({
  loader: ({ context }) => context.queryClient.ensureQueryData(lessonsQO),
  head: () => ({
    meta: [
      { title: "دورات — Bouiba Academy" },
      {
        name: "description",
        content: "مكتبة دورات فيديو حول الذكاء الاصطناعي وأدواته باللغة العربية.",
      },
      { property: "og:title", content: "دورات — Bouiba Academy" },
      { property: "og:description", content: "دورات عربية حول الذكاء الاصطناعي." },
      { property: "og:url", content: "https://www.bouibacademy.me/lessons" },
    ],
    links: [{ rel: "canonical", href: "https://www.bouibacademy.me/lessons" }],
  }),
  component: LessonsPage,
});

function formatDuration(s?: number | null) {
  if (!s) return null;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function LessonsPage() {
  const { data: lessons } = useSuspenseQuery(lessonsQO);
  const [active, setActive] = useState<string | null>(null);
  const [cat, setCat] = useState<string | null>(null);

  const categories = useMemo(() => {
    const s = new Set<string>();
    lessons.forEach((l: any) => l.category && s.add(l.category));
    return Array.from(s);
  }, [lessons]);

  const filtered = cat ? lessons.filter((l: any) => l.category === cat) : lessons;
  const current = active ? lessons.find((l: any) => l.id === active) : null;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="hero-bg border-b border-border">
          <div className="container-page py-12 md:py-16 text-center">
            <p className="text-sm font-semibold text-primary mb-2">تعلم بالفيديو</p>
            <h1 className="font-display text-3xl md:text-5xl font-extrabold">
              دورات
            </h1>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              مكتبة دورات فيديو حول الذكاء الاصطناعي وأدواته باللغة العربية.
            </p>
          </div>
        </section>

        <div className="container-page py-8">
          {current && (
            <div className="mb-8 rounded-2xl overflow-hidden border border-border bg-card shadow-elegant">
              <video
                key={current.id}
                src={current.video_url ?? undefined}
                poster={current.thumbnail_url ?? undefined}
                controls
                autoPlay
                playsInline
                className="w-full aspect-video bg-black"
              />
              <div className="p-4 md:p-6">
                <h2 className="font-display text-xl md:text-2xl font-bold">{current.title}</h2>
                {current.description && (
                  <p className="mt-2 text-muted-foreground whitespace-pre-line">{current.description}</p>
                )}
              </div>
            </div>
          )}

          {categories.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => setCat(null)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
                  !cat ? "bg-primary text-primary-foreground border-primary" : "bg-surface border-border"
                }`}
              >
                الكل
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
                    cat === c ? "bg-primary text-primary-foreground border-primary" : "bg-surface border-border"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              لا توجد دروس منشورة بعد.
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((l: any) => (
                <button
                  key={l.id}
                  onClick={() => {
                    setActive(l.id);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="group text-right rounded-2xl overflow-hidden border border-border bg-card shadow-card hover:shadow-elegant transition-all hover:-translate-y-0.5"
                >
                  <div className="relative aspect-video bg-surface-muted overflow-hidden">
                    {l.thumbnail_url ? (
                      <img
                        src={l.thumbnail_url}
                        alt={l.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full grid place-items-center bg-gradient-to-br from-primary/20 to-accent">
                        <PlayCircle className="h-14 w-14 text-primary" />
                      </div>
                    )}
                    <div className="absolute inset-0 grid place-items-center bg-black/0 group-hover:bg-black/30 transition-colors">
                      <PlayCircle className="h-16 w-16 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {l.duration_seconds && (
                      <span className="absolute bottom-2 left-2 rounded bg-black/70 text-white text-xs px-1.5 py-0.5 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(l.duration_seconds)}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    {l.category && (
                      <span className="inline-block text-xs font-semibold text-primary bg-accent px-2 py-0.5 rounded mb-2">
                        {l.category}
                      </span>
                    )}
                    <h3 className="font-display font-bold leading-snug line-clamp-2">{l.title}</h3>
                    {l.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{l.description}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
