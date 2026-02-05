import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CustomField {
  id: string;
  name: string;
  field_type: string;
  options: string[] | null;
  is_required: boolean;
  is_active: boolean;
  entity_type: string;
  display_order: number;
}

export function useCustomFields(entityType: 'sac' | 'client') {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFields();
  }, [entityType]);

  const fetchFields = async () => {
    const { data } = await supabase
      .from('custom_fields')
      .select('*')
      .eq('entity_type', entityType)
      .eq('is_active', true)
      .order('display_order');

    if (data) {
      setFields(data.map(f => ({
        ...f,
        options: f.options ? (f.options as string[]) : null,
        is_required: f.is_required ?? false,
        is_active: f.is_active ?? true,
        entity_type: (f as any).entity_type || 'sac',
        display_order: f.display_order ?? 0,
      })));
    }
    setLoading(false);
  };

  return { fields, loading, refetch: fetchFields };
}
