CREATE TABLE public.match_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id text NOT NULL,
  match_data jsonb NOT NULL,
  kickoff_at timestamptz NOT NULL,
  notify_email boolean NOT NULL DEFAULT true,
  notify_browser boolean NOT NULL DEFAULT true,
  sent_24h boolean NOT NULL DEFAULT false,
  sent_1h boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, match_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_favorites TO authenticated;
GRANT ALL ON public.match_favorites TO service_role;

ALTER TABLE public.match_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own favorites"
  ON public.match_favorites FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_match_favorites_kickoff ON public.match_favorites (kickoff_at);
CREATE INDEX idx_match_favorites_user ON public.match_favorites (user_id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER match_favorites_updated_at
  BEFORE UPDATE ON public.match_favorites
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();