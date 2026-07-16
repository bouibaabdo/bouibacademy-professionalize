import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listAiTools, toggleAiTool } from "@/lib/admin.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/tools")({
  component: AdminTools,
});

type Tool = { tool_key: string; title: string; enabled: boolean; sort_order: number };

function AdminTools() {
  const [tools, setTools] = useState<Tool[] | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    listAiTools().then((t) => setTools(t as Tool[]));
  }, []);

  async function onToggle(tool_key: string, enabled: boolean) {
    setSaving(tool_key);
    try {
      await toggleAiTool({ data: { tool_key, enabled } });
      setTools((prev) => prev?.map((t) => (t.tool_key === tool_key ? { ...t, enabled } : t)) ?? null);
      toast.success("تم الحفظ");
    } catch {
      toast.error("فشل الحفظ");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold">أدوات الذكاء الاصطناعي</h2>
        <p className="text-muted-foreground text-sm mt-1">
          فعّل أو عطّل أي أداة لتظهر أو تختفي من صفحة <code>/tools</code>.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">الأدوات المتاحة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {tools === null ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            tools.map((t) => (
              <div key={t.tool_key} className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-semibold">{t.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">/tools/{t.tool_key}</p>
                </div>
                <div className="flex items-center gap-2">
                  {saving === t.tool_key && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Switch checked={t.enabled} onCheckedChange={(v) => onToggle(t.tool_key, v)} />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
