
-- 1. Add stage_day to photos
ALTER TABLE public.photos ADD COLUMN IF NOT EXISTS stage_day integer;
-- -1 = avant, 0..14 = pendant l'étape N, 15 = après

-- 2. Photo reactions
CREATE TABLE IF NOT EXISTS public.photo_reactions (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references public.photos(id) on delete cascade,
  emoji text not null,
  author text not null default 'Anonyme',
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, DELETE ON public.photo_reactions TO anon, authenticated;
GRANT ALL ON public.photo_reactions TO service_role;
ALTER TABLE public.photo_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can read reactions" ON public.photo_reactions FOR SELECT USING (true);
CREATE POLICY "anyone can insert reactions" ON public.photo_reactions FOR INSERT WITH CHECK (true);
CREATE POLICY "anyone can delete reactions" ON public.photo_reactions FOR DELETE USING (true);
CREATE INDEX IF NOT EXISTS photo_reactions_photo_idx ON public.photo_reactions(photo_id);

-- 3. Guestbook
CREATE TABLE IF NOT EXISTS public.guestbook (
  id uuid primary key default gen_random_uuid(),
  author text not null,
  message text not null,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT ON public.guestbook TO anon, authenticated;
GRANT ALL ON public.guestbook TO service_role;
ALTER TABLE public.guestbook ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can read guestbook" ON public.guestbook FOR SELECT USING (true);
CREATE POLICY "anyone can insert guestbook" ON public.guestbook FOR INSERT WITH CHECK (true);
