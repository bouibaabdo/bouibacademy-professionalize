import { createFileRoute } from "@tanstack/react-router";
import { Lightbulb } from "lucide-react";
import { TextToolShell } from "@/components/text-tool-shell";

export const Route = createFileRoute("/tools/ideas")({
  head: () => ({
    meta: [
      { title: "مولّد أفكار المقالات — أدوات AI | Bouiba Academy" },
      { name: "description", content: "احصل على 8 عناوين مقالات جذابة ومحسّنة لمحركات البحث." },
      { property: "og:title", content: "مولّد أفكار المقالات — Bouiba Academy" },
      { property: "og:description", content: "أدخل موضوعًا واحصل على عناوين مقالات عربية جاهزة ومحسّنة لمحركات البحث." },
      { property: "og:url", content: "https://www.bouibacademy.me/tools/ideas" },
    ],
    links: [{ rel: "canonical", href: "https://www.bouibacademy.me/tools/ideas" }],
  }),
  component: () => (
    <TextToolShell
      action="ideas"
      icon={Lightbulb}
      title="مولّد أفكار المقالات"
      description="أدخل موضوعًا عامًا واحصل على عناوين مقالات جاهزة للنشر."
      placeholder="مثال: الذكاء الاصطناعي التوليدي في التعليم"
      ctaLabel="ولّد الأفكار"
      minRows={3}
    />
  ),
});
