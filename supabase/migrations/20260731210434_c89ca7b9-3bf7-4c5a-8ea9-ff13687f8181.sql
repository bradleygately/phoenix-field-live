CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

CREATE POLICY "Users can read their own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE public.releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id text NOT NULL UNIQUE,
  kind text NOT NULL CHECK (kind IN ('adult','minor')),
  participant_name text NOT NULL,
  signer_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text NOT NULL,
  on_screen_name text,
  organization text,
  relationship text,
  minor_dob text,
  minor_age text,
  restrictions text,
  copy_requested boolean NOT NULL DEFAULT false,
  agreed_to_terms boolean NOT NULL DEFAULT false,
  release_obtained_by text,
  session_location text,
  camera_card_ref text,
  event_name text,
  event_venue text,
  event_dates text,
  project_title text,
  signature_path text,
  minor_assent_path text,
  pdf_path text,
  signed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX releases_signed_at_idx ON public.releases (signed_at DESC);

GRANT INSERT ON public.releases TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.releases TO authenticated;
GRANT ALL ON public.releases TO service_role;
ALTER TABLE public.releases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a release"
  ON public.releases FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view releases"
  ON public.releases FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update releases"
  ON public.releases FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete releases"
  ON public.releases FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, public;

CREATE TRIGGER update_releases_updated_at
  BEFORE UPDATE ON public.releases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Anyone can upload release files"
  ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id IN ('release-signatures','release-pdfs'));

CREATE POLICY "Admins can read release files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id IN ('release-signatures','release-pdfs') AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete release files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('release-signatures','release-pdfs') AND public.has_role(auth.uid(), 'admin'));