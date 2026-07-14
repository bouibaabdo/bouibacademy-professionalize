import { Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Menu, X, Sparkles, Star, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/", label: "الرئيسية" },
  { to: "/posts", label: "المقالات", search: {} as { label?: string } },
  { to: "/tools", label: "أدوات AI" },
  { to: "/worldcup", label: "كأس العالم 2026" },
  { to: "/about", label: "عن الأكاديمية" },
  { to: "/contact", label: "تواصل" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="font-display">Bouiba Academy</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((item, i) => (
            <Link
              key={i}
              to={item.to}
              search={(item as { search?: object }).search ?? undefined}
              className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent/60"
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{ className: "text-foreground bg-accent/60" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {authed ? (
            <Link
              to="/favorites"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:bg-accent"
            >
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              المفضلة
            </Link>
          ) : (
            <button
              onClick={() => navigate({ to: "/auth" })}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:bg-accent"
            >
              <LogIn className="h-4 w-4" />
              دخول
            </button>
          )}
          <Link
            to="/posts"
            className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:opacity-90 hover:shadow-elegant"
          >
            ابدأ التعلم
          </Link>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-foreground hover:bg-accent"
          aria-label="القائمة"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="container-page flex flex-col py-3 gap-1">
            {NAV.map((item, i) => (
              <Link
                key={i}
                to={item.to}
                search={(item as { search?: object }).search ?? undefined}
                onClick={() => setOpen(false)}
                className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60"
              >
                {item.label}
              </Link>
            ))}
            {authed ? (
              <Link
                to="/favorites"
                onClick={() => setOpen(false)}
                className="px-3 py-2 rounded-md text-sm font-medium text-amber-600"
              >
                ⭐ المفضلة
              </Link>
            ) : (
              <Link
                to="/auth"
                onClick={() => setOpen(false)}
                className="px-3 py-2 rounded-md text-sm font-medium text-primary"
              >
                تسجيل الدخول
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
