DROP POLICY IF EXISTS "Admins can view releases" ON public.releases;
DROP POLICY IF EXISTS "Admins can update releases" ON public.releases;
DROP POLICY IF EXISTS "Admins can delete releases" ON public.releases;

CREATE POLICY "Crew can view releases" ON public.releases FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Crew can update releases" ON public.releases FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Crew can delete releases" ON public.releases FOR DELETE TO anon, authenticated USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.releases TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.releases TO authenticated;
GRANT ALL ON public.releases TO service_role;

DROP POLICY IF EXISTS "Admins can read release files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete release files" ON storage.objects;

CREATE POLICY "Crew can read release files" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = ANY (ARRAY['release-signatures'::text, 'release-pdfs'::text]));
CREATE POLICY "Crew can delete release files" ON storage.objects FOR DELETE TO anon, authenticated
  USING (bucket_id = ANY (ARRAY['release-signatures'::text, 'release-pdfs'::text]));

DROP TABLE IF EXISTS public.user_roles;
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
DROP TYPE IF EXISTS public.app_role;