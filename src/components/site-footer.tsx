import { Link } from "@tanstack/react-router";
import { Sparkles, Facebook, Twitter, Instagram, Youtube } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-surface-muted/40 mt-24">
      <div className="container-page py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 font-bold text-lg mb-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Sparkles className="h-5 w-5" />
              </span>
              <span className="font-display">Bouiba Academy</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
              أكاديميتك العربية للذكاء الاصطناعي — دروس عملية، أحدث الأخبار، وأدوات مجانية لمواكبة
              عصر الذكاء الاصطناعي.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3">استكشف</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/posts" className="hover:text-foreground">
                  جميع المقالات
                </Link>
              </li>
              <li>
                <Link to="/posts" search={{ label: "دروس" }} className="hover:text-foreground">
                  الدروس
                </Link>
              </li>
              <li>
                <Link to="/posts" search={{ label: "أدوات" }} className="hover:text-foreground">
                  أدوات AI
                </Link>
              </li>
              <li>
                <Link to="/posts" search={{ label: "أخبار" }} className="hover:text-foreground">
                  الأخبار
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3">الأكاديمية</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/about" className="hover:text-foreground">
                  من نحن
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-foreground">
                  تواصل معنا
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-foreground">
                  سياسة الخصوصية
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-foreground">
                  شروط الاستخدام
                </Link>
              </li>
              <li>
                <Link to="/disclaimer" className="hover:text-foreground">
                  إخلاء المسؤولية
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Bouiba Academy. جميع الحقوق محفوظة.
          </p>
          <div className="flex items-center gap-3 text-muted-foreground">
            <a href="#" aria-label="Facebook" className="hover:text-primary">
              <Facebook className="h-4 w-4" />
            </a>
            <a href="#" aria-label="Twitter" className="hover:text-primary">
              <Twitter className="h-4 w-4" />
            </a>
            <a href="#" aria-label="Instagram" className="hover:text-primary">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="#" aria-label="Youtube" className="hover:text-primary">
              <Youtube className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
