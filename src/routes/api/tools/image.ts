import { createFileRoute } from "@tanstack/react-router";

type GeminiPart = {
  inlineData?: { data: string; mimeType: string };
  inline_data?: { data: string; mimeType?: string; mime_type?: string };
  text?: string;
};

export const Route = createFileRoute("/api/tools/image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { prompt } = (await request.json()) as { prompt?: string };
        if (!prompt || typeof prompt !== "string" || prompt.trim().length < 3) {
          return new Response(JSON.stringify({ error: "الوصف مطلوب" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        if (prompt.length > 1000) {
          return new Response(
            JSON.stringify({ error: "الوصف طويل جدًا (الحد الأقصى 1000 حرف)." }),
            {
              status: 413,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
        // Enforce admin enable/disable toggle server-side
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: tool } = await supabaseAdmin
            .from("admin_ai_tools")
            .select("enabled")
            .eq("tool_key", "image")
            .maybeSingle();
          if (tool && tool.enabled === false) {
            return new Response(JSON.stringify({ error: "هذه الأداة معطّلة حاليًا." }), {
              status: 403,
              headers: { "Content-Type": "application/json" },
            });
          }
        } catch {
          // fail open on lookup errors
        }
        const key = process.env.GEMINI_API_KEY;
        if (!key) {
          return new Response(JSON.stringify({ error: "لم يتم إعداد مفتاح Gemini API" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        const model = "gemini-2.5-flash-image";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

        const upstream = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt.trim() }] }],
            generationConfig: { responseModalities: ["IMAGE"] },
          }),
        });

        if (!upstream.ok) {
          const text = await upstream.text().catch(() => "");
          let msg = "فشل توليد الصورة";
          try {
            const j = JSON.parse(text) as { error?: { message?: string } };
            if (j?.error?.message) msg = j.error.message;
          } catch {
            if (text) msg = text;
          }
          return new Response(JSON.stringify({ error: msg }), {
            status: upstream.status,
            headers: { "Content-Type": "application/json" },
          });
        }

        const data = (await upstream.json()) as {
          candidates?: Array<{ content?: { parts?: GeminiPart[] } }>;
        };

        const parts = data.candidates?.[0]?.content?.parts ?? [];
        for (const p of parts) {
          const inline = p.inlineData ?? p.inline_data;
          if (inline?.data) {
            const mime =
              inline.mimeType ??
              (p.inline_data as { mime_type?: string })?.mime_type ??
              "image/png";
            return new Response(JSON.stringify({ dataUrl: `data:${mime};base64,${inline.data}` }), {
              headers: { "Content-Type": "application/json" },
            });
          }
        }

        return new Response(
          JSON.stringify({ error: "لم يُرجع النموذج أي صورة — جرّب وصفًا مختلفًا" }),
          { status: 502, headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});
