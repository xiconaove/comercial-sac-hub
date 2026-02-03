
-- ============================================
-- SA COMERC - SAC - SCHEMA COMPLETO
-- ============================================

-- Enums
CREATE TYPE public.sac_status AS ENUM ('aberto', 'em_andamento', 'aguardando_cliente', 'aguardando_interno', 'resolvido', 'cancelado');
CREATE TYPE public.sac_priority AS ENUM ('baixa', 'media', 'alta', 'urgente');
CREATE TYPE public.app_role AS ENUM ('admin', 'supervisor', 'analista', 'usuario');

-- ============================================
-- TABELA: profiles (perfis de usuários)
-- ============================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    department TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TABELA: user_roles (papéis dos usuários)
-- ============================================
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'usuario',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, role)
);

-- ============================================
-- TABELA: clients (clientes)
-- ============================================
CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    document TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TABELA: sacs (chamados SAC)
-- ============================================
CREATE TABLE public.sacs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number SERIAL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status sac_status DEFAULT 'aberto',
    priority sac_priority DEFAULT 'media',
    client_id UUID REFERENCES public.clients(id),
    analyst_id UUID REFERENCES auth.users(id),
    nf_number TEXT,
    deadline TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TABELA: sac_images (imagens dos SACs)
-- ============================================
CREATE TABLE public.sac_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sac_id UUID REFERENCES public.sacs(id) ON DELETE CASCADE NOT NULL,
    url TEXT NOT NULL,
    name TEXT,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TABELA: sac_observers (observadores)
-- ============================================
CREATE TABLE public.sac_observers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sac_id UUID REFERENCES public.sacs(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (sac_id, user_id)
);

-- ============================================
-- TABELA: sac_comments (comentários)
-- ============================================
CREATE TABLE public.sac_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sac_id UUID REFERENCES public.sacs(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TABELA: sac_history (histórico)
-- ============================================
CREATE TABLE public.sac_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sac_id UUID REFERENCES public.sacs(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TABELA: system_logs (logs do sistema)
-- ============================================
CREATE TABLE public.system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TABELA: custom_fields (campos personalizados)
-- ============================================
CREATE TABLE public.custom_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    field_type TEXT NOT NULL DEFAULT 'text',
    options JSONB,
    is_required BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TABELA: sac_custom_values (valores personalizados)
-- ============================================
CREATE TABLE public.sac_custom_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sac_id UUID REFERENCES public.sacs(id) ON DELETE CASCADE NOT NULL,
    field_id UUID REFERENCES public.custom_fields(id) ON DELETE CASCADE NOT NULL,
    value TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (sac_id, field_id)
);

-- ============================================
-- TABELA: permissions (permissões)
-- ============================================
CREATE TABLE public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role app_role NOT NULL,
    resource TEXT NOT NULL,
    can_create BOOLEAN DEFAULT false,
    can_read BOOLEAN DEFAULT true,
    can_update BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (role, resource)
);

-- ============================================
-- FUNÇÕES DE SEGURANÇA
-- ============================================

-- Função para verificar role do usuário
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
    )
$$;

-- Função para verificar se é admin ou supervisor
CREATE OR REPLACE FUNCTION public.is_admin_or_supervisor(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role IN ('admin', 'supervisor')
    )
$$;

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Função para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'usuario');
    
    RETURN NEW;
END;
$$;

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_sacs_updated_at BEFORE UPDATE ON public.sacs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_sac_comments_updated_at BEFORE UPDATE ON public.sac_comments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_custom_fields_updated_at BEFORE UPDATE ON public.custom_fields
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_sac_custom_values_updated_at BEFORE UPDATE ON public.sac_custom_values
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- RLS (Row Level Security)
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sacs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sac_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sac_observers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sac_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sac_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sac_custom_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

-- Policies para profiles
CREATE POLICY "Usuários podem ver todos os perfis" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários podem atualizar próprio perfil" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Policies para user_roles
CREATE POLICY "Usuários podem ver própria role" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins podem ver todas roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins podem gerenciar roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Policies para clients
CREATE POLICY "Usuários autenticados podem ver clientes" ON public.clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins e supervisores podem gerenciar clientes" ON public.clients FOR ALL TO authenticated USING (public.is_admin_or_supervisor(auth.uid()));

-- Policies para sacs
CREATE POLICY "Usuários podem ver SACs" ON public.sacs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários podem criar SACs" ON public.sacs FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Analistas podem atualizar SACs atribuídos" ON public.sacs FOR UPDATE TO authenticated USING (analyst_id = auth.uid() OR public.is_admin_or_supervisor(auth.uid()));

-- Policies para sac_images
CREATE POLICY "Usuários podem ver imagens" ON public.sac_images FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários podem adicionar imagens" ON public.sac_images FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploaded_by);

-- Policies para sac_observers
CREATE POLICY "Usuários podem ver observadores" ON public.sac_observers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins podem gerenciar observadores" ON public.sac_observers FOR ALL TO authenticated USING (public.is_admin_or_supervisor(auth.uid()));

-- Policies para sac_comments
CREATE POLICY "Usuários podem ver comentários" ON public.sac_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários podem criar comentários" ON public.sac_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem editar próprios comentários" ON public.sac_comments FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Policies para sac_history
CREATE POLICY "Usuários podem ver histórico" ON public.sac_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Sistema pode inserir histórico" ON public.sac_history FOR INSERT TO authenticated WITH CHECK (true);

-- Policies para system_logs
CREATE POLICY "Admins podem ver logs" ON public.system_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Sistema pode inserir logs" ON public.system_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Policies para custom_fields
CREATE POLICY "Usuários podem ver campos" ON public.custom_fields FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins podem gerenciar campos" ON public.custom_fields FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Policies para sac_custom_values
CREATE POLICY "Usuários podem ver valores" ON public.sac_custom_values FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários podem gerenciar valores" ON public.sac_custom_values FOR ALL TO authenticated USING (true);

-- Policies para permissions
CREATE POLICY "Usuários podem ver permissões" ON public.permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins podem gerenciar permissões" ON public.permissions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- DADOS INICIAIS (Permissões padrão)
-- ============================================
INSERT INTO public.permissions (role, resource, can_create, can_read, can_update, can_delete) VALUES
('admin', 'sacs', true, true, true, true),
('admin', 'clients', true, true, true, true),
('admin', 'users', true, true, true, true),
('admin', 'reports', true, true, true, true),
('admin', 'settings', true, true, true, true),
('supervisor', 'sacs', true, true, true, false),
('supervisor', 'clients', true, true, true, false),
('supervisor', 'users', false, true, false, false),
('supervisor', 'reports', true, true, false, false),
('analista', 'sacs', true, true, true, false),
('analista', 'clients', false, true, false, false),
('analista', 'reports', false, true, false, false),
('usuario', 'sacs', true, true, false, false),
('usuario', 'clients', false, true, false, false);
