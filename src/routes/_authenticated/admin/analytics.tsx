import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, BarChart3, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  component: AdminAnalytics,
});

function AdminAnalytics() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold">التحليلات</h2>
        <p className="text-muted-foreground text-sm mt-1">
          روابط سريعة لأدوات التحليل الخارجية المرتبطة بالموقع.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-4 w-4 text-primary" />
              Google Search Console
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              حالة الفهرسة، الكلمات المفتاحية، النقرات والظهور في نتائج البحث.
            </p>
            <Button asChild variant="outline" className="gap-2">
              <a
                href="https://search.google.com/search-console"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
                فتح GSC
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Bing Webmaster
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">مؤشرات الأداء والفهرسة على محرك Bing.</p>
            <Button asChild variant="outline" className="gap-2">
              <a href="https://www.bing.com/webmasters/" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                فتح Bing
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
