
-- Tabela de landing pages
CREATE TABLE public.landing_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3b82f6',
  secondary_color TEXT DEFAULT '#1e40af',
  welcome_message TEXT,
  success_message TEXT DEFAULT 'Seu chamado foi registrado com sucesso!',
  responsible_id UUID REFERENCES public.profiles(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins podem gerenciar landing pages"
ON public.landing_pages FOR ALL
USING (is_admin_or_supervisor(auth.uid()));

CREATE POLICY "Qualquer pessoa pode ver landing pages ativas"
ON public.landing_pages FOR SELECT
USING (is_active = true);

-- Trigger for updated_at
CREATE TRIGGER update_landing_pages_updated_at
BEFORE UPDATE ON public.landing_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Index para busca por slug
CREATE INDEX idx_landing_pages_slug ON public.landing_pages(slug);
