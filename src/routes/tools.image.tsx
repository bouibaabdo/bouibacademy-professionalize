import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ImageIcon, Loader2, Download, ArrowRight } from "lucide-react";


export const Route = createFileRoute("/tools/image")({
  head: () => ({
    meta: [
      { title: "تحويل النص إلى صورة — أدوات AI | Bouiba Academy" },
      {
        name: "description",
        content: "أنشئ صورًا احترافية بالذكاء الاصطناعي من وصف نصي — أداة مجانية بالعربية.",
      },
      { property: "og:title", content: "تحويل النص إلى صورة — Bouiba Academy" },
      { property: "og:description", content: "أنشئ صورًا احترافية بالذكاء الاصطناعي من وصف نصي بالعربية أو الإنجليزية." },
      { property: "og:url", content: "https://www.bouibacademy.me/tools/image" },
    ],
    links: [{ rel: "canonical", href: "https://www.bouibacademy.me/tools/image" }],
  }),
  component: ImageTool,
});

function ImageTool() {
  const [prompt, setPrompt] = useState("");
  const [src, setSrc] = useState<string | null>(null);
  const [isFinal, setIsFinal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);
    setSrc(null);
    setIsFinal(false);
    try {
      const res = await fetch("/api/tools/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        dataUrl?: string;
        error?: string;
      };
      if (!res.ok || !data.dataUrl) {
        throw new Error(data.error || `فشل التوليد: ${res.status}`);
      }
      setSrc(data.dataUrl);
      setIsFinal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="container-page py-10 md:py-16 max-w-4xl">
      <Link
        to="/tools"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowRight className="h-4 w-4" />
        كل الأدوات
      </Link>

      <div className="flex items-center gap-3 mb-2">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
          <ImageIcon className="h-5 w-5 text-primary" />
        </span>
        <h1 className="font-display text-3xl md:text-4xl font-extrabold">تحويل النص إلى صورة</h1>
      </div>
      <p className="text-muted-foreground mb-8">
        صف الصورة التي تريدها بالعربية أو الإنجليزية، وسيقوم الذكاء الاصطناعي بإنشائها لك.
      </p>

      <form onSubmit={generate} className="space-y-4">
        <label htmlFor="image-prompt" className="sr-only">وصف الصورة</label>
        <textarea
          id="image-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="مثال: قط برتقالي يجلس على مكتب خشبي أمام نافذة تطل على مدينة ليلية، إضاءة سينمائية"
          rows={4}
          aria-label="وصف الصورة المطلوبة"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-soft transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              جارٍ التوليد...
            </>
          ) : (
            <>
              <ImageIcon className="h-4 w-4" />
              أنشئ الصورة
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="mt-6 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {src && (
        <div className="mt-8">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-muted/40 shadow-elegant">
            <img
              src={src}
              alt={prompt}
              className={`w-full h-auto transition-[filter] duration-500 ${isFinal ? "blur-0" : "blur-2xl"}`}
            />
          </div>
          {isFinal && (
            <a
              href={src}
              download="bouiba-ai-image.png"
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-accent"
            >
              <Download className="h-4 w-4" />
              تحميل الصورة
            </a>
          )}
        </div>
      )}
    </section>
  );
}
