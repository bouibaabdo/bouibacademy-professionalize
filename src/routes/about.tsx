import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BookOpen, Target, Users, Zap } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "عن الأكاديمية — Bouiba Academy" },
      {
        name: "description",
        content: "تعرّف على Bouiba Academy — منصة عربية متخصصة في محتوى الذكاء الاصطناعي.",
      },
      { property: "og:title", content: "عن الأكاديمية — Bouiba Academy" },
      {
        property: "og:description",
        content:
          "منصة عربية مستقلة لتعليم الذكاء الاصطناعي: دروس عملية، مراجعات نزيهة، وأخبار موثوقة بلغة واضحة.",
      },
      { property: "og:url", content: "https://edu.bouibacademy.me/about" },
    ],
    links: [{ rel: "canonical", href: "https://edu.bouibacademy.me/about" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Bouiba Academy",
          url: "https://edu.bouibacademy.me",
          description: "منصة عربية متخصصة في تعليم ومحتوى الذكاء الاصطناعي.",
          sameAs: ["https://www.bouibacademy.me"],
        }),
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="hero-bg border-b border-border">
          <div className="container-page py-16 md:py-24 text-center max-w-3xl">
            <p className="text-sm font-semibold text-primary mb-3">من نحن</p>
            <h1 className="font-display text-4xl md:text-6xl font-extrabold leading-tight">
              <span className="gradient-text">Bouiba Academy</span>
              <br />
              أكاديميتك في عالم الذكاء الاصطناعي
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              منصة عربية مستقلة نقدّم من خلالها محتوى تعليمي عملي، مراجعات نزيهة، وأخبار موثوقة عن
              الذكاء الاصطناعي — كل ذلك بلغة عربية واضحة تناسب المتعلم والمحترف.
            </p>
          </div>
        </section>

        <section className="container-page py-16 md:py-24">
          <div className="grid gap-6 md:grid-cols-2">
            {[
              {
                icon: Target,
                title: "رسالتنا",
                desc: "تمكين المجتمع العربي من فهم واستخدام أدوات الذكاء الاصطناعي بثقة، وتوفير محتوى تعليمي يوازي أفضل ما يُنشر عالميًا.",
              },
              {
                icon: BookOpen,
                title: "محتوى موثوق",
                desc: "كل درس ومقال يمرّ بمراجعة قبل النشر، مع الاعتماد على مصادر رسمية ومختبرة.",
              },
              {
                icon: Zap,
                title: "تحديث يومي",
                desc: "نلاحق التطورات المتسارعة في مجال الـ AI ونقدّم لك ملخصات وشروحات مبسّطة.",
              },
              {
                icon: Users,
                title: "مجتمع متفاعل",
                desc: "نبني مجتمعًا من المتعلمين العرب المتحمّسين للتقنية — تعلّم، شارك، ونمُ معنا.",
              },
            ].map((v, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-8 shadow-card">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-primary mb-4">
                  <v.icon className="h-6 w-6" />
                </div>
                <h2 className="font-display text-2xl font-bold">{v.title}</h2>
                <p className="mt-3 text-muted-foreground leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
