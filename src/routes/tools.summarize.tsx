import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { TextToolShell } from "@/components/text-tool-shell";

export const Route = createFileRoute("/tools/summarize")({
  head: () => ({
    meta: [
      { title: "تلخيص المقالات — أدوات AI | Bouiba Academy" },
      { name: "description", content: "أداة عربية لتلخيص المقالات الطويلة في نقاط واضحة." },
      { property: "og:title", content: "تلخيص المقالات — Bouiba Academy" },
      { property: "og:description", content: "لخّص أي مقال طويل إلى نقاط عربية موجزة خلال ثوانٍ." },
      { property: "og:url", content: "https://edu.bouibacademy.me/tools/summarize" },
    ],
    links: [{ rel: "canonical", href: "https://edu.bouibacademy.me/tools/summarize" }],
  }),
  component: () => (
    <TextToolShell
      action="summarize"
      icon={FileText}
      title="تلخيص المقالات"
      description="الصق مقالًا طويلًا واحصل على ملخّص عربي في نقاط موجزة."
      placeholder="الصق هنا نص المقال الذي تريد تلخيصه..."
      ctaLabel="لخّص الآن"
      minRows={10}
    />
  ),
});
