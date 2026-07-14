import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "شروط الاستخدام — Bouiba Academy" },
      {
        name: "description",
        content: "شروط استخدام موقع Bouiba Academy، حقوق الملكية الفكرية، والمسؤوليات القانونية.",
      },
      { property: "og:title", content: "شروط الاستخدام — Bouiba Academy" },
      {
        property: "og:description",
        content: "الشروط والأحكام التي تحكم استخدام موقع Bouiba Academy وخدماته.",
      },
      { property: "og:url", content: "https://edu.bouibacademy.me/terms" },
    ],
    links: [{ rel: "canonical", href: "https://edu.bouibacademy.me/terms" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container-page py-16 max-w-3xl">
        <h1 className="font-display text-4xl font-extrabold mb-6">شروط الاستخدام</h1>
        <p className="text-sm text-muted-foreground mb-8">
          آخر تحديث:{" "}
          {new Date().toLocaleDateString("ar-EG-u-nu-latn", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>

        <div className="space-y-6 text-foreground/90 leading-relaxed">
          <section>
            <h2 className="font-display text-2xl font-bold mb-3">قبول الشروط</h2>
            <p>
              باستخدامك لموقع Bouiba Academy فإنك توافق على الالتزام بهذه الشروط. إذا لم توافق على
              أيّ منها، يُرجى عدم استخدام الموقع.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold mb-3">المحتوى والملكية الفكرية</h2>
            <p>
              جميع المقالات، الدروس، والأدوات المنشورة على الموقع هي ملك لـ Bouiba Academy ومحمية
              بحقوق الملكية الفكرية. يُسمح بالاقتباس مع ذكر المصدر ورابط الصفحة الأصلية.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold mb-3">استخدام أدوات AI</h2>
            <p>
              الأدوات المتاحة (توليد الصور، الترجمة، التلخيص...) مقدَّمة "كما هي" لأغراض تعليمية.
              المستخدم مسؤول عن مراجعة النتائج قبل الاعتماد عليها في أي سياق مهني أو رسمي.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold mb-3">إخلاء المسؤولية</h2>
            <p>
              لا نضمن دقة أو اكتمال المعلومات المنشورة على الموقع. المحتوى ذو طابع تعليمي ولا يُعدّ
              استشارة مهنية. روابط البث المباشر لكأس العالم تعتمد على مصادر خارجية ولا نتحمّل
              مسؤولية توفرها أو محتواها.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold mb-3">الإعلانات</h2>
            <p>
              يعرض الموقع إعلانات من Google AdSense وشركاء آخرين. لا نتحمّل مسؤولية محتوى الإعلانات
              أو المنتجات المُعلن عنها.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold mb-3">التعديلات</h2>
            <p>
              نحتفظ بالحق في تعديل هذه الشروط في أي وقت. الاستمرار في استخدام الموقع بعد التعديل
              يُعدّ موافقة على الشروط الجديدة.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold mb-3">التواصل</h2>
            <p>
              لأي استفسار:{" "}
              <a href="mailto:contact@bouibacademy.me" className="text-primary underline">
                contact@bouibacademy.me
              </a>
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
