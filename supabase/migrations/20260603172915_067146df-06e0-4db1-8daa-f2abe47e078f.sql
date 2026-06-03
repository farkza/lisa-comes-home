-- Table gr20_journal pour le journal de bord
CREATE TABLE IF NOT EXISTS public.gr20_journal (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hiker text NOT NULL DEFAULT 'lisa',
  day_index integer NOT NULL,
  stage text NOT NULL DEFAULT '',
  km numeric NOT NULL DEFAULT 0,
  denivele integer NOT NULL DEFAULT 0,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (hiker, day_index)
);

GRANT SELECT ON public.gr20_journal TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gr20_journal TO authenticated;
GRANT ALL ON public.gr20_journal TO service_role;

ALTER TABLE public.gr20_journal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can read gr20_journal"
  ON public.gr20_journal FOR SELECT
  USING (true);

CREATE POLICY "authenticated can insert gr20_journal"
  ON public.gr20_journal FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated can update gr20_journal"
  ON public.gr20_journal FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "authenticated can delete gr20_journal"
  ON public.gr20_journal FOR DELETE TO authenticated
  USING (true);

-- Vider la galerie photos (table + storage est fait à part)
DELETE FROM public.photos;