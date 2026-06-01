
-- Photos table
CREATE TABLE public.photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  storage_path TEXT NOT NULL,
  caption TEXT,
  author TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.photos TO anon, authenticated;
GRANT ALL ON public.photos TO service_role;

ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can view photos" ON public.photos FOR SELECT USING (true);
CREATE POLICY "anyone can insert photos" ON public.photos FOR INSERT WITH CHECK (true);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "public read photos bucket" ON storage.objects FOR SELECT USING (bucket_id = 'photos');
CREATE POLICY "public upload photos bucket" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'photos');
