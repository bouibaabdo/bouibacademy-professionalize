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

async function fetchFeed(
  params: Record<string, string>,
): Promise<{ posts: BloggerPost[]; total: number }> {
  const url = new URL(FEED_BASE);
  url.searchParams.set("alt", "json");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Blogger feed failed: ${res.status}`);
  const json = (await res.json()) as {
    feed: {
      entry?: RawEntry[];
      openSearch$totalResults?: { $t: string };
    };
  };
  const entries = json.feed.entry ?? [];
  return {
    posts: entries.map(transformEntry),
    total: Number(json.feed.openSearch$totalResults?.$t ?? entries.length),
  };
}

export const getPosts = createServerFn({ method: "GET" })
  .inputValidator((d: { max?: number; label?: string; start?: number } | undefined) => d ?? {})
  .handler(async ({ data }) => {
    const params: Record<string, string> = {
      "max-results": String(data.max ?? 20),
      "start-index": String(data.start ?? 1),
    };
    const url = data.label ? `${FEED_BASE}/-/${encodeURIComponent(data.label)}` : FEED_BASE;
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
  .inputValidator((d: { id: string }) => d)
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
