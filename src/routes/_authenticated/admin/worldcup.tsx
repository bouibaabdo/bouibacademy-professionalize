import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  listStreamOverrides,
  upsertStreamOverride,
  deleteStreamOverride,
  listPinnedMatches,
  pinMatch,
  unpinMatch,
} from "@/lib/admin.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Trash2, Plus, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/worldcup")({
  component: AdminWorldcup,
});

type Override = { match_id: string; label: string | null; stream_urls: string[] };
type Pinned = { match_id: string; label: string | null; priority: number };

function AdminWorldcup() {
  const [overrides, setOverrides] = useState<Override[] | null>(null);
  const [pinned, setPinned] = useState<Pinned[] | null>(null);
  const [busy, setBusy] = useState(false);

  const [oMatchId, setOMatchId] = useState("");
  const [oLabel, setOLabel] = useState("");
  const [oUrls, setOUrls] = useState("");

  const [pMatchId, setPMatchId] = useState("");
  const [pLabel, setPLabel] = useState("");
  const [pPriority, setPPriority] = useState("0");

  const reload = async () => {
    const [ov, pn] = await Promise.all([listStreamOverrides(), listPinnedMatches()]);
    setOverrides(ov as Override[]);
    setPinned(pn as Pinned[]);
  };
  useEffect(() => {
    reload();
  }, []);

  async function saveOverride() {
    const urls = oUrls.split(/\s+/).map((u) => u.trim()).filter(Boolean);
    if (!oMatchId || urls.length === 0) {
      toast.error("أدخل معرف المباراة ورابطاً واحداً على الأقل");
      return;
    }
    setBusy(true);
    try {
      await upsertStreamOverride({
        data: { match_id: oMatchId, label: oLabel || null, stream_urls: urls },
      });
      toast.success("تم الحفظ");
      setOMatchId("");
      setOLabel("");
      setOUrls("");
      await reload();
    } catch (e: any) {
      toast.error(e?.message ?? "فشل الحفظ");
    } finally {
      setBusy(false);
    }
  }

  async function removeOverride(match_id: string) {
    await deleteStreamOverride({ data: { match_id } });
    toast.success("تم الحذف");
    reload();
  }

  async function savePin() {
    if (!pMatchId) {
      toast.error("أدخل معرف المباراة");
      return;
    }
    setBusy(true);
    try {
      await pinMatch({
        data: {
          match_id: pMatchId,
          label: pLabel || null,
          priority: Number(pPriority) || 0,
        },
      });
      toast.success("تم التثبيت");
      setPMatchId("");
      setPLabel("");
      setPPriority("0");
      await reload();
    } catch (e: any) {
      toast.error(e?.message ?? "فشل");
    } finally {
      setBusy(false);
    }
  }

  async function removePin(match_id: string) {
    await unpinMatch({ data: { match_id } });
    toast.success("تم إلغاء التثبيت");
    reload();
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold">إدارة كأس العالم</h2>
        <p className="text-muted-foreground text-sm mt-1">
          خصّص روابط البث لأي مباراة وثبّت المباريات المميزة.
        </p>
      </div>

      {/* Stream overrides */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">روابط بث مخصصة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Input placeholder="معرّف المباراة (مثال: 2025-06-15-fr-mo)"
                   value={oMatchId} onChange={(e) => setOMatchId(e.target.value)} />
            <Input placeholder="وسم (اختياري)" value={oLabel} onChange={(e) => setOLabel(e.target.value)} />
          </div>
          <Textarea placeholder="روابط البث — رابط واحد في كل سطر" rows={4}
                    value={oUrls} onChange={(e) => setOUrls(e.target.value)} />
          <Button onClick={saveOverride} disabled={busy} className="gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            حفظ الرابط
          </Button>

          <div className="space-y-2 pt-2">
            {overrides === null ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : overrides.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد روابط مخصصة بعد.</p>
            ) : (
              overrides.map((o) => (
                <div key={o.match_id} className="flex items-start justify-between rounded-lg border p-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">{o.label || o.match_id}</p>
                    <p className="text-xs text-muted-foreground">{o.match_id}</p>
                    <ul className="mt-1 text-xs text-muted-foreground list-disc mr-4 space-y-0.5">
                      {o.stream_urls.map((u) => (
                        <li key={u} className="truncate">{u}</li>
                      ))}
                    </ul>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeOverride(o.match_id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pinned matches */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">مباريات مثبّتة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Input placeholder="معرّف المباراة" value={pMatchId} onChange={(e) => setPMatchId(e.target.value)} />
            <Input placeholder="وسم (اختياري)" value={pLabel} onChange={(e) => setPLabel(e.target.value)} />
            <Input type="number" placeholder="الأولوية" value={pPriority} onChange={(e) => setPPriority(e.target.value)} />
          </div>
          <Button onClick={savePin} disabled={busy} className="gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            تثبيت
          </Button>

          <div className="space-y-2 pt-2">
            {pinned === null ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : pinned.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد مباريات مثبّتة.</p>
            ) : (
              pinned.map((p) => (
                <div key={p.match_id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-semibold text-sm">{p.label || p.match_id}</p>
                    <p className="text-xs text-muted-foreground">{p.match_id} · أولوية {p.priority}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removePin(p.match_id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
