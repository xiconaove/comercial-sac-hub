import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCustomFields, type CustomField } from '@/hooks/useCustomFields';

interface CustomValueDisplay {
  field: CustomField;
  value: string;
}

export function useSacCustomValues(sacId: string | undefined) {
  const { fields } = useCustomFields('sac');
  const [customValues, setCustomValues] = useState<CustomValueDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sacId && fields.length > 0) {
      fetchValues();
    } else if (!sacId) {
      setLoading(false);
    }
  }, [sacId, fields]);

  const fetchValues = async () => {
    const { data } = await supabase
      .from('sac_custom_values')
      .select('field_id, value')
      .eq('sac_id', sacId!);

    if (data) {
      const valMap = new Map(data.map(v => [v.field_id, v.value || '']));
      const display = fields
        .filter(f => valMap.has(f.id) && valMap.get(f.id))
        .map(f => ({ field: f, value: valMap.get(f.id)! }));
      setCustomValues(display);
    }
    setLoading(false);
  };

  return { customValues, loading, refetch: fetchValues };
}
