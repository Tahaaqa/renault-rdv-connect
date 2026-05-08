
-- Roles enum and table (security best practice: roles in separate table)
CREATE TYPE public.app_role AS ENUM ('client', 'agent_fo', 'agent_bo');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT,
  prenom TEXT,
  telephone TEXT,
  email TEXT,
  agence_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE TABLE public.agences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  ville TEXT NOT NULL,
  adresse TEXT NOT NULL,
  telephone TEXT NOT NULL,
  latitude NUMERIC,
  longitude NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agences ENABLE ROW LEVEL SECURITY;

-- Security definer for role checks (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- profiles policies
CREATE POLICY "profiles self read" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles self update" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles self insert" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles admin read" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'agent_bo') OR public.has_role(auth.uid(), 'agent_fo'));

-- user_roles policies
CREATE POLICY "user_roles self read" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_roles admin read" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'agent_bo'));

-- agences: anyone authenticated can read; only ABO can write
CREATE POLICY "agences read all auth" ON public.agences
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "agences admin write" ON public.agences
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'agent_bo')) WITH CHECK (public.has_role(auth.uid(), 'agent_bo'));

-- Auto-create profile + default client role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nom, prenom, telephone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nom', ''),
    COALESCE(NEW.raw_user_meta_data->>'prenom', ''),
    COALESCE(NEW.raw_user_meta_data->>'telephone', '')
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed agencies
INSERT INTO public.agences (nom, ville, adresse, telephone) VALUES
  ('Renault Tunis-Centre', 'Tunis', 'Avenue Habib Bourguiba, Tunis', '+216 71 234 567'),
  ('Renault Sfax', 'Sfax', 'Route de Tunis, Sfax', '+216 74 456 789'),
  ('Renault Sousse', 'Sousse', 'Boulevard 14 Janvier, Sousse', '+216 73 678 901'),
  ('Renault Monastir', 'Monastir', 'Zone Industrielle Monastir', '+216 73 890 123'),
  ('Renault Bizerte', 'Bizerte', 'Avenue Farhat Hached, Bizerte', '+216 72 012 345'),
  ('Renault Gabès', 'Gabès', 'Route Nationale 1, Gabès', '+216 75 234 567');
