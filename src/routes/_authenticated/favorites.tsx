import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  Bell,
  BellOff,
  Mail,
  MonitorSmartphone,
  Trash2,
  Trophy,
  Calendar,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { listFavorites, removeFavorite, updateFavoritePrefs } from "@/lib/favorites.functions";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/favorites")({
  head: () => ({
    meta: [
      { title: "المباريات المفضلة والتنبيهات | Bouiba Academy" },
      {
        name: "description",
        content: "أدر مبارياتك المفضلة وقم بتفعيل تنبيهات البريد وإشعارات المتصفح.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FavoritesPage,
});

interface Fav {
  id: string;
  match_id: string;
  match_data: {
    home: string;
    away: string;
    homeBadge?: string;
    awayBadge?: string;
    venue?: string;
    round?: string;
  };
  kickoff_at: string;
  notify_email: boolean;
  notify_browser: boolean;
}

function FavoritesPage() {
  const list = useServerFn(listFavorites);
  const remove = useServerFn(removeFavorite);
  const update = useServerFn(updateFavoritePrefs);
  const qc = useQueryClient();
  const router = useRouter();
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) setPerm("unsupported");
    else setPerm(Notification.permission);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["favorites"],
    queryFn: () => list(),
  });

  const del = useMutation({
    mutationFn: (match_id: string) => remove({ data: { match_id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["favorites"] });
      toast.success("حذفت");
    },
  });
  const upd = useMutation({
    mutationFn: (v: { id: string; notify_email?: boolean; notify_browser?: boolean }) =>
      update({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["favorites"] }),
  });

  async function requestPerm() {
    if (!("Notification" in window)) return;
    const r = await Notification.requestPermission();
    setPerm(r);
    if (r === "granted") toast.success("تم تفعيل إشعارات المتصفح");
    else toast.error("تم رفض الإذن — يمكنك تفعيله من إعدادات المتصفح");
  }

  async function signOut() {
    const { supabase } = await import("@/integrations/supabase/client");
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/", replace: true });
  }

  const favs = (data?.favorites ?? []) as unknown as Fav[];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container-page py-10">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold">مبارياتي المفضلة</h1>
            <p className="mt-2 text-muted-foreground">
              ستصلك تذكيرات قبل انطلاق كل مباراة بـ 24 ساعة وبساعة واحدة.
            </p>
          </div>
          <button onClick={signOut} className="text-sm text-muted-foreground hover:text-foreground">
            تسجيل الخروج
          </button>
        </div>

        {/* Browser notifications banner */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card mb-8">
          <div className="flex items-start gap-4">
            <div
              className={`h-10 w-10 rounded-xl inline-flex items-center justify-center ${perm === "granted" ? "bg-emerald-100 text-emerald-600" : "bg-primary/10 text-primary"}`}
            >
              {perm === "granted" ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <Bell className="h-5 w-5" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">إشعارات المتصفح</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {perm === "granted" &&
                  "مفعّلة — ستظهر لك التنبيهات عندما يكون الموقع مفتوحًا في تبويب."}
                {perm === "default" && "فعّل الإذن لتصلك تنبيهات فورية داخل المتصفح."}
                {perm === "denied" && "الإذن مرفوض — فعّله يدويًا من إعدادات المتصفح."}
                {perm === "unsupported" && "المتصفح لا يدعم الإشعارات."}
              </p>
            </div>
            {perm === "default" && (
              <button
                onClick={requestPerm}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                تفعيل
              </button>
            )}
          </div>
        </div>

        {isLoading && (
          <div className="text-center text-muted-foreground py-10">جاري التحميل...</div>
        )}

        {!isLoading && favs.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <Trophy className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              لا توجد مباريات مفضلة بعد. اذهب إلى{" "}
              <a href="/worldcup" className="text-primary font-semibold hover:underline">
                صفحة كأس العالم
              </a>{" "}
              واضغط ⭐ على أي مباراة.
            </p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {favs.map((f) => {
            const kickoff = new Date(f.kickoff_at);
            const fmt = new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
              weekday: "long",
              day: "numeric",
              month: "long",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }).format(kickoff);
            const past = kickoff.getTime() < Date.now();
            return (
              <div key={f.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <span className="inline-flex items-center gap-1.5">
                    <Trophy className="h-3.5 w-3.5 text-primary" />
                    {f.match_data.round ?? "مباراة"}
                  </span>
                  {past && <span className="text-emerald-600 font-semibold">انتهت</span>}
                </div>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 mb-4">
                  <div className="text-center">
                    {f.match_data.homeBadge && (
                      <img
                        src={f.match_data.homeBadge}
                        alt={f.match_data.home}
                        className="h-12 w-12 mx-auto object-contain"
                      />
                    )}
                    <div className="mt-1 text-sm font-semibold">{f.match_data.home}</div>
                  </div>
                  <div className="font-display text-lg font-bold text-primary">VS</div>
                  <div className="text-center">
                    {f.match_data.awayBadge && (
                      <img
                        src={f.match_data.awayBadge}
                        alt={f.match_data.away}
                        className="h-12 w-12 mx-auto object-contain"
                      />
                    )}
                    <div className="mt-1 text-sm font-semibold">{f.match_data.away}</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground space-y-1 mb-4">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {fmt}
                  </div>
                  {f.match_data.venue && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {f.match_data.venue}
                    </div>
                  )}
                </div>
                <div className="pt-3 border-t border-border space-y-2">
                  <label className="flex items-center justify-between gap-2 text-sm cursor-pointer">
                    <span className="inline-flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      تنبيه بريد إلكتروني
                    </span>
                    <input
                      type="checkbox"
                      checked={f.notify_email}
                      onChange={(e) => upd.mutate({ id: f.id, notify_email: e.target.checked })}
                      className="h-4 w-4 accent-primary"
                    />
                  </label>
                  <label className="flex items-center justify-between gap-2 text-sm cursor-pointer">
                    <span className="inline-flex items-center gap-2">
                      <MonitorSmartphone className="h-4 w-4 text-muted-foreground" />
                      إشعار متصفح
                    </span>
                    <input
                      type="checkbox"
                      checked={f.notify_browser}
                      onChange={(e) => upd.mutate({ id: f.id, notify_browser: e.target.checked })}
                      className="h-4 w-4 accent-primary"
                    />
                  </label>
                  <button
                    onClick={() => del.mutate(f.match_id)}
                    className="w-full mt-2 inline-flex items-center justify-center gap-2 text-sm text-red-600 hover:bg-red-50 rounded-lg py-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    إزالة من المفضلة
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {!isLoading && favs.every((f) => !f.notify_email) && favs.length > 0 && (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 flex items-start gap-2">
            <BellOff className="h-4 w-4 mt-0.5" />
            جميع تنبيهات البريد معطّلة — لن تصلك تذكيرات على بريدك.
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
