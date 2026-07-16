import { createServerFn } from "@tanstack/react-start";

const FEED_BASE = "https://academybouiba.blogspot.com/feeds/posts/default";

export interface BloggerPost {
  id: string;
  slug: string;
  title: string;
  published: string;
  updated: string;
  author: string;
  authorImage?: string;
  labels: string[];
  contentHtml: string;
  excerpt: string;
  thumbnail?: string;
  url: string;
  readingMinutes: number;
}

interface RawEntry {
  id: { $t: string };
  published: { $t: string };
  updated: { $t: string };
  title: { $t: string };
  content: { $t: string };
  category?: Array<{ term: string }>;
  author?: Array<{
    name: { $t: string };
    gd$image?: { src: string };
  }>;
  link: Array<{ rel: string; href: string; type?: string }>;
  media$thumbnail?: { url: string };
}

function extractPostId(rawId: string): string {
  const m = rawId.match(/post-(\d+)/);
  return m ? m[1] : rawId;
}

function extractSlug(links: RawEntry["link"]): string {
  const alt = links.find((l) => l.rel === "alternate");
  if (!alt) return "";
  try {
    const u = new URL(alt.href);
    return u.pathname.replace(/^\/+|\.html$|\/+$/g, "").replace(/\//g, "-");
  } catch {
    return "";
  }
}

function extractThumbnail(html: string, media?: { url: string }): string | undefined {
  if (media?.url) return media.url.replace(/\/s\d+(-c)?\//, "/s1600/");
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m?.[1];
}

/**
 * Optimize any remote image URL to serve WebP at a target size.
 * - googleusercontent/blogger: native `=wXXX-hYYY-c-rw` transform (no proxy).
 * - other remote hosts (manuscdn, picsum, pollinations, yalladown, ...):
 *   proxied through images.weserv.nl (free CDN, returns WebP at requested size).
 * - data URIs or same-origin (`/…`): returned unchanged.
 * For Google URLs that already carry a `=...` suffix, the suffix is replaced
 * (not appended twice) so the transform is always honored.
 */
export function optimizeBloggerImage(url: string | undefined, w: number, h: number): string | undefined {
  if (!url) return url;
  if (url.startsWith("data:") || url.startsWith("/")) return url;
  try {
    const u = new URL(url);
    if (/googleusercontent\.com$|blogspot\.com$|blogger\.com$/.test(u.hostname)) {
      const spec = `w${w}-h${h}-c-rw`;
      if (/\/s\d+(-c)?\//.test(u.pathname)) {
        u.pathname = u.pathname.replace(/\/s\d+(-c)?\//, `/${spec}/`);
        return u.toString();
      }
      if (/\/w\d+-h\d+[^/]*\//.test(u.pathname)) {
        u.pathname = u.pathname.replace(/\/w\d+-h\d+[^/]*\//, `/${spec}/`);
        return u.toString();
      }
      const base = u.origin + u.pathname; // strip any `=...` suffix or query
      return `${base}=${spec}`;
    }
    if (u.protocol === "https:" || u.protocol === "http:") {
      const src = `${u.hostname}${u.pathname}${u.search}`;
      return `https://images.weserv.nl/?url=${encodeURIComponent(src)}&w=${w}&h=${h}&fit=cover&output=webp&q=78`;
    }
    return url;
  } catch {
    return url;
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function transformEntry(entry: RawEntry): BloggerPost {
  const id = extractPostId(entry.id.$t);
  const contentHtml = entry.content?.$t ?? "";
  const plain = stripHtml(contentHtml);
  const words = plain.split(/\s+/).length;
  const alt = entry.link.find((l) => l.rel === "alternate");
  return {
    id,
    slug: extractSlug(entry.link) || id,
    title: entry.title.$t,
    published: entry.published.$t,
    updated: entry.updated.$t,
    author: entry.author?.[0]?.name.$t ?? "AcademyBouiba",
    authorImage: entry.author?.[0]?.gd$image?.src,
    labels: (entry.category ?? []).map((c) => c.term),
    contentHtml,
    excerpt: plain.slice(0, 200),
    thumbnail: extractThumbnail(contentHtml, entry.media$thumbnail),
    url: alt?.href ?? `https://www.bouibacademy.me/`,
    readingMinutes: Math.max(1, Math.round(words / 200)),
  };
}

async function fetchFeed(params: Record<string, string>): Promise<{ posts: BloggerPost[]; total: number }> {
  const url = new URL(FEED_BASE);
  url.searchParams.set("alt", "json");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  let res: Response;
  try {
    res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  } catch (e) {
    console.error("Blogger fetch error:", e);
    return { posts: [], total: 0 };
  }
  if (!res.ok) {
    console.error(`Blogger feed failed: ${res.status}`);
    return { posts: [], total: 0 };
  }
  const json = (await res.json().catch(() => null)) as {
    feed: {
      entry?: RawEntry[];
      openSearch$totalResults?: { $t: string };
    };
  } | null;
  if (!json?.feed) return { posts: [], total: 0 };
  const entries = json.feed.entry ?? [];
  return {
    posts: entries.map(transformEntry),
    total: Number(json.feed.openSearch$totalResults?.$t ?? entries.length),
  };
}

export const getPosts = createServerFn({ method: "GET" })
.validator((d) => d ?? {})
  .handler(async ({ data }) => {
    const params: Record<string, string> = {
      "max-results": String(data.max ?? 20),
      "start-index": String(data.start ?? 1),
    };
    const url = data.label
      ? `${FEED_BASE}/-/${encodeURIComponent(data.label)}`
      : FEED_BASE;
    const q = new URL(url);
    q.searchParams.set("alt", "json");
    Object.entries(params).forEach(([k, v]) => q.searchParams.set(k, v));
    const res = await fetch(q.toString(), { headers: { Accept: "application/json" } });
    if (!res.ok) return { posts: [], total: 0 };
    const json = (await res.json()) as {
      feed: { entry?: RawEntry[]; openSearch$totalResults?: { $t: string } };
    };
    const entries = json.feed.entry ?? [];
    return {
      posts: entries.map(transformEntry),
      total: Number(json.feed.openSearch$totalResults?.$t ?? entries.length),
    };
  });

export const getPost = createServerFn({ method: "GET" })
  .validator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const url = `${FEED_BASE}/${data.id}?alt=json`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const json = (await res.json()) as { entry: RawEntry };
    if (!json.entry) return null;
    return transformEntry(json.entry);
  });

export const getLabels = createServerFn({ method: "GET" }).handler(async () => {
  // Fetch a large batch and extract unique labels with counts
  const result = await fetchFeed({ "max-results": "150" });
  const counts = new Map<string, number>();
  result.posts.forEach((p) => {
    p.labels.forEach((l) => counts.set(l, (counts.get(l) ?? 0) + 1));
  });
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
});
