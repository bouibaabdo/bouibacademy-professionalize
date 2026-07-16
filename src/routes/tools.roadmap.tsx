import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Map,
  Sparkles,
  ArrowRight,
  Clock,
  BarChart,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Download,
  Award,
  ChevronDown,
  ChevronUp
} from "lucide-react";

export const Route = createFileRoute("/tools/roadmap")({
  head: () => ({
    meta: [
      { title: "مولّد مسارات التعلم الذكي بالذكاء الاصطناعي — أدوات AI | Bouiba Academy" },
      {
        name: "description",
        content: "أنشئ خريطة طريق (Roadmap) تفاعلية ومسار تعلم مخصص لأي مجال بالذكاء الاصطناعي مجانًا وبأفضل المصادر.",
      },
      { property: "og:title", content: "مولّد مسارات التعلم الذكي بالذكاء الاصطناعي — Bouiba Academy" },
      { property: "og:description", content: "أنشئ خريطة طريق تفاعلية ومسار تعلم مخصص لأي مجال بالذكاء الاصطناعي." },
      { property: "og:url", content: "https://www.bouibacademy.me/tools/roadmap" },
    ],
    links: [{ rel: "canonical", href: "https://www.bouibacademy.me/tools/roadmap" }],
  }),
  component: RoadmapTool,
});

interface Resource {
  title: string;
  type: "article" | "video" | "course";
  link: string;
}

interface RoadmapNode {
  id: string;
  label: string;
  description: string;
  duration: string;
  status: "core" | "optional";
  skills: string[];
  resources: Resource[];
  next?: string[];
}

interface RoadmapData {
  title: string;
  description: string;
  difficulty: "مبتدئ" | "متوسط" | "متقدم" | string;
  duration: string;
  nodes: RoadmapNode[];
}

function RoadmapTool() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<RoadmapNode | null>(null);
  const [completedNodes, setCompletedNodes] = useState<Set<string>>(new Set());

  async function generateRoadmap(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim() || loading) return;

    setLoading(true);
    setError(null);
    setRoadmap(null);
    setSelectedNode(null);
    setCompletedNodes(new Set());

    try {
      const res = await fetch("/api/tools/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "roadmap",
          input: topic.trim(),
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        text?: string;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error || `فشل في إنشاء مسار التعلم: ${res.status}`);
      }

      const parsed = JSON.parse(data.text || "{}") as RoadmapData;
      if (!parsed.title || !parsed.nodes || parsed.nodes.length === 0) {
        throw new Error("عذرًا، لم يتمكن الذكاء الاصطناعي من تنسيق مسار التعلم بالشكل المطلوب. يرجى المحاولة مجددًا.");
      }

      setRoadmap(parsed);
      setSelectedNode(parsed.nodes[0]); // Select first node by default
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع أثناء معالجة الطلب.");
    } finally {
      setLoading(false);
    }
  }

  function toggleNodeCompletion(nodeId: string) {
    setCompletedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }

  const completionPercentage = roadmap
    ? Math.round((completedNodes.size / roadmap.nodes.length) * 100)
    : 0;

  return (
    <section className="container-page py-10 md:py-16 max-w-6xl">
      <Link
        to="/tools"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowRight className="h-4 w-4" />
        كل الأدوات
      </Link>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
            <Map className="h-6 w-6" />
          </span>
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-extrabold">مستشار مسارات التعلم الذكي</h1>
            <p className="text-muted-foreground text-sm mt-1">
              أدخل أي تخصص علمي أو تقني وسيقوم المساعد الذكي بتصميم خريطة طريق تفاعلية غنية ومصادر مجانية.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 shadow-soft mb-8">
        <form onSubmit={generateRoadmap} className="space-y-4">
          <div className="relative">
            <label htmlFor="topic-input" className="sr-only">المجال التعليمي أو الموضوع</label>
            <input
              id="topic-input"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="مثال: مطور ويب كامل (Full Stack)، هندسة الذكاء الاصطناعي، أساسيات البرمجة، تداول العملات..."
              className="w-full rounded-xl border border-border bg-background px-4 py-4 pl-12 text-base focus:outline-none focus:ring-2 focus:ring-primary/50"
              disabled={loading}
              required
            />
            <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          </div>
          <button
            type="submit"
            disabled={loading || !topic.trim()}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 font-semibold text-primary-foreground shadow-soft transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                جارٍ تصميم خريطة الطريق ومسار التعلم...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                توليد خريطة الطريق التفاعلية
              </>
            )}
          </button>
        </form>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive mb-8">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="relative flex items-center justify-center mb-6">
            <div className="absolute h-20 w-20 animate-ping rounded-full bg-primary/10"></div>
            <div className="absolute h-14 w-14 animate-pulse rounded-full bg-primary/20"></div>
            <Map className="h-10 w-10 text-primary animate-bounce" />
          </div>
          <h3 className="font-display text-xl font-bold mb-2">يقوم المساعد الذكي بتحليل موضوعك...</h3>
          <p className="text-muted-foreground text-sm max-w-sm">
            نحن نحدد أفضل المهارات والخطوات والمصادر التعليمية المجانية المناسبة لك. قد يستغرق هذا بضع ثوانٍ.
          </p>
        </div>
      )}

      {roadmap && (
        <div className="grid gap-8 lg:grid-cols-3 items-start animate-fade-in">
          {/* Main Visual Roadmap (Left/Center Column) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4 mb-6">
                <div>
                  <h2 className="font-display text-2xl font-extrabold text-foreground">{roadmap.title}</h2>
                  <p className="text-muted-foreground text-sm mt-1">{roadmap.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/10 text-amber-600">
                    <BarChart className="h-3.5 w-3.5" />
                    {roadmap.difficulty}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/10 text-blue-600">
                    <Clock className="h-3.5 w-3.5" />
                    {roadmap.duration}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-8">
                <div className="flex items-center justify-between text-sm font-semibold mb-2">
                  <span className="text-muted-foreground">نسبة إنجاز المسار الدراسي</span>
                  <span className="text-primary">{completionPercentage}%</span>
                </div>
                <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500 ease-out"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>

              {/* Interactive Timeline Graph */}
              <div className="relative border-r-2 border-primary/20 mr-4 md:mr-6 pr-6 md:pr-10 space-y-8 py-2">
                {roadmap.nodes.map((node, index) => {
                  const isCompleted = completedNodes.has(node.id);
                  const isSelected = selectedNode?.id === node.id;

                  return (
                    <div key={node.id} className="relative group/node">
                      {/* Connection bullet */}
                      <button
                        onClick={() => toggleNodeCompletion(node.id)}
                        className={`absolute right-[-32px] md:right-[-42px] top-4 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all shadow-sm ${
                          isCompleted
                            ? "bg-primary border-primary text-primary-foreground scale-110"
                            : "bg-background border-primary/40 hover:border-primary text-transparent"
                        }`}
                        title={isCompleted ? "تعيين كغير مكتمل" : "تعيين كمكتمل"}
                      >
                        <CheckCircle2 className={`h-4 w-4 ${isCompleted ? "opacity-100" : "opacity-0 hover:opacity-40 hover:text-primary"}`} />
                      </button>

                      {/* Timeline Node Card */}
                      <div
                        onClick={() => setSelectedNode(node)}
                        className={`cursor-pointer rounded-xl border p-5 transition-all hover:shadow-elegant ${
                          isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-border bg-card hover:border-primary/40"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-primary px-2.5 py-0.5 rounded-md bg-primary/10">
                                خطوة {index + 1}
                              </span>
                              {node.status === "optional" && (
                                <span className="text-[10px] font-bold text-muted-foreground border border-border px-2 py-0.5 rounded">
                                  اختياري
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {node.duration}
                              </span>
                            </div>
                            <h3 className="font-display text-lg font-bold mt-2 text-foreground group-hover/node:text-primary transition-colors">
                              {node.label}
                            </h3>
                            <p className="text-muted-foreground text-sm mt-1 line-clamp-2 leading-relaxed">
                              {node.description}
                            </p>
                          </div>
                        </div>

                        {/* Node Card Footer */}
                        <div className="flex flex-wrap items-center justify-between mt-4 pt-3 border-t border-border/60 gap-2">
                          <div className="flex flex-wrap gap-1">
                            {node.skills.slice(0, 3).map((skill, idx) => (
                              <span key={idx} className="text-[10px] px-2 py-0.5 bg-muted rounded text-muted-foreground">
                                {skill}
                              </span>
                            ))}
                            {node.skills.length > 3 && (
                              <span className="text-[10px] px-2 py-0.5 bg-muted rounded text-muted-foreground">
                                +{node.skills.length - 3}
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-semibold text-primary group-hover/node:translate-x-[-4px] transition-transform flex items-center gap-0.5">
                            التفاصيل والمصادر ←
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Interactive Node details drawer (Right Column) */}
          <div className="lg:col-span-1 lg:sticky lg:top-6 space-y-6">
            {selectedNode ? (
              <div className="bg-card rounded-2xl border border-primary/30 p-6 shadow-elegant transition-all border-l-4 border-l-primary">
                <div className="flex items-center justify-between gap-3 border-b border-border pb-4 mb-4">
                  <h3 className="font-display text-xl font-extrabold text-foreground">
                    تفاصيل الخطوة
                  </h3>
                  <button
                    onClick={() => toggleNodeCompletion(selectedNode.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      completedNodes.has(selectedNode.id)
                        ? "bg-primary/10 text-primary border border-primary/30"
                        : "bg-muted hover:bg-primary/10 hover:text-primary text-muted-foreground border border-transparent"
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {completedNodes.has(selectedNode.id) ? "مكتملة" : "تعيين كمكتملة"}
                  </button>
                </div>

                <h4 className="font-display text-lg font-bold text-foreground mb-2">{selectedNode.label}</h4>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6 bg-muted/30 p-3 rounded-lg border border-border/40">
                  {selectedNode.description}
                </p>

                {/* Skills list */}
                <div className="mb-6">
                  <h5 className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-primary" />
                    المهارات التي ستكتسبها:
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedNode.skills.map((skill, idx) => (
                      <span key={idx} className="text-xs px-2.5 py-1 bg-primary/5 text-primary border border-primary/10 rounded-lg">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Resources List */}
                <div>
                  <h5 className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-primary" />
                    مصادر تعليمية مقترحة:
                  </h5>
                  <div className="space-y-2">
                    {selectedNode.resources && selectedNode.resources.length > 0 ? (
                      selectedNode.resources.map((resource, idx) => (
                        <a
                          key={idx}
                          href={resource.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 rounded-xl border border-border bg-background hover:bg-primary/5 hover:border-primary/30 transition-all group"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground capitalize">
                              {resource.type === "video" ? "فيديو" : resource.type === "course" ? "دورة" : "مقال"}
                            </span>
                            <span className="text-xs font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                              {resource.title}
                            </span>
                          </div>
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                        </a>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground">ابحث عن مصادر مجانية في منصات: يوتيوب، كورسيرا، أو مقالات مجانية.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-card rounded-2xl border border-border p-6 shadow-soft text-center py-12">
                <Map className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
                <h4 className="font-display font-bold text-foreground mb-1">حدد خطوة لمعاينتها</h4>
                <p className="text-muted-foreground text-xs">
                  اضغط على أي خطوة في خريطة الطريق لعرض المهارات والمصادر التعليمية المقترحة لها هنا.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
