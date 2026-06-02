-- Journal entries (one row per day index 0..14)
CREATE TABLE public.journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day_index INTEGER NOT NULL UNIQUE,
  km NUMERIC NOT NULL DEFAULT 0,
  denivele INTEGER NOT NULL DEFAULT 0,
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.journal_entries TO anon, authenticated;
GRANT ALL ON public.journal_entries TO service_role;

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can view journal" ON public.journal_entries FOR SELECT USING (true);
CREATE POLICY "anyone can insert journal" ON public.journal_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "anyone can update journal" ON public.journal_entries FOR UPDATE USING (true);
CREATE POLICY "anyone can delete journal" ON public.journal_entries FOR DELETE USING (true);

-- Allow deleting photos (table + storage)
CREATE POLICY "anyone can delete photos" ON public.photos FOR DELETE USING (true);

CREATE POLICY "anyone can delete photo files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'photos');

CREATE POLICY "anyone can view photo files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'photos');
