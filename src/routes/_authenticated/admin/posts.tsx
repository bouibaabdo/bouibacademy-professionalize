import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getPosts } from "@/lib/blogger.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Pencil, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/posts")({
  component: AdminPosts,
});

function AdminPosts() {
  const [posts, setPosts] = useState<any[] | null>(null);
  useEffect(() => {
    getPosts()
      .then((p: any) => setPosts(Array.isArray(p) ? p : p?.posts ?? []))
      .catch(() => setPosts([]));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">المقالات</h2>
          <p className="text-muted-foreground text-sm mt-1">
            المقالات تُدار عبر Blogger — التعديلات تظهر تلقائياً على الموقع.
          </p>
        </div>
        <Button asChild>
          <a href="https://www.blogger.com/" target="_blank" rel="noopener noreferrer" className="gap-2">
            <ExternalLink className="h-4 w-4" />
            فتح لوحة Blogger
          </a>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">آخر المقالات</CardTitle>
        </CardHeader>
        <CardContent>
          {posts === null ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : posts.length === 0 ? (
            <p className="text-sm text-muted-foreground">لم يتم العثور على مقالات.</p>
          ) : (
            <div className="divide-y">
              {posts.slice(0, 30).map((p: any) => (
                <div key={p.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{p.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {p.published ? new Date(p.published).toLocaleDateString("ar-EG-u-nu-latn") : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {p.url && (
                      <Button asChild size="sm" variant="ghost">
                        <a href={p.url} target="_blank" rel="noopener noreferrer" className="gap-1">
                          <ExternalLink className="h-3.5 w-3.5" />
                          عرض
                        </a>
                      </Button>
                    )}
                    <Button asChild size="sm" variant="outline">
                      <a
                        href="https://www.blogger.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="gap-1"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        تعديل
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
