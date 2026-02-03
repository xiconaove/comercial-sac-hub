-- ============================================
-- SA COMERC - SAC - SCHEMA DO BANCO DE DADOS
-- ============================================
-- Este arquivo é uma referência do schema criado no Supabase
-- A conexão já está configurada em: src/integrations/supabase/client.ts
-- ============================================

-- ============================================
-- ENUMS
-- ============================================
-- sac_status: 'aberto', 'em_andamento', 'aguardando_cliente', 'aguardando_interno', 'resolvido', 'cancelado'
-- sac_priority: 'baixa', 'media', 'alta', 'urgente'
-- app_role: 'admin', 'supervisor', 'analista', 'usuario'

-- ============================================
-- TABELAS
-- ============================================

-- profiles: Perfis de usuários
-- Campos: id, email, full_name, avatar_url, phone, department, is_active, created_at, updated_at

-- user_roles: Papéis dos usuários (SEPARADO do profiles por segurança)
-- Campos: id, user_id, role, created_at

-- clients: Clientes
-- Campos: id, name, document, email, phone, address, city, state, notes, is_active, created_by, created_at, updated_at

-- sacs: Chamados SAC
-- Campos: id, number, title, description, status, priority, client_id, analyst_id, nf_number, deadline, resolved_at, created_by, created_at, updated_at

-- sac_images: Imagens dos SACs
-- Campos: id, sac_id, url, name, uploaded_by, created_at

-- sac_observers: Observadores dos SACs
-- Campos: id, sac_id, user_id, created_at

-- sac_comments: Comentários dos SACs
-- Campos: id, sac_id, user_id, content, is_internal, created_at, updated_at

-- sac_history: Histórico de alterações
-- Campos: id, sac_id, user_id, action, old_value, new_value, created_at

-- system_logs: Logs do sistema
-- Campos: id, user_id, action, entity_type, entity_id, details, ip_address, created_at

-- custom_fields: Campos personalizados
-- Campos: id, name, field_type, options, is_required, is_active, display_order, created_by, created_at, updated_at

-- sac_custom_values: Valores dos campos personalizados
-- Campos: id, sac_id, field_id, value, created_at, updated_at

-- permissions: Permissões por role/recurso
-- Campos: id, role, resource, can_create, can_read, can_update, can_delete, created_at

-- ============================================
-- FUNÇÕES DISPONÍVEIS
-- ============================================
-- has_role(user_id, role) - Verifica se usuário tem determinada role
-- is_admin_or_supervisor(user_id) - Verifica se é admin ou supervisor
-- update_updated_at() - Trigger para atualizar updated_at
-- handle_new_user() - Cria perfil automaticamente ao registrar

-- ============================================
-- COMO USAR NO CÓDIGO
-- ============================================
/*
import { supabase } from "@/integrations/supabase/client";

// Buscar SACs
const { data, error } = await supabase
  .from('sacs')
  .select('*, client:clients(*), analyst:profiles!analyst_id(*)');

// Criar SAC
const { data, error } = await supabase
  .from('sacs')
  .insert({
    title: 'Título',
    description: 'Descrição',
    client_id: 'uuid',
    created_by: user.id
  });

// Buscar com joins
const { data } = await supabase
  .from('sacs')
  .select(`
    *,
    client:clients(name, email),
    analyst:profiles!analyst_id(full_name, email),
    comments:sac_comments(*, user:profiles(full_name)),
    images:sac_images(*),
    observers:sac_observers(*, user:profiles(full_name))
  `);
*/
