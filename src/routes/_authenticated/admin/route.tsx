import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin-sidebar";
import { checkIsAdmin } from "@/lib/admin.functions";
import { Loader2, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const [state, setState] = useState<"loading" | "ok" | "denied">("loading");
  const navigate = useNavigate();

  useEffect(() => {
    checkIsAdmin()
      .then((r) => setState(r.isAdmin ? "ok" : "denied"))
      .catch(() => setState("denied"));
  }, []);

  if (state === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (state === "denied") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <ShieldAlert className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="text-2xl font-bold">الوصول مرفوض</h1>
          <p className="text-muted-foreground">
            هذه اللوحة مخصصة للمشرف فقط. تأكد من تسجيل الدخول بالحساب الصحيح.
          </p>
          <button
            onClick={() => navigate({ to: "/" })}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full" dir="rtl">
        <AdminSidebar />
        <SidebarInset className="flex-1 flex flex-col">
          <header className="h-14 flex items-center gap-2 border-b bg-background px-4 sticky top-0 z-10">
            <SidebarTrigger />
            <h1 className="text-sm font-semibold">لوحة تحكم Bouiba Academy</h1>
          </header>
          <main className="flex-1 p-4 md:p-8 bg-muted/30">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
