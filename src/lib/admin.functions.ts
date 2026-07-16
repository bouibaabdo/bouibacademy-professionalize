import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden");
}

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { isAdmin: Boolean(data) };
  });

// ---------------- AI TOOLS ----------------
export const listAiTools = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("admin_ai_tools")
      .select("*")
      .order("sort_order");
    if (error) throw error;
    return data ?? [];
  });

export const toggleAiTool = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ tool_key: z.string(), enabled: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("admin_ai_tools")
      .update({ enabled: data.enabled, updated_at: new Date().toISOString() })
      .eq("tool_key", data.tool_key);
    if (error) throw error;
    return { ok: true };
  });

// ---------------- STREAM OVERRIDES ----------------
export const listStreamOverrides = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("admin_stream_overrides")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const upsertStreamOverride = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        match_id: z.string().min(1),
        label: z.string().optional().nullable(),
        stream_urls: z.array(z.string().url()),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("admin_stream_overrides").upsert(
      {
        match_id: data.match_id,
        label: data.label ?? null,
        stream_urls: data.stream_urls,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "match_id" },
    );
    if (error) throw error;
    return { ok: true };
  });

export const deleteStreamOverride = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ match_id: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("admin_stream_overrides")
      .delete()
      .eq("match_id", data.match_id);
    if (error) throw error;
    return { ok: true };
  });

// ---------------- PINNED MATCHES ----------------
export const listPinnedMatches = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("admin_pinned_matches")
      .select("*")
      .order("priority", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const pinMatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        match_id: z.string().min(1),
        label: z.string().optional().nullable(),
        priority: z.number().int().default(0),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("admin_pinned_matches")
      .upsert(data, { onConflict: "match_id" });
    if (error) throw error;
    return { ok: true };
  });

export const unpinMatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ match_id: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("admin_pinned_matches")
      .delete()
      .eq("match_id", data.match_id);
    if (error) throw error;
    return { ok: true };
  });

// ---------------- STATS ----------------
export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const [tools, overrides, pinned, favorites] = await Promise.all([
      context.supabase.from("admin_ai_tools").select("*", { count: "exact", head: true }),
      context.supabase
        .from("admin_stream_overrides")
        .select("*", { count: "exact", head: true }),
      context.supabase
        .from("admin_pinned_matches")
        .select("*", { count: "exact", head: true }),
      context.supabase.from("match_favorites").select("*", { count: "exact", head: true }),
    ]);
    return {
      toolsCount: tools.count ?? 0,
      overridesCount: overrides.count ?? 0,
      pinnedCount: pinned.count ?? 0,
      favoritesCount: favorites.count ?? 0,
    };
  });
