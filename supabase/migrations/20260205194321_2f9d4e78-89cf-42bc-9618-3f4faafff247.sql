
-- Add entity_type to custom_fields to specify where the field is displayed
ALTER TABLE public.custom_fields ADD COLUMN IF NOT EXISTS entity_type text NOT NULL DEFAULT 'sac';

-- Create workflow_stages table for custom kanban stages
CREATE TABLE IF NOT EXISTS public.workflow_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  color text NOT NULL DEFAULT 'bg-blue-500',
  display_order integer NOT NULL DEFAULT 0,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workflow_stages ENABLE ROW LEVEL SECURITY;

-- Policies for workflow_stages
CREATE POLICY "Anyone can view workflow stages"
  ON public.workflow_stages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage workflow stages"
  ON public.workflow_stages FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Insert default workflow stages
INSERT INTO public.workflow_stages (name, slug, color, display_order, is_default) VALUES
  ('Aberto', 'aberto', 'bg-blue-500', 0, true),
  ('Em Andamento', 'em_andamento', 'bg-yellow-500', 1, true),
  ('Ag. Cliente', 'aguardando_cliente', 'bg-purple-500', 2, true),
  ('Ag. Interno', 'aguardando_interno', 'bg-orange-500', 3, true),
  ('Resolvido', 'resolvido', 'bg-green-500', 4, true),
  ('Cancelado', 'cancelado', 'bg-gray-500', 5, true);

-- Trigger for updated_at
CREATE TRIGGER update_workflow_stages_updated_at
  BEFORE UPDATE ON public.workflow_stages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Also need a table for client custom values
CREATE TABLE IF NOT EXISTS public.client_custom_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  field_id uuid NOT NULL REFERENCES public.custom_fields(id) ON DELETE CASCADE,
  value text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.client_custom_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view client custom values"
  ON public.client_custom_values FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage client custom values"
  ON public.client_custom_values FOR ALL
  TO authenticated
  USING (public.is_admin_or_supervisor(auth.uid()));

-- Also fix sac_observers RLS to allow any authenticated user to add/remove observers
CREATE POLICY "Users can manage observers on their SACs"
  ON public.sac_observers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sacs
      WHERE sacs.id = sac_observers.sac_id
      AND (sacs.created_by = auth.uid() OR sacs.analyst_id = auth.uid() OR public.is_admin_or_supervisor(auth.uid()))
    )
  );

CREATE POLICY "Users can remove observers on their SACs"
  ON public.sac_observers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sacs
      WHERE sacs.id = sac_observers.sac_id
      AND (sacs.created_by = auth.uid() OR sacs.analyst_id = auth.uid() OR public.is_admin_or_supervisor(auth.uid()))
    )
  );
