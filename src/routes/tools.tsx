import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/tools")({
  head: () => ({
    meta: [
      { title: "أدوات الذكاء الاصطناعي — Bouiba Academy" },
      {
        name: "description",
        content:
          "مجموعة أدوات ذكاء اصطناعي عربية مجانية: تحويل النص إلى صورة، تلخيص المقالات، توليد الأفكار، الترجمة، ومساعد SEO.",
      },
      { property: "og:title", content: "أدوات الذكاء الاصطناعي — Bouiba Academy" },
      {
        property: "og:description",
        content: "أدوات AI مجانية تعمل مباشرة داخل موقع Bouiba Academy.",
      },
      { property: "og:url", content: "https://edu.bouibacademy.me/tools" },
    ],
    links: [{ rel: "canonical", href: "https://edu.bouibacademy.me/tools" }],
  }),
  component: ToolsLayout,
});

function ToolsLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
