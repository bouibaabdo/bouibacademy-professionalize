import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { buildUrlset, SITEMAP_BASE_URL, xmlResponse, type SitemapEntry } from "@/lib/sitemap-utils";

export const Route = createFileRoute("/sitemap-tools.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/tools", changefreq: "weekly", priority: "0.8" },
          { path: "/tools/image", changefreq: "monthly", priority: "0.7" },
          { path: "/tools/summarize", changefreq: "monthly", priority: "0.7" },
          { path: "/tools/ideas", changefreq: "monthly", priority: "0.7" },
          { path: "/tools/translate", changefreq: "monthly", priority: "0.7" },
          { path: "/tools/seo", changefreq: "monthly", priority: "0.7" },
        ];
        return xmlResponse(buildUrlset(SITEMAP_BASE_URL, entries));
      },
    },
  },
});
