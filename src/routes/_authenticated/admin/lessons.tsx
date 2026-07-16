import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  adminListLessons,
  createLesson,
  updateLesson,
  deleteLesson,
} from "@/lib/lessons.functions";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Loader2,
  Trash2,
  Upload,
  PlayCircle,
  UploadCloud,
  CheckCircle2,
  X,
  Send,
  RefreshCw,
  Pencil,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/_authenticated/admin/lessons")({
  component: AdminLessons,
});

const MAX_UPLOAD_BYTES = 500 * 1024 * 1024; // 500 MB

type UploadStage = "idle" | "uploading" | "uploaded" | "publishing" | "done";

async function captureThumb(file: File, atSec: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.muted = true;
    v.playsInline = true;
    v.src = url;
    const cleanup = () => URL.revokeObjectURL(url);
    v.onloadedmetadata = () => {
      const target = Math.min(Math.max(0.1, atSec), Math.max(0.1, v.duration - 0.1));
      v.currentTime = target;
    };
    v.onseeked = () => {
      try {
        const w = 640;
        const h = Math.round((v.videoHeight / v.videoWidth) * w) || 360;
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null), cleanup();
        ctx.drawImage(v, 0, 0, w, h);
        canvas.toBlob(
          (b) => {
            cleanup();
            resolve(b);
          },
          "image/jpeg",
          0.82,
        );
      } catch {
        cleanup();
        resolve(null);
      }
    };
    v.onerror = () => {
      cleanup();
      resolve(null);
    };
  });
}

function AdminLessons() {
  const [items, setItems] = useState<any[] | null>(null);

  // Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");

  // Edit dialog
  const [editing, setEditing] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editPublished, setEditPublished] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);

  // Upload state

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [stage, setStage] = useState<UploadStage>("idle");
  const [progress, setProgress] = useState(0);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  const [thumbPath, setThumbPath] = useState<string | null>(null);
  const [thumbPreview, setThumbPreview] = useState<string | null>(null);
  const [thumbBlob, setThumbBlob] = useState<Blob | null>(null);
  const [thumbAt, setThumbAt] = useState(1);
  const [duration, setDuration] = useState<number | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  async function refresh() {
    const list = await adminListLessons();
    setItems(list as any[]);
  }
  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Auto-generate thumbnail + read duration when a file is picked
  useEffect(() => {
    if (!file) return;
    (async () => {
      // duration
      try {
        const dur = await new Promise<number>((resolve, reject) => {
          const v = document.createElement("video");
          v.preload = "metadata";
          v.onloadedmetadata = () => resolve(Math.round(v.duration));
          v.onerror = () => reject();
          v.src = URL.createObjectURL(file);
        });
        setDuration(dur);
        const at = Math.min(2, Math.max(0.5, dur / 20));
        setThumbAt(at);
        const b = await captureThumb(file, at);
        if (b) {
          setThumbBlob(b);
          setThumbPreview((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return URL.createObjectURL(b);
          });
        }
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  async function regenerateThumb(atSec: number) {
    if (!file) return;
    setRegenerating(true);
    try {
      const b = await captureThumb(file, atSec);
      if (b) {
        setThumbBlob(b);
        setThumbPreview((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(b);
        });
      }
    } finally {
      setRegenerating(false);
    }
  }

  const acceptFile = useCallback((f: File | null | undefined) => {
    if (!f) return;
    if (!f.type.startsWith("video/")) {
      toast.error("يُرجى اختيار ملف فيديو صالح");
      return;
    }
    if (f.size > MAX_UPLOAD_BYTES) {
      toast.error(
        `حجم الملف ${(f.size / (1024 * 1024)).toFixed(1)}MB يتجاوز 500MB. اضغطه إلى 720p.`,
      );
      return;
    }
    setFile(f);
    setStage("idle");
    setProgress(0);
    setUploadedPath(null);
    setThumbPath(null);
    setThumbBlob(null);
    setThumbPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setDuration(null);
  }, []);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    acceptFile(e.dataTransfer.files?.[0]);
  }

  function resetAll() {
    setFile(null);
    setPreviewUrl(null);
    setStage("idle");
    setProgress(0);
    setUploadedPath(null);
    setThumbPath(null);
    setThumbBlob(null);
    setThumbPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setDuration(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  async function onUpload() {
    if (!file) return toast.error("اختر ملف فيديو");
    setStage("uploading");
    setProgress(0);

    const timer = setInterval(() => {
      setProgress((p) => (p < 90 ? p + Math.max(1, Math.round((95 - p) / 15)) : p));
    }, 400);

    try {
      const ext = file.name.split(".").pop() || "mp4";
      const base = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const path = `${base}.${ext}`;

      const { error } = await supabase.storage
        .from("lessons")
        .upload(path, file, {
          contentType: file.type || "video/mp4",
          upsert: false,
        });
      if (error) throw error;

      // Upload thumbnail in parallel step
      let tPath: string | null = null;
      if (thumbBlob) {
        tPath = `thumbs/${base}.jpg`;
        const { error: tErr } = await supabase.storage
          .from("lessons")
          .upload(tPath, thumbBlob, { contentType: "image/jpeg", upsert: true });
        if (tErr) tPath = null;
      }

      setUploadedPath(path);
      setThumbPath(tPath);
      setProgress(100);
      setStage("uploaded");
      toast.success("تم رفع الفيديو. أكمل التفاصيل ثم اضغط نشر.");
    } catch (e: any) {
      toast.error(e?.message ?? "فشل الرفع");
      setStage("idle");
      setProgress(0);
    } finally {
      clearInterval(timer);
    }
  }

  async function onPublish() {
    if (!uploadedPath) return toast.error("ارفع الفيديو أولًا");
    if (!title.trim()) return toast.error("أضف عنوانًا للدرس");
    setStage("publishing");
    try {
      await createLesson({
        data: {
          title: title.trim(),
          description: description.trim() || null,
          category: category.trim() || null,
          video_path: uploadedPath,
          thumbnail_path: thumbPath,
          thumbnail_url: null,
          duration_seconds: duration,
          sort_order: 0,
          published: true,
        },
      });
      toast.success("تم نشر الدرس");
      setStage("done");
      setTitle("");
      setDescription("");
      setCategory("");
      resetAll();
      await refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "فشل النشر");
      setStage("uploaded");
    }
  }

  async function onTogglePublish(l: any) {
    try {
      await updateLesson({ data: { id: l.id, published: !l.published } });
      await refresh();
    } catch {
      toast.error("فشل التحديث");
    }
  }

  async function onDelete(l: any) {
    if (!confirm(`حذف "${l.title}" نهائيًا؟`)) return;
    try {
      await deleteLesson({
        data: { id: l.id, video_path: l.video_path, thumbnail_path: l.thumbnail_path },
      });
      toast.success("تم الحذف");
      await refresh();
    } catch {
      toast.error("فشل الحذف");
    }
  }

  function openEdit(l: any) {
    setEditing(l);
    setEditTitle(l.title ?? "");
    setEditDescription(l.description ?? "");
    setEditCategory(l.category ?? "");
    setEditPublished(!!l.published);
  }

  async function onSaveEdit() {
    if (!editing) return;
    if (!editTitle.trim()) return toast.error("العنوان مطلوب");
    setSavingEdit(true);
    try {
      await updateLesson({
        data: {
          id: editing.id,
          title: editTitle.trim(),
          description: editDescription.trim() || null,
          category: editCategory.trim() || null,
          published: editPublished,
        },
      });
      toast.success("تم حفظ التعديلات");
      setEditing(null);
      await refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "فشل الحفظ");
    } finally {
      setSavingEdit(false);
    }
  }


  const uploading = stage === "uploading";
  const publishing = stage === "publishing";
  const readyToPublish = stage === "uploaded" || stage === "publishing";

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold">دروس الفيديو</h2>
        <p className="text-muted-foreground text-sm mt-1">
          اسحب الفيديو، ارفعه، ثم أضف التفاصيل واضغط نشر.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">إضافة درس جديد</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => !file && fileInput.current?.click()}
            className={cn(
              "relative rounded-xl border-2 border-dashed transition-colors",
              "p-6 sm:p-8 text-center cursor-pointer",
              dragOver
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/60 hover:bg-muted/40",
              file && "cursor-default",
            )}
          >
            <input
              ref={fileInput}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => acceptFile(e.target.files?.[0])}
            />

            {!file ? (
              <div className="flex flex-col items-center gap-2">
                <div className="h-12 w-12 rounded-full bg-primary/10 grid place-items-center">
                  <UploadCloud className="h-6 w-6 text-primary" />
                </div>
                <p className="font-semibold">اسحب وأفلت الفيديو هنا</p>
                <p className="text-sm text-muted-foreground">
                  أو اضغط لاختيار ملف من جهازك (حتى 500MB)
                </p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 items-center text-start">
                {previewUrl && (
                  <video
                    src={previewUrl}
                    className="h-28 w-44 rounded-lg bg-black object-cover shrink-0"
                    muted
                    playsInline
                  />
                )}
                <div className="flex-1 min-w-0 w-full">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / (1024 * 1024)).toFixed(1)} MB
                        {duration ? ` · ${Math.round(duration / 60)} د` : ""}
                      </p>
                    </div>
                    {stage === "idle" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          resetAll();
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    {readyToPublish && (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                        <CheckCircle2 className="h-4 w-4" /> تم الرفع
                      </span>
                    )}
                  </div>
                  {(uploading || readyToPublish) && (
                    <div className="mt-3 space-y-1">
                      <Progress value={progress} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {uploading ? `جارٍ الرفع... ${progress}%` : "جاهز للنشر"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Thumbnail preview + regenerate */}
          {file && thumbPreview && (
            <div className="rounded-lg border p-3 flex flex-col sm:flex-row gap-3 items-start">
              <img
                src={thumbPreview}
                alt="thumbnail"
                className="w-40 h-24 object-cover rounded bg-muted shrink-0"
              />
              <div className="flex-1 space-y-2 w-full">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">صورة مصغّرة مُولَّدة تلقائيًا</Label>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={regenerating || !duration}
                    onClick={() => regenerateThumb(thumbAt)}
                  >
                    {regenerating ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                    <span className="mr-1">إعادة الالتقاط</span>
                  </Button>
                </div>
                {duration ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={duration}
                      step={0.5}
                      value={thumbAt}
                      onChange={(e) => setThumbAt(parseFloat(e.target.value))}
                      onMouseUp={(e) => regenerateThumb(parseFloat((e.target as HTMLInputElement).value))}
                      onTouchEnd={(e) => regenerateThumb(parseFloat((e.target as HTMLInputElement).value))}
                      className="flex-1"
                    />
                    <span className="text-xs text-muted-foreground w-14 text-end" dir="ltr">
                      {thumbAt.toFixed(1)}s
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {file && stage === "idle" && (
            <Button onClick={onUpload} className="gap-2 w-full sm:w-auto">
              <Upload className="h-4 w-4" />
              رفع الفيديو
            </Button>
          )}

          {uploading && (
            <Button disabled className="gap-2 w-full sm:w-auto">
              <Loader2 className="h-4 w-4 animate-spin" />
              جارٍ الرفع...
            </Button>
          )}

          {/* Details — enabled after upload */}
          <div
            className={cn(
              "space-y-4 transition-opacity",
              !readyToPublish && "opacity-50 pointer-events-none",
            )}
          >
            <div className="grid gap-2">
              <Label>العنوان *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: مقدمة في ChatGPT"
              />
            </div>
            <div className="grid gap-2">
              <Label>الوصف</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="وصف مختصر عن محتوى الدرس"
              />
            </div>
            <div className="grid gap-2">
              <Label>التصنيف</Label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="مثال: ChatGPT، Midjourney..."
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={onPublish}
                disabled={!readyToPublish || publishing || !title.trim()}
                className="gap-2"
                size="lg"
              >
                {publishing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {publishing ? "جارٍ النشر..." : "نشر الدرس"}
              </Button>
              {readyToPublish && !publishing && (
                <Button variant="ghost" onClick={resetAll}>
                  إلغاء
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">الدروس المنشورة</CardTitle>
        </CardHeader>
        <CardContent>
          {items === null ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا توجد دروس بعد.</p>
          ) : (
            <div className="divide-y">
              {items.map((l) => (
                <div key={l.id} className="py-3 flex items-center gap-3">
                  <div className="h-14 w-24 rounded overflow-hidden bg-muted shrink-0 grid place-items-center">
                    {l.thumbnail_url ? (
                      <img src={l.thumbnail_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <PlayCircle className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{l.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {l.category ?? "—"}
                      {l.duration_seconds ? ` · ${Math.round(l.duration_seconds / 60)} د` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <Switch checked={l.published} onCheckedChange={() => onTogglePublish(l)} />
                      <span className="text-xs text-muted-foreground">
                        {l.published ? "منشور" : "مخفي"}
                      </span>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => openEdit(l)} title="تعديل">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => onDelete(l)} title="حذف">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>

                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل معلومات الدرس</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>العنوان *</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>الوصف</Label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label>التصنيف</Label>
              <Input value={editCategory} onChange={(e) => setEditCategory(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={editPublished} onCheckedChange={setEditPublished} />
              <span className="text-sm text-muted-foreground">
                {editPublished ? "منشور" : "مخفي"}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)} disabled={savingEdit}>
              إلغاء
            </Button>
            <Button onClick={onSaveEdit} disabled={savingEdit || !editTitle.trim()}>
              {savingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : "حفظ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

}
