-- 1. Create app_role enum and user_roles table (security best practice)
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 3. RLS for user_roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. Admin invite codes table
CREATE TABLE public.admin_invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

ALTER TABLE public.admin_invite_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage invite codes"
  ON public.admin_invite_codes FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed an initial bootstrap admin code (change/delete after first use)
INSERT INTO public.admin_invite_codes (code) VALUES ('BOOTSTRAP-ADMIN-2026');

-- 5. Function to redeem an admin invite code
CREATE OR REPLACE FUNCTION public.redeem_admin_invite_code(_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _invite_id UUID;
  _user_id UUID := auth.uid();
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id INTO _invite_id
  FROM public.admin_invite_codes
  WHERE code = _code
    AND used_by IS NULL
    AND (expires_at IS NULL OR expires_at > now())
  LIMIT 1;

  IF _invite_id IS NULL THEN
    RETURN FALSE;
  END IF;

  UPDATE public.admin_invite_codes
  SET used_by = _user_id, used_at = now()
  WHERE id = _invite_id;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN TRUE;
END;
$$;

-- 6. Global daily challenges (curated by admins, assigned to all users)
CREATE TABLE public.global_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  target_value INTEGER NOT NULL DEFAULT 1,
  xp_reward INTEGER NOT NULL DEFAULT 10,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.global_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view active challenges"
  ON public.global_challenges FOR SELECT
  TO authenticated
  USING (active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage global challenges"
  ON public.global_challenges FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_global_challenges_updated_at
  BEFORE UPDATE ON public.global_challenges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Moderation: hidden flag on reflections + admin policies
ALTER TABLE public.reflections ADD COLUMN IF NOT EXISTS hidden BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.reflections ADD COLUMN IF NOT EXISTS hidden_reason TEXT;

-- Drop old public viewing policy and recreate with hidden filter
DROP POLICY IF EXISTS "Anyone can view public reflections" ON public.reflections;

CREATE POLICY "Anyone can view public reflections"
  ON public.reflections FOR SELECT
  TO authenticated
  USING (
    (is_public = true AND hidden = false)
    OR auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can update any reflection"
  ON public.reflections FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any reflection"
  ON public.reflections FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 8. Allow admins to view all profiles (for user management)
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 9. Allow admins to view all activities (for analytics)
CREATE POLICY "Admins can view all activities"
  ON public.activities FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));