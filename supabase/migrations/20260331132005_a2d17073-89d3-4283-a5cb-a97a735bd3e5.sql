
ALTER TABLE public.profiles
ADD COLUMN reminder_enabled boolean DEFAULT false,
ADD COLUMN reminder_time text DEFAULT '08:00';
