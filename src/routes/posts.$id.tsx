import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Calendar, Clock, ArrowRight, ExternalLink, Tag } from "lucide-react";
import { getPost } from "@/lib/blogger.functions";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TodayMatchesRail } from "@/components/today-matches-rail";

function makeQuery(id: string) {
  return queryOptions({
    queryKey: ["post", id],
    queryFn: () => getPost({ data: { id } }),
    staleTime: 10 * 60_000,
  });
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("ar-EG-u-nu-latn", { year: "numeric", month: "long", day: "numeric" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export const Route = createFileRoute("/posts/$id")({
  loader: async ({ context, params }) => {
    const post = await context.queryClient.ensureQueryData(makeQuery(params.id));
    if (!post) throw notFound();
    return post;
  },
  head: ({ params, loaderData }) => {
    const post = loaderData;
    const SUFFIX = " — Bouiba Academy";
    const maxTitle = 60 - SUFFIX.length;
    const rawTitle = post?.title ?? "مقال";
    const shortTitle = rawTitle.length > maxTitle ? rawTitle.slice(0, maxTitle - 1).trimEnd() + "…" : rawTitle;
    const title = `${shortTitle}${SUFFIX}`;
    const desc = post ? post.excerpt.slice(0, 160) : "مقال من أكاديمية بويبة للذكاء الاصطناعي.";
    const canonical = `https://www.bouibacademy.me/posts/${params.id}`;
    const meta: Array<Record<string, string>> = [
      { title },
      { name: "description", content: desc },
      { property: "og:type", content: "article" },
      { property: "og:title", content: post?.title ?? "مقال — Bouiba Academy" },
      { property: "og:description", content: desc },
      { property: "og:url", content: canonical },
    ];
    if (post?.thumbnail) {
      meta.push({ property: "og:image", content: post.thumbnail });
      meta.push({ name: "twitter:image", content: post.thumbnail });
    }
    return {
      meta,
      links: [{ rel: "canonical", href: canonical }],
      scripts: post
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Article",
                headline: post.title,
                datePublished: post.published,
                dateModified: post.updated,
                author: { "@type": "Person", name: post.author },
                image: post.thumbnail,
                mainEntityOfPage: canonical,
                publisher: { "@type": "Organization", name: "Bouiba Academy" },
              }),
            },
          ]
        : [],
    };
  },
  component: PostPage,
  errorComponent: ({ error }) => (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container-page py-20 text-center text-muted-foreground">تعذر التحميل: {error.message}</div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container-page py-20 text-center">
        <h1 className="text-3xl font-bold">المقال غير موجود</h1>
        <Link to="/posts" className="mt-6 inline-block text-primary font-semibold">← العودة للمقالات</Link>
      </div>
    </div>
  ),
});

function PostPage() {
  const { id } = Route.useParams();
  const { data: post } = useSuspenseQuery(makeQuery(id));

  if (!post) return null;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <article>
        {/* Header */}
        <header className="hero-bg border-b border-border">
          <div className="container-page max-w-3xl py-14 md:py-20">
            <Link to="/posts" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6">
              <ArrowRight className="h-4 w-4" /> جميع المقالات
            </Link>
            <div className="flex flex-wrap gap-2 mb-4">
              {post.labels.map((l) => (
                <Link
                  key={l}
                  to="/posts"
                  search={{ label: l }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-accent px-2.5 py-1 rounded-md hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Tag className="h-3 w-3" /> {l}
                </Link>
              ))}
            </div>
            <h1 className="font-display text-3xl md:text-5xl font-extrabold leading-tight">
              {post.title}
            </h1>
            <div className="mt-6 flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" /> {formatDate(post.published)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> {post.readingMinutes} دقائق قراءة
              </span>
              <span>بواسطة {post.author}</span>
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="container-page max-w-3xl py-12">
          <div
            className="prose-ar"
            // Blogger content is trusted (own blog)
            dangerouslySetInnerHTML={{ __html: post.contentHtml }}
          />

          <div className="mt-12 pt-8 border-t border-border">
            <a
              href={post.url}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              عرض المقال على المدونة الأصلية
            </a>
          </div>
        </div>
      </article>

      <TodayMatchesRail variant="article" max={8} />

      <SiteFooter />
    </div>
  );
}
