import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { addFavorite, removeFavorite } from "@/lib/favorites.functions";

interface Props {
  matchId: string;
  matchData: {
    home: string;
    away: string;
    homeBadge?: string;
    awayBadge?: string;
    venue?: string;
    round?: string;
  };
  kickoffAt: string;
  initiallyFavorited?: boolean;
  onChange?: (fav: boolean) => void;
  size?: "sm" | "md";
}

export function FavoriteButton({ matchId, matchData, kickoffAt, initiallyFavorited, onChange, size = "md" }: Props) {
  const [fav, setFav] = useState(!!initiallyFavorited);
  const [loading, setLoading] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setFav(!!initiallyFavorited);
  }, [initiallyFavorited]);

  async function toggle() {
    if (!authed) {
      toast.info("سجّل الدخول لحفظ المباراة وتلقي التذكيرات");
      navigate({ to: "/auth" });
      return;
    }
    setLoading(true);
    try {
      if (fav) {
        await removeFavorite({ data: { match_id: matchId } });
        setFav(false);
        onChange?.(false);
        toast.success("أُزيلت من المفضلة");
      } else {
        await addFavorite({
          data: { match_id: matchId, match_data: matchData, kickoff_at: kickoffAt },
        });
        setFav(true);
        onChange?.(true);
        toast.success("أُضيفت للمفضلة — ستتلقى تذكيرًا قبل المباراة");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطأ");
    } finally {
      setLoading(false);
    }
  }

  const dims = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const icon = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={fav ? "إزالة من المفضلة" : "إضافة للمفضلة وتفعيل التنبيه"}
      title={fav ? "في المفضلة — إشعارات مفعّلة" : "أضف للمفضلة لتلقي تنبيه"}
      className={`${dims} inline-flex items-center justify-center rounded-full border transition disabled:opacity-50 ${
        fav
          ? "bg-amber-100 border-amber-300 text-amber-600 hover:bg-amber-200"
          : "bg-background border-border text-muted-foreground hover:text-amber-500 hover:border-amber-300"
      }`}
    >
      <Star className={`${icon} ${fav ? "fill-current" : ""}`} />
    </button>
  );
}
