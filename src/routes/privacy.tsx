import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "سياسة الخصوصية — Bouiba Academy" },
      {
        name: "description",
        content:
          "سياسة الخصوصية الخاصة بموقع Bouiba Academy: البيانات التي نجمعها، ملفات تعريف الارتباط، وإعلانات Google AdSense.",
      },
      { property: "og:title", content: "سياسة الخصوصية — Bouiba Academy" },
      {
        property: "og:description",
        content:
          "كيف نجمع ونستخدم البيانات، ملفات الكوكيز، وإعلانات الطرف الثالث في Bouiba Academy.",
      },
      { property: "og:url", content: "https://edu.bouibacademy.me/privacy" },
    ],
    links: [{ rel: "canonical", href: "https://edu.bouibacademy.me/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container-page py-16 max-w-3xl">
        <h1 className="font-display text-4xl font-extrabold mb-6">سياسة الخصوصية</h1>
        <p className="text-sm text-muted-foreground mb-8">
          آخر تحديث:{" "}
          {new Date().toLocaleDateString("ar-EG-u-nu-latn", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>

        <div className="prose prose-ar max-w-none space-y-6 text-foreground/90 leading-relaxed">
          <section>
            <h2 className="font-display text-2xl font-bold mb-3">مقدمة</h2>
            <p>
              نحن في <strong>Bouiba Academy</strong> (edu.bouibacademy.me) نحترم خصوصية زوّارنا
              ونلتزم بحماية بياناتهم الشخصية. توضّح هذه السياسة نوع المعلومات التي نجمعها وكيفية
              استخدامها.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold mb-3">المعلومات التي نجمعها</h2>
            <ul className="list-disc pr-6 space-y-2">
              <li>
                بيانات تقنية تلقائية (نوع المتصفح، نظام التشغيل، الصفحات التي تمت زيارتها) عبر أدوات
                التحليل مثل Google Analytics.
              </li>
              <li>
                بيانات الحساب (البريد الإلكتروني، الاسم) عند التسجيل الاختياري للاستفادة من الميزات
                المخصصة.
              </li>
              <li>محتوى الرسائل التي ترسلها عبر نموذج التواصل.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold mb-3">ملفات تعريف الارتباط (Cookies)</h2>
            <p>
              يستخدم موقعنا ملفات الكوكيز لتحسين تجربة المستخدم، وتحليل الزيارات، وعرض إعلانات ذات
              صلة. يمكنك تعطيل الكوكيز من إعدادات متصفحك في أي وقت.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold mb-3">
              إعلانات Google AdSense والطرف الثالث
            </h2>
            <p>
              نستخدم خدمة <strong>Google AdSense</strong> لعرض الإعلانات. تقوم Google وشركاؤها بموجب
              استخدام ملفات تعريف الارتباط بعرض إعلانات مبنيّة على زياراتك السابقة لهذا الموقع أو
              مواقع أخرى.
            </p>
            <ul className="list-disc pr-6 space-y-2">
              <li>
                يمكنك إلغاء الاشتراك في الإعلانات المخصصة عبر زيارة{" "}
                <a
                  href="https://www.google.com/settings/ads"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  إعدادات إعلانات Google
                </a>
                .
              </li>
              <li>
                يمكنك أيضاً إلغاء اشتراك مزوّدي الطرف الثالث عبر{" "}
                <a
                  href="https://www.aboutads.info"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  www.aboutads.info
                </a>
                .
              </li>
              <li>قد تستخدم شركات إعلانية أخرى شريكة مع Google كوكيز DART لعرض إعلانات ذات صلة.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold mb-3">حقوقك</h2>
            <p>
              لك الحق في الوصول إلى بياناتك أو طلب تعديلها أو حذفها بالتواصل معنا عبر البريد
              الإلكتروني.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold mb-3">أمان البيانات</h2>
            <p>
              نتخذ إجراءات تقنية معقولة لحماية بياناتك من الوصول غير المصرّح به، لكن لا يمكن ضمان
              الأمان المطلق عبر الإنترنت.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold mb-3">التواصل</h2>
            <p>
              لأي استفسار عن هذه السياسة، راسلنا على:{" "}
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
