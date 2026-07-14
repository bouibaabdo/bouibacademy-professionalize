import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://edu.bouibacademy.me";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const today = new Date().toISOString().split("T")[0];
        const sitemaps = [
          { loc: `${BASE_URL}/sitemap-pages.xml`, lastmod: today },
          { loc: `${BASE_URL}/sitemap-posts.xml`, lastmod: today },
          { loc: `${BASE_URL}/sitemap-tools.xml`, lastmod: today },
          { loc: `${BASE_URL}/sitemap-worldcup.xml`, lastmod: today },
        ];

        const body = sitemaps
          .map(
            (s) =>
              `  <sitemap>\n    <loc>${s.loc}</loc>\n    <lastmod>${s.lastmod}</lastmod>\n  </sitemap>`,
          )
          .join("\n");

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          body,
          `</sitemapindex>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
