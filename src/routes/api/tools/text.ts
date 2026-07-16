import { createFileRoute } from "@tanstack/react-router";

type Action = "summarize" | "ideas" | "translate" | "seo" | "roadmap";

type Body = {
  action?: Action;
  input?: string;
  target?: "ar" | "en" | "fr";
};

const SYSTEM: Record<Action, (b: Body) => string> = {
  summarize: () =>
    "أنت مساعد عربي متخصص في تلخيص المقالات. لخّص النص التالي في 5-7 نقاط واضحة وموجزة باللغة العربية الفصحى. أعد فقط الملخص بصيغة قائمة نقطية دون مقدمات.",
  ideas: () =>
    "أنت خبير محتوى في مجال الذكاء الاصطناعي والتقنية. اقترح 8 عناوين مقالات جذابة ومحسّنة لمحركات البحث حول الموضوع التالي. أعدها كقائمة مرقّمة باللغة العربية فقط.",
  translate: (b) => {
    const t = b.target === "en" ? "الإنجليزية" : b.target === "fr" ? "الفرنسية" : "العربية";
    return `أنت مترجم محترف. ترجم النص التالي إلى ${t} بأسلوب طبيعي واحترافي، مع الحفاظ على المعنى والسياق. أعد الترجمة فقط دون شرح.`;
  },
  seo: () =>
    "أنت خبير SEO عربي. حلّل الموضوع التالي وأعد استجابة منسّقة بصيغة Markdown تحتوي على: عنوان SEO (أقل من 60 حرف)، وصف Meta (أقل من 160 حرف)، 10 كلمات مفتاحية مقترحة، وهيكل عناوين (H2/H3) مقترح للمقال.",
  roadmap: () =>
    `أنت خبير تعليمي ومستشار خرائط ذهنية ذكي ومحترف. قم بإنشاء خريطة ذهنية ومسار تعليمي (Roadmap) تفصيلي وتفاعلي حول الموضوع المدخل.
يجب أن ترجع استجابتك بصيغة JSON صالحة بنسبة 100% فقط دون أي نصوص خارج الـ JSON.
تنسيق الـ JSON المطلوب:
{
  "title": "عنوان مسار التعلم",
  "description": "وصف موجز للمسار وأهميته",
  "difficulty": "مبتدئ" | "متوسط" | "متقدم",
  "duration": "المدة التقريبية المقترحة (مثال: 3 أشهر)",
  "nodes": [
    {
      "id": "معرف فريد (مثال: step1)",
      "label": "عنوان المرحلة أو الخطوة (مثال: أساسيات HTML)",
      "description": "شرح مبسط ومختصر لما سيتعلمه الطالب في هذه الخطوة",
      "duration": "المدة المقترحة لهذه الخطوة (مثال: أسبوعان)",
      "status": "core" | "optional",
      "skills": ["مهارة 1", "مهارة 2"],
      "resources": [
        { "title": "عنوان مصدر مقترح", "type": "article" | "video" | "course", "link": "رابط أو اسم مصدر تعليمي عام" }
      ],
      "next": ["المعرف الفريد للمرحلة التالية (مثال: step2)"]
    }
  ]
}
تأكد من أن الـ JSON منسق بشكل صحيح ويمكن عمل JSON.parse() له بسهولة. لا تضعه داخل وسم \`\`\`json، فقط أعد كائن الـ JSON مباشرة.`,
};

export const Route = createFileRoute("/api/tools/text")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as Body;
        const { action, input } = body;
        if (!action || !SYSTEM[action]) {
          return new Response("invalid action", { status: 400 });
        }
        if (!input || typeof input !== "string" || input.trim().length < 3) {
          return new Response("input is required", { status: 400 });
        }
        if (input.length > 10000) {
          return Response.json({ error: "النص طويل جدًا (الحد الأقصى 10000 حرف)." }, { status: 413 });
        }
        // Enforce admin enable/disable toggle server-side
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: tool } = await supabaseAdmin
            .from("admin_ai_tools")
            .select("enabled")
            .eq("tool_key", action)
            .maybeSingle();
          if (tool && tool.enabled === false) {
            return Response.json({ error: "هذه الأداة معطّلة حاليًا." }, { status: 403 });
          }
        } catch {
          // fail open on lookup errors to avoid breaking the tool
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: SYSTEM[action](body) },
              { role: "user", content: input.trim() },
            ],
          }),
        });

        if (!upstream.ok) {
          const text = await upstream.text().catch(() => "");
          if (upstream.status === 429) {
            return Response.json({ error: "تم تجاوز الحد المسموح. حاول لاحقًا." }, { status: 429 });
          }
          if (upstream.status === 402) {
            return Response.json({ error: "الرصيد غير كافٍ. الرجاء إضافة رصيد." }, { status: 402 });
          }
          return Response.json({ error: text || "فشل الطلب" }, { status: upstream.status });
        }
        const data = (await upstream.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        let text = data.choices?.[0]?.message?.content ?? "";
        if (action === "roadmap") {
          text = text.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
        }
        return Response.json({ text });
      },
    },
  },
});
