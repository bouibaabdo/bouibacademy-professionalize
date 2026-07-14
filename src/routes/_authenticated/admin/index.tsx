import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getAdminStats } from "@/lib/admin.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Radio, Pin, Heart, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getAdminStats>> | null>(null);
  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  const cards = [
    { title: "أدوات AI", value: stats?.toolsCount, icon: Sparkles, color: "text-purple-500" },
    { title: "روابط بث مخصصة", value: stats?.overridesCount, icon: Radio, color: "text-blue-500" },
    { title: "مباريات مثبّتة", value: stats?.pinnedCount, icon: Pin, color: "text-emerald-500" },
    {
      title: "متابعات المستخدمين",
      value: stats?.favoritesCount,
      icon: Heart,
      color: "text-rose-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">مرحباً بك 👋</h2>
        <p className="text-muted-foreground text-sm mt-1">نظرة سريعة على حالة الموقع.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
              <c.icon className={`h-4 w-4 ${c.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats === null ? <Loader2 className="h-5 w-5 animate-spin" /> : c.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">اختصارات سريعة</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <a
            href="https://www.blogger.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border p-4 hover:bg-muted transition"
          >
            <p className="font-semibold">نشر مقال جديد</p>
            <p className="text-xs text-muted-foreground mt-1">
              افتح لوحة Blogger لإنشاء أو تعديل مقال.
            </p>
          </a>
          <a
            href="https://search.google.com/search-console"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border p-4 hover:bg-muted transition"
          >
            <p className="font-semibold">Google Search Console</p>
            <p className="text-xs text-muted-foreground mt-1">راقب الفهرسة وطلبات الفهرسة.</p>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
