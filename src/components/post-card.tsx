import { Link } from "@tanstack/react-router";
import { Clock, ArrowLeft } from "lucide-react";
import { optimizeBloggerImage, type BloggerPost } from "@/lib/blogger.functions";

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function PostCard({ post, featured = false, priority = false }: { post: BloggerPost; featured?: boolean; priority?: boolean }) {
  const w = featured ? 1200 : 800;
  const h = featured ? 675 : 500;
  const src = optimizeBloggerImage(post.thumbnail, w, h);
  const src2x = optimizeBloggerImage(post.thumbnail, w * 2, h * 2);
  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all hover:shadow-elegant hover:-translate-y-0.5 ${
        featured ? "md:col-span-2 md:row-span-2" : ""
      }`}
    >
      <Link
        to="/posts/$id"
        params={{ id: post.id }}
        className="block"
      >
        {post.thumbnail && (
          <div className={`overflow-hidden bg-surface-muted ${featured ? "aspect-[16/9]" : "aspect-[16/10]"}`}>
            <img
              src={src}
              srcSet={src && src2x ? `${src} 1x, ${src2x} 2x` : undefined}
              width={w}
              height={h}
              alt={post.title}
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "auto"}
              decoding="async"
              sizes={featured ? "(min-width: 768px) 800px, 100vw" : "(min-width: 768px) 400px, 100vw"}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        )}
        <div className="p-5">
          {post.labels[0] && (
            <span className="inline-block text-xs font-semibold text-primary bg-accent px-2.5 py-1 rounded-md mb-3">
              {post.labels[0]}
            </span>
          )}
          <h3
            className={`font-display font-bold leading-snug text-foreground group-hover:text-primary transition-colors ${
              featured ? "text-2xl md:text-3xl" : "text-lg"
            }`}
          >
            {post.title}
          </h3>
          <p className={`text-muted-foreground mt-2 ${featured ? "text-base line-clamp-3" : "text-sm line-clamp-2"}`}>
            {post.excerpt}
          </p>
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatDate(post.published)}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {post.readingMinutes} دقائق
            </span>
          </div>
          <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
            اقرأ المزيد
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          </div>
        </div>
      </Link>
    </article>
  );
}
