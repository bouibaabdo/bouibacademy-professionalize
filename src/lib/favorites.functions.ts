import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const favoriteInput = z.object({
  match_id: z.string().min(1),
  match_data: z.object({
    home: z.string(),
    away: z.string(),
    homeBadge: z.string().optional(),
    awayBadge: z.string().optional(),
    venue: z.string().optional(),
    round: z.string().optional(),
  }),
  kickoff_at: z.string(),
});

export const listFavorites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("match_favorites")
      .select("*")
      .order("kickoff_at", { ascending: true });
    if (error) throw new Error(error.message);
    return { favorites: data ?? [] };
  });

export const addFavorite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => favoriteInput.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("match_favorites").insert({
      user_id: context.userId,
      match_id: data.match_id,
      match_data: data.match_data,
      kickoff_at: data.kickoff_at,
    });
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    return { ok: true };
  });

export const removeFavorite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ match_id: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("match_favorites")
      .delete()
      .eq("match_id", data.match_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateFavoritePrefs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        notify_email: z.boolean().optional(),
        notify_browser: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const patch: { notify_email?: boolean; notify_browser?: boolean } = {};
    if (data.notify_email !== undefined) patch.notify_email = data.notify_email;
    if (data.notify_browser !== undefined) patch.notify_browser = data.notify_browser;
    const { error } = await context.supabase
      .from("match_favorites")
      .update(patch)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
