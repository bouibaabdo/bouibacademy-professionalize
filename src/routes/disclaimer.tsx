import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/disclaimer")({
  head: () => ({
    meta: [
      { title: "إخلاء المسؤولية — Bouiba Academy" },
      {
        name: "description",
        content:
          "إخلاء المسؤولية بخصوص المحتوى، أدوات الذكاء الاصطناعي، وروابط البث المباشر على Bouiba Academy.",
      },
      { property: "og:title", content: "إخلاء المسؤولية — Bouiba Academy" },
      {
        property: "og:description",
        content:
          "توضيحات قانونية عن حدود مسؤولية Bouiba Academy تجاه المحتوى والأدوات والروابط الخارجية.",
      },
      { property: "og:url", content: "https://edu.bouibacademy.me/disclaimer" },
    ],
    links: [{ rel: "canonical", href: "https://edu.bouibacademy.me/disclaimer" }],
  }),
  component: DisclaimerPage,
});

function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container-page py-16 max-w-3xl">
        <h1 className="font-display text-4xl font-extrabold mb-6">إخلاء المسؤولية</h1>

        <div className="space-y-6 text-foreground/90 leading-relaxed">
          <section>
            <h2 className="font-display text-2xl font-bold mb-3">طبيعة المحتوى</h2>
            <p>
              المعلومات المنشورة على Bouiba Academy لأغراض تعليمية وإعلامية عامة فقط. لا نضمن الدقة
              الكاملة أو التحديث الفوري لكل محتوى.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold mb-3">أدوات الذكاء الاصطناعي</h2>
            <p>
              نتائج أدوات AI (توليد الصور، الترجمة، التلخيص، أفكار المحتوى، تحليل SEO) مُولَّدة
              آلياً وقد تحتوي على أخطاء أو معلومات غير دقيقة. راجع النتائج قبل استخدامها.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold mb-3">روابط البث المباشر</h2>
            <p>
              روابط بث مباريات كأس العالم مُستخرجة من مصادر خارجية عامة (SportSRC، Yallakora،
              Yallasellit). لا نستضيف أي محتوى مرئي، ولا نتحمّل مسؤولية توفّر الروابط أو محتوى
              الإعلانات فيها. حقوق البث تعود لأصحابها.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold mb-3">الروابط الخارجية</h2>
            <p>
              قد يحتوي الموقع على روابط لمواقع خارجية. لا نتحكّم في محتواها ولا نتحمّل مسؤولية
              سياسات الخصوصية أو الممارسات الخاصة بها.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold mb-3">الإعلانات</h2>
            <p>
              الإعلانات المعروضة عبر Google AdSense والشبكات الأخرى مسؤولية معلنيها. لا نصادق على أي
              منتج أو خدمة يتم الترويج لها.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
