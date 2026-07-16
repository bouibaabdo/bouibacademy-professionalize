import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2, Copy, Check, ArrowRight, type LucideIcon } from "lucide-react";

type Props = {
  action: "summarize" | "ideas" | "translate" | "seo";
  title: string;
  description: string;
  icon: LucideIcon;
  placeholder: string;
  ctaLabel: string;
  minRows?: number;
  showTargetLang?: boolean;
  renderMarkdown?: boolean;
};

export function TextToolShell({
  action,
  title,
  description,
  icon: Icon,
  placeholder,
  ctaLabel,
  minRows = 6,
  showTargetLang = false,
  renderMarkdown = false,
}: Props) {
  const [input, setInput] = useState("");
  const [target, setTarget] = useState<"ar" | "en" | "fr">("en");
  const [output, setOutput] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    setLoading(true);
    setError(null);
    setOutput("");
    try {
      const res = await fetch("/api/tools/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, input: input.trim(), target }),
      });
      const data = (await res.json().catch(() => ({}))) as { text?: string; error?: string };
      if (!res.ok) {
        setError(data.error || `فشل الطلب: ${res.status}`);
      } else {
        setOutput(data.text || "");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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
          <Icon className="h-5 w-5 text-primary" />
        </span>
        <h1 className="font-display text-3xl md:text-4xl font-extrabold">{title}</h1>
      </div>
      <p className="text-muted-foreground mb-8">{description}</p>

      <form onSubmit={run} className="space-y-4">
        {showTargetLang && (
          <div className="flex items-center gap-2">
            <label htmlFor="tool-target-lang" className="text-sm font-medium text-muted-foreground">الترجمة إلى:</label>
            <select
              id="tool-target-lang"
              value={target}
              onChange={(e) => setTarget(e.target.value as "ar" | "en" | "fr")}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              disabled={loading}
              aria-label="لغة الترجمة المستهدفة"
            >
              <option value="en">الإنجليزية</option>
              <option value="ar">العربية</option>
              <option value="fr">الفرنسية</option>
            </select>
          </div>
        )}
        <label htmlFor="tool-input" className="sr-only">{title}</label>
        <textarea
          id="tool-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          rows={minRows}
          aria-label={title}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-soft transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              جارٍ المعالجة...
            </>
          ) : (
            <>
              <Icon className="h-4 w-4" />
              {ctaLabel}
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="mt-6 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {output && (
        <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-bold">النتيجة</h2>
            <button
              onClick={copy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-accent"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "تم النسخ" : "نسخ"}
            </button>
          </div>
          <div
            className={
              renderMarkdown
                ? "prose-ar text-foreground whitespace-pre-wrap leading-relaxed"
                : "text-foreground whitespace-pre-wrap leading-relaxed"
            }
          >
            {output}
          </div>
        </div>
      )}
    </section>
  );
}
