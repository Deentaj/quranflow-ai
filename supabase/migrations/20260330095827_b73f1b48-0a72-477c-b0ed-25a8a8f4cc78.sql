
-- Add is_public column to reflections
ALTER TABLE public.reflections ADD COLUMN is_public boolean NOT NULL DEFAULT false;

-- Create reflection_reactions table
CREATE TABLE public.reflection_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reflection_id uuid NOT NULL REFERENCES public.reflections(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reaction_type text NOT NULL DEFAULT 'heart',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(reflection_id, user_id, reaction_type)
);

-- Enable RLS on reflection_reactions
ALTER TABLE public.reflection_reactions ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read public reflections
CREATE POLICY "Anyone can view public reflections"
  ON public.reflections FOR SELECT
  TO authenticated
  USING (is_public = true OR auth.uid() = user_id);

-- Users can react to public reflections
CREATE POLICY "Users can insert own reactions"
  ON public.reflection_reactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view reactions"
  ON public.reflection_reactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete own reactions"
  ON public.reflection_reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Drop the old select policy on reflections since we replaced it
DROP POLICY IF EXISTS "Users can view own reflections" ON public.reflections;
