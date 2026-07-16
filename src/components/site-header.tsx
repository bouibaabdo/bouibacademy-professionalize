import { Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Menu, X, Star, LogIn, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getLabels } from "@/lib/blogger.functions";
import { listLessons } from "@/lib/lessons.functions";
import { NavDropdown, type NavDropdownItem } from "@/components/nav-dropdown";
import bouibaLogo from "@/assets/bouiba-logo.webp.asset.json";

const TOOL_ITEMS: NavDropdownItem[] = [
  { label: "مسارات التعلم (Roadmap)", to: "/tools/roadmap", description: "خريطة طريق تفاعلية للدراسة", badge: "جديد ✨" },
  { label: "نص إلى صورة", to: "/tools/image", description: "توليد صور بالذكاء الاصطناعي" },
  { label: "تلخيص المقالات", to: "/tools/summarize", description: "ملخصات ذكية سريعة" },
  { label: "الترجمة الذكية", to: "/tools/translate", description: "ترجمة دقيقة بين اللغات" },
  { label: "توليد الأفكار", to: "/tools/ideas", description: "أفكار محتوى ومشاريع" },
  { label: "مساعد SEO", to: "/tools/seo", description: "تحسين ترتيب موقعك" },
];

const SIMPLE_NAV = [
  { to: "/", label: "الرئيسية" },
  { to: "/quiz", label: "اختبار AI" },
  { to: "/worldcup", label: "كأس العالم 2026" },
  { to: "/about", label: "عن الأكاديمية" },
  { to: "/contact", label: "تواصل" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [mPosts, setMPosts] = useState(false);
  const [mLessons, setMLessons] = useState(false);
  const [mTools, setMTools] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const labelsQ = useQuery({
    queryKey: ["labels"],
    queryFn: () => getLabels(),
    staleTime: 10 * 60_000,
    enabled: false,
  });
  const lessonsQ = useQuery({
    queryKey: ["lessons", "public"],
    queryFn: () => listLessons(),
    staleTime: 10 * 60_000,
    enabled: false,
  });

  const postItems: NavDropdownItem[] = (labelsQ.data ?? []).slice(0, 10).map((l: { label: string; count: number }) => ({
    label: `${l.label} (${l.count})`,
    to: "/posts",
    search: { label: l.label },
  }));

  const lessonCategories = Array.from(
    new Set((lessonsQ.data ?? []).map((l: { category?: string | null }) => l.category).filter(Boolean) as string[]),
  );
  const lessonItems: NavDropdownItem[] = lessonCategories.map((c) => ({
    label: c,
    to: "/lessons",
  }));

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg" aria-label="Bouiba Academy">
          <img
            src={bouibaLogo.url}
            alt="Bouiba Academy"
            className="h-11 w-auto"
            width={44}
            height={44}
            fetchPriority="high"
            decoding="async"
          />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Link
            to="/"
            className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent/60"
            activeOptions={{ exact: true }}
            activeProps={{ className: "text-foreground bg-accent/60" }}
          >
            الرئيسية
          </Link>

          <NavDropdown
            label="المقالات"
            to="/posts"
            items={postItems}
            footer={{ label: "عرض جميع المقالات", to: "/posts" }}
            onLoad={() => { if (!labelsQ.data && !labelsQ.isFetching) labelsQ.refetch(); }}
          />

          <NavDropdown
            label="دورات"
            to="/lessons"
            items={lessonItems}
            footer={{ label: "عرض كل الدورات", to: "/lessons" }}
            onLoad={() => { if (!lessonsQ.data && !lessonsQ.isFetching) lessonsQ.refetch(); }}
          />

          <NavDropdown
            label="أدوات AI"
            to="/tools"
            items={TOOL_ITEMS}
            footer={{ label: "استعرض كل الأدوات", to: "/tools" }}
            badge={true}
          />

          {SIMPLE_NAV.slice(1).map((item, i) => (
            <Link
              key={i}
              to={item.to}
              className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent/60"
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
          onClick={() => {
            const next = !open;
            setOpen(next);
            if (next) {
              if (!labelsQ.data && !labelsQ.isFetching) labelsQ.refetch();
              if (!lessonsQ.data && !lessonsQ.isFetching) lessonsQ.refetch();
            }
          }}
          className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-foreground hover:bg-accent"
          aria-label="القائمة"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background max-h-[80vh] overflow-y-auto">
          <nav className="container-page flex flex-col py-3 gap-1">
            <Link to="/" onClick={() => setOpen(false)} className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60">
              الرئيسية
            </Link>

            <MobileGroup
              label="المقالات"
              open={mPosts}
              onToggle={() => setMPosts((v) => !v)}
              overviewTo="/posts"
              onNavigate={() => setOpen(false)}
              items={postItems}
            />

            <MobileGroup
              label="دورات"
              open={mLessons}
              onToggle={() => setMLessons((v) => !v)}
              overviewTo="/lessons"
              onNavigate={() => setOpen(false)}
              items={lessonItems}
            />

            <MobileGroup
              label="أدوات AI"
              open={mTools}
              onToggle={() => setMTools((v) => !v)}
              overviewTo="/tools"
              onNavigate={() => setOpen(false)}
              items={TOOL_ITEMS}
            />

            {SIMPLE_NAV.slice(1).map((item, i) => (
              <Link
                key={i}
                to={item.to}
                onClick={() => setOpen(false)}
                className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60"
              >
                {item.label}
              </Link>
            ))}

            {authed ? (
              <Link to="/favorites" onClick={() => setOpen(false)} className="px-3 py-2 rounded-md text-sm font-medium text-amber-600">
                ⭐ المفضلة
              </Link>
            ) : (
              <Link to="/auth" onClick={() => setOpen(false)} className="px-3 py-2 rounded-md text-sm font-medium text-primary">
                تسجيل الدخول
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

function MobileGroup({
  label,
  open,
  onToggle,
  overviewTo,
  items,
  onNavigate,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  overviewTo: string;
  items: NavDropdownItem[];
  onNavigate: () => void;
}) {
  return (
    <div className="rounded-md">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60"
        aria-expanded={open}
      >
        <span>{label}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="mr-3 border-r border-border pr-3 py-1 space-y-0.5">
          <Link
            to={overviewTo}
            onClick={onNavigate}
            className="block px-3 py-1.5 rounded-md text-sm font-semibold text-foreground hover:bg-accent"
          >
            {label} — نظرة عامة
          </Link>
          {items.length === 0 ? (
            <p className="px-3 py-1.5 text-xs text-muted-foreground">لا توجد عناصر</p>
          ) : (
            items.map((it, i) => (
              <Link
                key={i}
                to={it.to}
                search={it.search as never}
                onClick={onNavigate}
                className="block px-3 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                {it.label}
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
