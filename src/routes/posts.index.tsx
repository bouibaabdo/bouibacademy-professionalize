import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import { getPosts, getLabels } from "@/lib/blogger.functions";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PostCard } from "@/components/post-card";

const searchSchema = z.object({
  label: z.string().optional(),
});

function makeQuery(label?: string) {
  return queryOptions({
    queryKey: ["posts", "list", label ?? "all"],
    queryFn: () => getPosts({ data: { max: 30, label } }),
    staleTime: 5 * 60_000,
  });
}

const labelsQO = queryOptions({
  queryKey: ["labels"],
  queryFn: () => getLabels(),
  staleTime: 10 * 60_000,
});

export const Route = createFileRoute("/posts/")({
  validateSearch: zodValidator(searchSchema),
  loaderDeps: ({ search }) => ({ label: search.label }),
  loader: async ({ context, deps }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(makeQuery(deps.label)),
      context.queryClient.ensureQueryData(labelsQO),
    ]);
  },
  head: () => ({
    meta: [
      { title: "المقالات — Bouiba Academy" },
      {
        name: "description",
        content: "تصفح جميع مقالات ودروس أكاديمية بويبة في الذكاء الاصطناعي.",
      },
      { property: "og:title", content: "المقالات — Bouiba Academy" },
      {
        property: "og:description",
        content: "مكتبة كاملة من الدروس والمقالات العربية حول أدوات وتطبيقات الذكاء الاصطناعي.",
      },
      { property: "og:url", content: "https://edu.bouibacademy.me/posts" },
    ],
    links: [{ rel: "canonical", href: "https://edu.bouibacademy.me/posts" }],
  }),
  component: PostsPage,
  errorComponent: ({ error }) => (
    <div className="p-10 text-center text-muted-foreground">تعذر التحميل: {error.message}</div>
  ),
  notFoundComponent: () => <div className="p-10 text-center">لا توجد مقالات.</div>,
});

function PostsPage() {
  const { label } = Route.useSearch();
  const { data } = useSuspenseQuery(makeQuery(label));
  const { data: labels } = useSuspenseQuery(labelsQO);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="hero-bg border-b border-border">
          <div className="container-page py-14 md:py-20 text-center">
            <p className="text-sm font-semibold text-primary mb-3">المكتبة</p>
            <h1 className="font-display text-4xl md:text-5xl font-extrabold">
              {label ? (
                <>
                  مقالات: <span className="gradient-text">{label}</span>
                </>
              ) : (
                "جميع المقالات"
              )}
            </h1>
            <p className="mt-4 text-muted-foreground">{data.total} مقال منشور</p>
          </div>
        </section>

        <div className="container-page py-10">
          {/* filters */}
          <div className="mb-8 flex flex-wrap gap-2 justify-center">
            <Link
              to="/posts"
              search={{}}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                !label
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-surface border-border hover:border-primary hover:text-primary"
              }`}
            >
              الكل
            </Link>
            {labels.slice(0, 12).map((l) => (
              <Link
                key={l.label}
                to="/posts"
                search={{ label: l.label }}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                  label === l.label
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-surface border-border hover:border-primary hover:text-primary"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <h2 className="sr-only">قائمة المقالات</h2>
          {data.posts.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              لا توجد مقالات في هذا التصنيف بعد.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.posts.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
