
-- Roles
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read own roles" ON public.user_roles;
CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- Auto-grant admin to owner email
CREATE OR REPLACE FUNCTION public.grant_admin_on_signup()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.email = 'abouiba93@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created_roles ON auth.users;
CREATE TRIGGER on_auth_user_created_roles
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.grant_admin_on_signup();

-- Backfill: if the admin already signed up, grant it now
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'abouiba93@gmail.com'
ON CONFLICT DO NOTHING;

-- AI tools registry (admin toggles)
CREATE TABLE IF NOT EXISTS public.admin_ai_tools (
  tool_key text PRIMARY KEY,
  title text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_ai_tools TO anon, authenticated;
GRANT ALL ON public.admin_ai_tools TO service_role;
ALTER TABLE public.admin_ai_tools ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read tools" ON public.admin_ai_tools;
CREATE POLICY "read tools" ON public.admin_ai_tools FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "admin manage tools" ON public.admin_ai_tools;
CREATE POLICY "admin manage tools" ON public.admin_ai_tools FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.admin_ai_tools (tool_key, title, sort_order) VALUES
  ('image','تحويل النص إلى صورة',1),
  ('summarize','تلخيص المقالات',2),
  ('ideas','مولّد أفكار المقالات',3),
  ('translate','الترجمة الاحترافية',4),
  ('seo','مساعد SEO عربي',5)
ON CONFLICT (tool_key) DO NOTHING;

-- Stream overrides for World Cup matches
CREATE TABLE IF NOT EXISTS public.admin_stream_overrides (
  match_id text PRIMARY KEY,
  label text,
  stream_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_stream_overrides TO anon, authenticated;
GRANT ALL ON public.admin_stream_overrides TO service_role;
ALTER TABLE public.admin_stream_overrides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read overrides" ON public.admin_stream_overrides;
CREATE POLICY "read overrides" ON public.admin_stream_overrides FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "admin manage overrides" ON public.admin_stream_overrides;
CREATE POLICY "admin manage overrides" ON public.admin_stream_overrides FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Pinned matches
CREATE TABLE IF NOT EXISTS public.admin_pinned_matches (
  match_id text PRIMARY KEY,
  label text,
  priority int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_pinned_matches TO anon, authenticated;
GRANT ALL ON public.admin_pinned_matches TO service_role;
ALTER TABLE public.admin_pinned_matches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read pinned" ON public.admin_pinned_matches;
CREATE POLICY "read pinned" ON public.admin_pinned_matches FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "admin manage pinned" ON public.admin_pinned_matches;
CREATE POLICY "admin manage pinned" ON public.admin_pinned_matches FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Site settings (key/value)
CREATE TABLE IF NOT EXISTS public.admin_site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_site_settings TO anon, authenticated;
GRANT ALL ON public.admin_site_settings TO service_role;
ALTER TABLE public.admin_site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read settings" ON public.admin_site_settings;
CREATE POLICY "read settings" ON public.admin_site_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "admin manage settings" ON public.admin_site_settings;
CREATE POLICY "admin manage settings" ON public.admin_site_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
