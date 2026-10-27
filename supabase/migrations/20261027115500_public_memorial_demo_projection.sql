-- Visitor demo: sanctioned, sanitized projection; never grant anon SELECT to private tables.
CREATE TABLE IF NOT EXISTS public.memorial_public_demo_profiles (
 memorial_id uuid PRIMARY KEY REFERENCES public.memorials(id) ON DELETE CASCADE,
 dedication text NOT NULL CHECK (length(dedication)<=500),
 biography text NOT NULL CHECK (length(biography)<=8000),
 highlights jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(highlights)='array'),
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.memorial_public_demo_profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.memorial_public_demo_profiles FROM PUBLIC,anon,authenticated;
INSERT INTO public.memorial_public_demo_profiles(memorial_id,dedication,biography,highlights)
SELECT id,'Il suo sorriso resterà sempre con noi.',
'Giovanni amava le piccole cose: le domeniche in famiglia, le passeggiate nella natura, le conversazioni che duravano fino a sera. Nella vita ha coltivato relazioni, curiosità e una generosità discreta. Questo memoriale dimostrativo raccoglie alcune parole e ricordi, per mostrare come ogni famiglia possa custodire una storia e condividerla con chi l’ha conosciuta.',
'[{"year":"1948","title":"Una storia che comincia","detail":"Nasce Giovanni."},{"year":"1974","title":"La famiglia","detail":"L’inizio di tanti momenti insieme."},{"year":"1992","title":"Le passioni","detail":"Passeggiate, amicizie e ricordi di viaggio."},{"year":"2025","title":"Un ricordo che continua","detail":"Le persone care custodiscono la sua memoria."}]'::jsonb
FROM public.memorials WHERE demo_code='M01' AND is_demo=true
ON CONFLICT (memorial_id) DO NOTHING;
CREATE OR REPLACE FUNCTION public.get_public_memorial_demo()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
 SELECT jsonb_build_object(
  'name',m.deceased_name,'birth_date',m.birth_date,'death_date',m.death_date,
  'tier',m.tier,'dedication',p.dedication,'biography',p.biography,'highlights',p.highlights,
  'memories',COALESCE((SELECT jsonb_agg(jsonb_build_object('title',x.title,'body',x.body) ORDER BY x.created_at DESC) FROM public.memorial_memories x WHERE x.memorial_id=m.id AND x.moderation_status='APPROVED'), '[]'::jsonb),
  'thoughts',COALESCE((SELECT jsonb_agg(jsonb_build_object('author',x.author_name,'body',x.body) ORDER BY x.created_at DESC) FROM public.memorial_thoughts x WHERE x.memorial_id=m.id AND x.moderation_status='APPROVED'),'[]'::jsonb),
  'is_demo',true)
 FROM public.memorials m JOIN public.memorial_public_demo_profiles p ON p.memorial_id=m.id
 WHERE m.demo_code='M01' AND m.is_demo=true AND m.status='PUBLISHED_ACTIVE' AND m.visibility='PUBLIC'
 LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.get_public_memorial_demo() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_memorial_demo() TO anon,authenticated;
COMMENT ON FUNCTION public.get_public_memorial_demo() IS 'Read-only public projection of the explicitly published synthetic M01 sample; never returns membership, private data, pending content or identifiers.';
