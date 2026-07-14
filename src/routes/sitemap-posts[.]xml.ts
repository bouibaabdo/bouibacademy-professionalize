import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { getPosts } from "@/lib/blogger.functions";
import { buildUrlset, SITEMAP_BASE_URL, xmlResponse, type SitemapEntry } from "@/lib/sitemap-utils";

export const Route = createFileRoute("/sitemap-posts.xml")({
  server: {
    handlers: {
      GET: async () => {
        const result = await getPosts({ data: { max: 500 } });

        const entries: SitemapEntry[] = result.posts.map((post) => ({
          path: `/posts/${post.id}`,
          lastmod: post.updated.split("T")[0],
          changefreq: "weekly",
          priority: "0.8",
        }));

        return xmlResponse(buildUrlset(SITEMAP_BASE_URL, entries));
      },
    },
  },
});
