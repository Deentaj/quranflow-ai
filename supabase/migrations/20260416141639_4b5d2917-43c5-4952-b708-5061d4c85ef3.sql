
CREATE TABLE public.daily_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  challenge_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  target_value integer NOT NULL DEFAULT 1,
  current_value integer NOT NULL DEFAULT 0,
  completed boolean DEFAULT false,
  xp_reward integer NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, date, challenge_type)
);

ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own challenges" ON public.daily_challenges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own challenges" ON public.daily_challenges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own challenges" ON public.daily_challenges FOR UPDATE USING (auth.uid() = user_id);

CREATE TABLE public.reading_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  surah_number integer NOT NULL,
  last_verse_read integer NOT NULL DEFAULT 0,
  total_verses integer NOT NULL,
  completed boolean DEFAULT false,
  last_read_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, surah_number)
);

ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reading" ON public.reading_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reading" ON public.reading_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reading" ON public.reading_progress FOR UPDATE USING (auth.uid() = user_id);
