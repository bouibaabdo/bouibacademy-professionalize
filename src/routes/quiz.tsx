import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Sparkles, RotateCcw, Share2, Check, ArrowLeft, ArrowRight, Trophy } from "lucide-react";

export const Route = createFileRoute("/quiz")({
  head: () => ({
    meta: [
      { title: "اختبار: ما أداة الذكاء الاصطناعي المناسبة لك؟ — Bouiba Academy" },
      {
        name: "description",
        content:
          "اختبار تفاعلي قصير باللغة العربية يوصي لك بأفضل أداة ذكاء اصطناعي حسب احتياجاتك — ChatGPT، Claude، Gemini، Grok، Midjourney، Perplexity وأكثر.",
      },
      { property: "og:title", content: "ما أداة الذكاء الاصطناعي المناسبة لك؟" },
      {
        property: "og:description",
        content: "أجب على 6 أسئلة سريعة واكتشف أداة AI الأنسب لك — مجاني بالكامل من Bouiba Academy.",
      },
      { property: "og:url", content: "https://www.bouibacademy.me/quiz" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://www.bouibacademy.me/quiz" }],
  }),
  component: QuizPage,
});

type ToolKey = "chatgpt" | "claude" | "gemini" | "grok" | "perplexity" | "midjourney" | "runway" | "copilot";

type Tool = {
  key: ToolKey;
  name: string;
  tagline: string;
  desc: string;
  url: string;
  emoji: string;
  color: string;
};

const TOOLS: Record<ToolKey, Tool> = {
  chatgpt: {
    key: "chatgpt",
    name: "ChatGPT",
    tagline: "الأداة الأشمل للاستعمال اليومي",
    desc: "مساعد متعدد المهام من OpenAI — محادثة، برمجة، كتابة، تحليل بيانات، وصور. الخيار الأمثل إذا أردت أداة واحدة تفعل كل شيء بجودة عالية.",
    url: "https://chat.openai.com",
    emoji: "🤖",
    color: "from-emerald-500/15 to-teal-500/15",
  },
  claude: {
    key: "claude",
    name: "Claude",
    tagline: "الأفضل للكتابة الطويلة والتحليل العميق",
    desc: "من Anthropic. يتفوق في الفهم العميق للنصوص الطويلة، الكتابة الاحترافية، والبرمجة الدقيقة. مثالي للكتّاب والباحثين والمطوّرين.",
    url: "https://claude.ai",
    emoji: "🧠",
    color: "from-orange-500/15 to-amber-500/15",
  },
  gemini: {
    key: "gemini",
    name: "Gemini",
    tagline: "التكامل الكامل مع منظومة Google",
    desc: "من Google. متكامل مع Gmail و Docs و Drive و YouTube. الخيار الأفضل لمن يعتمد على أدوات Google في عمله اليومي.",
    url: "https://gemini.google.com",
    emoji: "✨",
    color: "from-blue-500/15 to-indigo-500/15",
  },
  grok: {
    key: "grok",
    name: "Grok",
    tagline: "الأسرع في مواكبة الأخبار اللحظية",
    desc: "من xAI. متصل مباشرة بمنصة X (تويتر) — يقدّم إجابات مبنية على أحدث الأخبار والنقاشات لحظة بلحظة.",
    url: "https://grok.com",
    emoji: "⚡",
    color: "from-slate-500/15 to-zinc-500/15",
  },
  perplexity: {
    key: "perplexity",
    name: "Perplexity",
    tagline: "محرك البحث الذكي بالمصادر",
    desc: "بديل عربي/إنجليزي رائع لجوجل — يجيب على أسئلتك مع ذكر المصادر والروابط. مثالي للطلبة والباحثين.",
    url: "https://www.perplexity.ai",
    emoji: "🔎",
    color: "from-cyan-500/15 to-sky-500/15",
  },
  midjourney: {
    key: "midjourney",
    name: "Midjourney",
    tagline: "أجمل صور فنية من نص",
    desc: "الأداة الرائدة لتوليد صور فنية عالية الجودة من وصف نصي. مثالية للمصممين وصناع المحتوى.",
    url: "https://www.midjourney.com",
    emoji: "🎨",
    color: "from-pink-500/15 to-rose-500/15",
  },
  runway: {
    key: "runway",
    name: "Runway",
    tagline: "توليد وتحرير الفيديو بالذكاء الاصطناعي",
    desc: "أقوى منصة لصناعة مقاطع فيديو من نص أو صورة، وتحرير احترافي بالـ AI. مثالية لصنّاع محتوى الفيديو.",
    url: "https://runwayml.com",
    emoji: "🎬",
    color: "from-violet-500/15 to-purple-500/15",
  },
  copilot: {
    key: "copilot",
    name: "GitHub Copilot",
    tagline: "أفضل مساعد برمجة داخل المحرّر",
    desc: "يكتب الكود معك مباشرة داخل VS Code وبقية المحرّرات. الخيار رقم 1 للمطوّرين المحترفين.",
    url: "https://github.com/features/copilot",
    emoji: "💻",
    color: "from-indigo-500/15 to-blue-500/15",
  },
};

type Option = { label: string; scores: Partial<Record<ToolKey, number>> };
type Question = { q: string; options: Option[] };

const QUESTIONS: Question[] = [
  {
    q: "ما هو مجال استخدامك الأساسي للذكاء الاصطناعي؟",
    options: [
      { label: "الكتابة والمحتوى", scores: { claude: 3, chatgpt: 2, gemini: 1 } },
      { label: "البرمجة وتطوير البرمجيات", scores: { copilot: 3, claude: 2, chatgpt: 2 } },
      { label: "التصميم والصور والفيديو", scores: { midjourney: 3, runway: 3 } },
      { label: "البحث والدراسة", scores: { perplexity: 3, claude: 2, gemini: 1 } },
      { label: "متابعة الأخبار والنقاشات", scores: { grok: 3, perplexity: 2 } },
    ],
  },
  {
    q: "ما مستوى خبرتك في التعامل مع أدوات AI؟",
    options: [
      { label: "مبتدئ تمامًا", scores: { chatgpt: 3, gemini: 2 } },
      { label: "متوسط", scores: { chatgpt: 2, claude: 2, perplexity: 1 } },
      { label: "محترف", scores: { claude: 3, copilot: 2, midjourney: 2, runway: 2 } },
    ],
  },
  {
    q: "ما أهم شيء تبحث عنه في الأداة؟",
    options: [
      { label: "الدقة وجودة النتائج", scores: { claude: 3, chatgpt: 2 } },
      { label: "السرعة والاستجابة اللحظية", scores: { grok: 3, gemini: 2 } },
      { label: "الإبداع والفن", scores: { midjourney: 3, runway: 2, chatgpt: 1 } },
      { label: "التكامل مع أدوات أخرى", scores: { gemini: 3, copilot: 2 } },
    ],
  },
  {
    q: "ما ميزانيتك الشهرية للاشتراك؟",
    options: [
      { label: "مجاني فقط", scores: { gemini: 2, grok: 2, perplexity: 2, chatgpt: 1 } },
      { label: "أقل من 20$", scores: { chatgpt: 2, claude: 2, perplexity: 2, copilot: 2 } },
      { label: "أكثر من 20$ لا مشكلة", scores: { midjourney: 3, runway: 3, claude: 2, chatgpt: 2 } },
    ],
  },
  {
    q: "ما نوع النصوص التي تتعامل معها؟",
    options: [
      { label: "قصيرة (رسائل، تغريدات)", scores: { chatgpt: 2, grok: 2, gemini: 2 } },
      { label: "طويلة (مقالات، تقارير، كتب)", scores: { claude: 3, chatgpt: 1 } },
      { label: "تقنية وأكواد برمجية", scores: { copilot: 3, claude: 2, chatgpt: 2 } },
      { label: "لا أكتب كثيرًا، أريد صورًا/فيديو", scores: { midjourney: 3, runway: 3 } },
    ],
  },
  {
    q: "أين ستستخدم الأداة أكثر؟",
    options: [
      { label: "على الهاتف/المتصفح للاستخدام العام", scores: { chatgpt: 3, gemini: 2 } },
      { label: "داخل بريدي ومستنداتي", scores: { gemini: 3 } },
      { label: "داخل محرّر الكود", scores: { copilot: 3 } },
      { label: "في العمل الإبداعي والتصميم", scores: { midjourney: 3, runway: 2 } },
      { label: "للبحث السريع بالمصادر", scores: { perplexity: 3 } },
    ],
  },
];

function computeResult(picks: number[]): Tool {
  const scores: Record<ToolKey, number> = {
    chatgpt: 0, claude: 0, gemini: 0, grok: 0, perplexity: 0, midjourney: 0, runway: 0, copilot: 0,
  };
  picks.forEach((pick, i) => {
    const opt = QUESTIONS[i]?.options[pick];
    if (!opt) return;
    for (const [k, v] of Object.entries(opt.scores)) {
      scores[k as ToolKey] += v as number;
    }
  });
  const winner = (Object.entries(scores) as [ToolKey, number][]).sort((a, b) => b[1] - a[1])[0][0];
  return TOOLS[winner];
}

function QuizPage() {
  const [step, setStep] = useState(0);
  const [picks, setPicks] = useState<number[]>([]);
  const [copied, setCopied] = useState(false);

  const total = QUESTIONS.length;
  const done = step >= total;
  const result = useMemo(() => (done ? computeResult(picks) : null), [done, picks]);

  const runnerUp = useMemo(() => {
    if (!done) return null;
    const scores: Record<ToolKey, number> = {
      chatgpt: 0, claude: 0, gemini: 0, grok: 0, perplexity: 0, midjourney: 0, runway: 0, copilot: 0,
    };
    picks.forEach((pick, i) => {
      const opt = QUESTIONS[i]?.options[pick];
      if (!opt) return;
      for (const [k, v] of Object.entries(opt.scores)) scores[k as ToolKey] += v as number;
    });
    const sorted = (Object.entries(scores) as [ToolKey, number][]).sort((a, b) => b[1] - a[1]);
    return TOOLS[sorted[1][0]];
  }, [done, picks]);

  const pick = (idx: number) => {
    const next = [...picks];
    next[step] = idx;
    setPicks(next);
    setTimeout(() => setStep(step + 1), 150);
  };

  const reset = () => { setStep(0); setPicks([]); setCopied(false); };

  const share = async () => {
    if (!result) return;
    const text = `اكتشفت أن أداة الذكاء الاصطناعي الأنسب لي هي ${result.name} ${result.emoji} — جرّب الاختبار من Bouiba Academy:`;
    const url = "https://www.bouibacademy.me/quiz";
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try { await (navigator as any).share({ title: "اختبار أدوات AI", text, url }); return; } catch {}
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const progress = done ? 100 : Math.round(((step) / total) * 100);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="hero-bg border-b border-border">
          <div className="container-page py-14 md:py-20 text-center max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-4 py-1.5 text-xs font-medium text-muted-foreground mb-4">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              اختبار شخصية أدوات الذكاء الاصطناعي
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-extrabold leading-tight">
              ما <span className="gradient-text">أداة الـ AI</span> المناسبة لك؟
            </h1>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              6 أسئلة سريعة، وتوصية دقيقة بأفضل أداة ذكاء اصطناعي تناسب احتياجاتك من بين أشهر الأدوات في 2026.
            </p>
          </div>
        </section>

        <section className="container-page py-10 md:py-14">
          <div className="max-w-2xl mx-auto">
            {/* Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                <span>{done ? "اكتمل" : `السؤال ${step + 1} من ${total}`}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-accent overflow-hidden">
                <div
                  className="h-full bg-gradient-to-l from-primary to-primary/60 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {!done && (
              <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-card">
                <h2 className="font-display text-2xl md:text-3xl font-bold leading-snug mb-6">
                  {QUESTIONS[step].q}
                </h2>
                <div className="grid gap-3">
                  {QUESTIONS[step].options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => pick(i)}
                      className="group text-right rounded-xl border border-border bg-background px-5 py-4 text-base font-medium transition-all hover:border-primary hover:bg-accent hover:-translate-y-0.5 hover:shadow-soft flex items-center justify-between gap-3"
                    >
                      <span>{opt.label}</span>
                      <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </button>
                  ))}
                </div>

                {step > 0 && (
                  <div className="mt-6 flex justify-start">
                    <button
                      onClick={() => setStep(step - 1)}
                      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                    >
                      <ArrowRight className="h-4 w-4" />
                      السؤال السابق
                    </button>
                  </div>
                )}
              </div>
            )}

            {done && result && (
              <div className={`rounded-3xl border border-border bg-gradient-to-br ${result.color} p-8 md:p-10 shadow-elegant text-center animate-in fade-in-0 zoom-in-95 duration-500`}>
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 backdrop-blur px-4 py-1.5 text-xs font-semibold text-primary mb-4">
                  <Trophy className="h-3.5 w-3.5" />
                  الأداة الأنسب لك
                </div>
                <div className="text-6xl md:text-7xl mb-3">{result.emoji}</div>
                <h2 className="font-display text-4xl md:text-5xl font-extrabold gradient-text mb-2">
                  {result.name}
                </h2>
                <p className="text-lg font-semibold text-foreground/90">{result.tagline}</p>
                <p className="mt-4 text-muted-foreground leading-relaxed max-w-xl mx-auto">{result.desc}</p>

                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-90"
                  >
                    جرّب {result.name} الآن
                    <ArrowLeft className="h-4 w-4" />
                  </a>
                  <button
                    onClick={share}
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-background/80 backdrop-blur px-6 py-3 text-sm font-semibold hover:bg-accent"
                  >
                    {copied ? <><Check className="h-4 w-4 text-emerald-600" /> تم النسخ</> : <><Share2 className="h-4 w-4" /> شارك النتيجة</>}
                  </button>
                  <button
                    onClick={reset}
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-background/80 backdrop-blur px-6 py-3 text-sm font-semibold hover:bg-accent"
                  >
                    <RotateCcw className="h-4 w-4" />
                    أعد الاختبار
                  </button>
                </div>

                {runnerUp && runnerUp.key !== result.key && (
                  <div className="mt-8 pt-6 border-t border-border/60">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">خيار ثانٍ يستحق التجربة</p>
                    <p className="font-semibold">
                      {runnerUp.emoji} {runnerUp.name} — <span className="text-muted-foreground font-normal">{runnerUp.tagline}</span>
                    </p>
                  </div>
                )}

                <div className="mt-8 flex flex-wrap justify-center gap-2 text-sm">
                  <Link to="/tools" className="text-primary font-semibold hover:underline">
                    استكشف أدوات AI مجانية داخل الموقع ←
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
