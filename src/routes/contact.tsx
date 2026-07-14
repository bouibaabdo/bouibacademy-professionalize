import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Mail, MessageCircle, Globe } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "تواصل معنا — Bouiba Academy" },
      {
        name: "description",
        content:
          "تواصل مع فريق Bouiba Academy — لأسئلتك، اقتراحاتك، أو فرص التعاون في محتوى الذكاء الاصطناعي العربي.",
      },
      { property: "og:title", content: "تواصل معنا — Bouiba Academy" },
      {
        property: "og:description",
        content: "راسل فريق Bouiba Academy لأي سؤال، اقتراح، أو تعاون في محتوى الذكاء الاصطناعي.",
      },
      { property: "og:url", content: "https://edu.bouibacademy.me/contact" },
    ],
    links: [{ rel: "canonical", href: "https://edu.bouibacademy.me/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="hero-bg border-b border-border">
          <div className="container-page py-16 md:py-24 text-center max-w-2xl">
            <p className="text-sm font-semibold text-primary mb-3">تواصل</p>
            <h1 className="font-display text-4xl md:text-6xl font-extrabold">لنبقَ على تواصل</h1>
            <p className="mt-4 text-lg text-foreground/80">
              سؤال، اقتراح، أو فكرة للتعاون؟ يسعدنا استقبال رسائلك.
            </p>
          </div>
        </section>

        <section className="container-page py-16">
          <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
            {[
              {
                icon: Mail,
                title: "البريد الإلكتروني",
                value: "contact@bouibacademy.me",
                href: "mailto:contact@bouibacademy.me",
              },
              { icon: MessageCircle, title: "الرسائل", value: "عبر صفحات التواصل", href: "#" },
              {
                icon: Globe,
                title: "المدونة",
                value: "bouibacademy.me",
                href: "https://www.bouibacademy.me",
              },
            ].map((c, i) => (
              <a
                key={i}
                href={c.href}
                className="group rounded-2xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-elegant hover:-translate-y-0.5"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <c.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-bold">{c.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground break-all">{c.value}</p>
              </a>
            ))}
          </div>

          <form className="mt-14 max-w-2xl mx-auto rounded-2xl border border-border bg-card p-8 shadow-card">
            <h2 className="font-display text-2xl font-bold mb-6">أرسل رسالة</h2>
            <div className="grid gap-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contact-name" className="sr-only">
                    الاسم
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    placeholder="الاسم"
                    aria-label="الاسم"
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="sr-only">
                    البريد الإلكتروني
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    placeholder="البريد الإلكتروني"
                    aria-label="البريد الإلكتروني"
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <label htmlFor="contact-subject" className="sr-only">
                الموضوع
              </label>
              <input
                id="contact-subject"
                type="text"
                placeholder="الموضوع"
                aria-label="الموضوع"
                className="rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <label htmlFor="contact-message" className="sr-only">
                الرسالة
              </label>
              <textarea
                id="contact-message"
                rows={5}
                placeholder="رسالتك..."
                aria-label="نص الرسالة"
                className="rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-90 transition-all"
              >
                إرسال الرسالة
              </button>
            </div>
          </form>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
