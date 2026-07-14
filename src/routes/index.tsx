import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, Cpu, Newspaper, Sparkles, Wrench } from "lucide-react";
import { getPosts, getLabels } from "@/lib/blogger.functions";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PostCard } from "@/components/post-card";

const postsQueryOptions = queryOptions({
  queryKey: ["posts", "home"],
  queryFn: () => getPosts({ data: { max: 9 } }),
  staleTime: 5 * 60_000,
});

const labelsQueryOptions = queryOptions({
  queryKey: ["labels"],
  queryFn: () => getLabels(),
  staleTime: 10 * 60_000,
});

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(postsQueryOptions),
      context.queryClient.ensureQueryData(labelsQueryOptions),
    ]);
  },
  head: () => ({
    meta: [{ property: "og:url", content: "https://edu.bouibacademy.me/" }],
    links: [{ rel: "canonical", href: "https://edu.bouibacademy.me/" }],
  }),
  component: HomePage,
  errorComponent: ({ error }) => (
    <div className="p-10 text-center text-muted-foreground">
      تعذر تحميل المحتوى: {error.message}
    </div>
  ),
});

const FEATURES = [
  {
    icon: BookOpen,
    title: "دروس عملية",
    desc: "شروحات خطوة بخطوة لأدوات الذكاء الاصطناعي الحديثة",
  },
  { icon: Cpu, title: "أدوات AI", desc: "استعراض ومقارنة أحدث النماذج والتطبيقات" },
  { icon: Newspaper, title: "أخبار موثوقة", desc: "تحديث يومي لأهم أخبار عالم الذكاء الاصطناعي" },
  { icon: Wrench, title: "موارد مجانية", desc: "قوالب، إضافات، ونصائح للمحترفين والمبتدئين" },
];

function HomePage() {
  const { data } = useSuspenseQuery(postsQueryOptions);
  const { data: labels } = useSuspenseQuery(labelsQueryOptions);
  const posts = data.posts;
  const featured = posts[0];
  const rest = posts.slice(1, 7);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        {/* HERO */}
        <section className="relative hero-bg overflow-hidden">
          <div className="absolute inset-0 mesh-bg opacity-40 pointer-events-none" />
          <div className="container-page relative py-20 md:py-28 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 backdrop-blur px-4 py-1.5 text-xs font-medium text-muted-foreground mb-6 shadow-soft">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              أكاديميتك العربية للذكاء الاصطناعي
            </div>
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight">
              تعلّم <span className="gradient-text">الذكاء الاصطناعي</span>
              <br />
              بالعربية، بطريقة احترافية
            </h1>
            <p className="mt-6 mx-auto max-w-2xl text-lg text-muted-foreground leading-relaxed">
              دروس عملية، مراجعات لأحدث الأدوات، وأخبار موثوقة من عالم الـ AI — Grok، Claude،
              Gemini، Llama وأكثر.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/posts"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-elegant transition-all hover:opacity-90"
              >
                استكشف المقالات
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <Link
                to="/posts"
                search={{ label: "دروس" }}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-6 py-3 text-sm font-semibold text-foreground hover:bg-accent"
              >
                ابدأ بدرس عملي
              </Link>
            </div>

            {/* stats */}
            <div className="mt-14 grid grid-cols-3 gap-6 max-w-2xl mx-auto">
              {[
                { n: `${data.total}+`, l: "مقال" },
                { n: `${labels.length}`, l: "تصنيف" },
                { n: "يومي", l: "تحديث" },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl md:text-4xl font-extrabold gradient-text">{s.n}</div>
                  <div className="text-xs md:text-sm text-muted-foreground mt-1">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="container-page py-16 md:py-24">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold">ما تجده في الأكاديمية</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              محتوى منظّم لمساعدتك على إتقان الذكاء الاصطناعي بخطوات واضحة.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="group rounded-2xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-elegant hover:-translate-y-0.5"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-primary mb-4">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-bold">{f.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* LATEST POSTS */}
        <section className="container-page py-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-bold">أحدث المقالات</h2>
              <p className="mt-2 text-muted-foreground">
                اقرأ آخر ما نشرناه في عالم الذكاء الاصطناعي
              </p>
            </div>
            <Link
              to="/posts"
              className="hidden md:inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              عرض الكل <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>

          {featured && (
            <div className="mb-6">
              <PostCard post={featured} featured />
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>

        {/* CATEGORIES */}
        {labels.length > 0 && (
          <section className="container-page py-16 md:py-24">
            <div className="rounded-3xl bg-gradient-to-br from-accent/60 to-surface-muted border border-border p-10 md:p-14 text-center">
              <h2 className="font-display text-3xl md:text-4xl font-bold">تصفّح حسب التصنيف</h2>
              <p className="mt-3 text-muted-foreground">اختر مجال اهتمامك وابدأ رحلتك</p>
              <div className="mt-8 flex flex-wrap justify-center gap-2">
                {labels.slice(0, 14).map((l) => (
                  <Link
                    key={l.label}
                    to="/posts"
                    search={{ label: l.label }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium hover:border-primary hover:text-primary transition-colors shadow-card"
                  >
                    {l.label}
                    <span className="text-xs text-muted-foreground">({l.count})</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
