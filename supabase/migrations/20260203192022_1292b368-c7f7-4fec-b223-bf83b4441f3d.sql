
-- Corrigir search_path na função update_updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Corrigir policies permissivas (WITH CHECK true)
DROP POLICY IF EXISTS "Sistema pode inserir histórico" ON public.sac_history;
CREATE POLICY "Sistema pode inserir histórico" ON public.sac_history 
FOR INSERT TO authenticated 
WITH CHECK (user_id = auth.uid() OR public.is_admin_or_supervisor(auth.uid()));

DROP POLICY IF EXISTS "Sistema pode inserir logs" ON public.system_logs;
CREATE POLICY "Sistema pode inserir logs" ON public.system_logs 
FOR INSERT TO authenticated 
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Usuários podem gerenciar valores" ON public.sac_custom_values;
CREATE POLICY "Usuários podem gerenciar valores" ON public.sac_custom_values 
FOR ALL TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.sacs 
        WHERE sacs.id = sac_custom_values.sac_id 
        AND (sacs.created_by = auth.uid() OR sacs.analyst_id = auth.uid() OR public.is_admin_or_supervisor(auth.uid()))
    )
);
