import { createFileRoute, Link } from "@tanstack/react-router";
import { ImageIcon, FileText, Lightbulb, Languages, Search, Sparkles, Trophy, Map } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/tools/")({
  component: ToolsIndex,
});

const TOOLS = [
  {
    to: "/tools/image",
    icon: ImageIcon,
    title: "تحويل النص إلى صورة",
    desc: "أنشئ صورًا احترافية من وصف نصي بالعربية أو الإنجليزية باستخدام أحدث نماذج توليد الصور.",
    color: "from-blue-500/10 to-purple-500/10",
  },
  {
    to: "/tools/roadmap",
    icon: Map,
    title: "مستشار مسارات التعلم (Roadmap)",
    desc: "أدخل أي تخصص أو موضوع وسيقوم الـ AI بتوليد خريطة طريق تفاعلية ممتازة للتعلم مع مصادر مجانية.",
    color: "from-violet-500/10 to-indigo-500/10",
  },
  {
    to: "/tools/summarize",
    icon: FileText,
    title: "تلخيص المقالات",
    desc: "الصق أي مقال طويل واحصل على ملخّص عربي واضح في نقاط موجزة خلال ثوانٍ.",
    color: "from-emerald-500/10 to-teal-500/10",
  },
  {
    to: "/tools/ideas",
    icon: Lightbulb,
    title: "مولّد أفكار المقالات",
    desc: "أدخل موضوعًا واحصل على عناوين مقالات جذابة ومحسّنة لمحركات البحث.",
    color: "from-amber-500/10 to-orange-500/10",
  },
  {
    to: "/tools/translate",
    icon: Languages,
    title: "الترجمة الاحترافية",
    desc: "ترجمة نصوص بين العربية والإنجليزية والفرنسية بأسلوب طبيعي واحترافي.",
    color: "from-pink-500/10 to-rose-500/10",
  },
  {
    to: "/tools/seo",
    icon: Search,
    title: "مساعد SEO عربي",
    desc: "احصل على عنوان، وصف Meta، كلمات مفتاحية، وهيكل عناوين محسّن لموضوعك.",
    color: "from-indigo-500/10 to-sky-500/10",
  },
] as const;

function ToolsIndex() {
  const [enabledKeys, setEnabledKeys] = useState<Set<string> | null>(null);
  useEffect(() => {
    supabase
      .from("admin_ai_tools")
      .select("tool_key,enabled")
      .then(({ data }) => {
        if (!data) return setEnabledKeys(null);
        setEnabledKeys(new Set(data.filter((t: any) => t.enabled).map((t: any) => t.tool_key)));
      });
  }, []);
  const visibleTools = TOOLS.filter((t) => {
    if (!enabledKeys) return true;
    const key = t.to.replace("/tools/", "");
    if (key === "roadmap" && !enabledKeys.has("roadmap")) return true;
    return enabledKeys.has(key);
  });
  return (
    <>
      <section className="hero-bg border-b border-border">
        <div className="container-page py-16 md:py-20 text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-4 py-1.5 text-xs font-medium text-muted-foreground mb-4">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            مدعومة بأحدث نماذج الذكاء الاصطناعي
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-extrabold leading-tight">
            <span className="gradient-text">أدوات الذكاء الاصطناعي</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            مجموعة أدوات AI مجانية تعمل مباشرة داخل الموقع — بدون تسجيل ولا اشتراكات.
          </p>
        </div>
      </section>

      <section className="container-page pt-10 md:pt-14">
        <Link
          to="/quiz"
          className="group relative flex flex-col md:flex-row items-center gap-6 overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-l from-primary/15 via-purple-500/10 to-pink-500/15 p-6 md:p-8 shadow-elegant transition-all hover:-translate-y-1"
        >
          <div className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-background shadow-soft ring-1 ring-border">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1 text-center md:text-right">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-0.5 text-xs font-bold text-primary mb-2">
              جديد ✨
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-extrabold">
              اختبار: ما أداة الذكاء الاصطناعي المناسبة لك؟
            </h2>
            <p className="mt-1 text-muted-foreground">
              6 أسئلة سريعة وتوصية شخصية بأفضل أداة AI تناسب احتياجاتك من بين 8 أدوات رائدة.
            </p>
          </div>
          <span className="inline-flex items-center rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft group-hover:opacity-90">
            ابدأ الاختبار ←
          </span>
        </Link>
      </section>

      <section className="container-page py-14 md:py-20">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {visibleTools.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className={`group relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${t.color} p-6 transition-all hover:shadow-elegant hover:-translate-y-1`}
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-background shadow-soft ring-1 ring-border">
                <t.icon className="h-6 w-6 text-primary" />
              </div>
              <h2 className="mt-4 font-display text-xl font-bold text-foreground">{t.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{t.desc}</p>
              <span className="mt-4 inline-block text-sm font-semibold text-primary group-hover:underline">
                جرّبها الآن ←
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
