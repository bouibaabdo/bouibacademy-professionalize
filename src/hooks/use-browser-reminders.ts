import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Fav {
  id: string;
  match_id: string;
  match_data: { home: string; away: string; venue?: string };
  kickoff_at: string;
  notify_browser: boolean;
}

const STORAGE_KEY = "wc_browser_reminders_sent";

function loadSent(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}
function saveSent(v: Record<string, number>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
  } catch {
    /* ignore */
  }
}

export function useBrowserReminders() {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    async function check() {
      if (Notification.permission !== "granted") return;
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;
      const { data: favs } = await supabase
        .from("match_favorites")
        .select("id,match_id,match_data,kickoff_at,notify_browser")
        .eq("notify_browser", true);
      if (!favs) return;
      const now = Date.now();
      const sent = loadSent();
      (favs as unknown as Fav[]).forEach((f) => {
        const kickoff = new Date(f.kickoff_at).getTime();
        const diffMin = (kickoff - now) / 60000;
        // 24h window: 24h - 5min ... 24h + 5min
        const in24 = diffMin <= 1445 && diffMin >= 1435;
        // 1h window
        const in1 = diffMin <= 65 && diffMin >= 55;
        const key24 = `${f.match_id}:24`;
        const key1 = `${f.match_id}:1`;
        if (in24 && !sent[key24]) {
          new Notification("⚽ تذكير: مباراة غدًا", {
            body: `${f.match_data.home} vs ${f.match_data.away} — بعد 24 ساعة`,
            icon: "/favicon.ico",
            tag: key24,
          });
          sent[key24] = now;
        }
        if (in1 && !sent[key1]) {
          new Notification("🔴 المباراة تبدأ خلال ساعة!", {
            body: `${f.match_data.home} vs ${f.match_data.away}${f.match_data.venue ? " — " + f.match_data.venue : ""}`,
            icon: "/favicon.ico",
            tag: key1,
          });
          sent[key1] = now;
        }
      });
      saveSent(sent);
    }

    check();
    timerRef.current = setInterval(check, 60_000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);
}
