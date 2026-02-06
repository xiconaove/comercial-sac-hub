import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useCustomFields } from '@/hooks/useCustomFields';
import { CustomFieldsRenderer } from '@/components/CustomFieldsRenderer';

interface SacData {
  id: string;
  title: string;
  description: string;
  priority: string;
  nf_number: string | null;
  deadline: string | null;
  client_id: string | null;
  analyst_id: string | null;
}

interface Client { id: string; name: string; }
interface Analyst { id: string; full_name: string; }

interface SacEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sac: SacData;
  onSaved: () => void;
}

export function SacEditDialog({ open, onOpenChange, sac, onSaved }: SacEditDialogProps) {
  const { user } = useAuth();
  const { fields: customFields } = useCustomFields('sac');

  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [analysts, setAnalysts] = useState<Analyst[]>([]);

  const [title, setTitle] = useState(sac.title);
  const [description, setDescription] = useState(sac.description);
  const [clientId, setClientId] = useState(sac.client_id || '');
  const [analystId, setAnalystId] = useState(sac.analyst_id || '');
  const [priority, setPriority] = useState(sac.priority);
  const [nfNumber, setNfNumber] = useState(sac.nf_number || '');
  const [deadline, setDeadline] = useState<Date | undefined>(sac.deadline ? new Date(sac.deadline) : undefined);
  const [customValues, setCustomValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setTitle(sac.title);
      setDescription(sac.description);
      setClientId(sac.client_id || '');
      setAnalystId(sac.analyst_id || '');
      setPriority(sac.priority);
      setNfNumber(sac.nf_number || '');
      setDeadline(sac.deadline ? new Date(sac.deadline) : undefined);
      fetchClients();
      fetchAnalysts();
      fetchCustomValues();
    }
  }, [open, sac]);

  const fetchClients = async () => {
    const { data } = await supabase.from('clients').select('id, name').eq('is_active', true).order('name');
    if (data) setClients(data);
  };

  const fetchAnalysts = async () => {
    const { data } = await supabase.from('profiles').select('id, full_name').eq('is_active', true).order('full_name');
    if (data) setAnalysts(data);
  };

  const fetchCustomValues = async () => {
    const { data } = await supabase
      .from('sac_custom_values')
      .select('field_id, value')
      .eq('sac_id', sac.id);
    if (data) {
      const vals: Record<string, string> = {};
      data.forEach(v => { if (v.value) vals[v.field_id] = v.value; });
      setCustomValues(vals);
    }
  };

  const handleCustomFieldChange = (fieldId: string, value: string) => {
    setCustomValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const updates: Record<string, any> = {};
      if (title !== sac.title) updates.title = title;
      if (description !== sac.description) updates.description = description;
      if ((clientId || null) !== sac.client_id) updates.client_id = clientId || null;
      if ((analystId || null) !== sac.analyst_id) updates.analyst_id = analystId || null;
      if (priority !== sac.priority) updates.priority = priority;
      if ((nfNumber || null) !== sac.nf_number) updates.nf_number = nfNumber || null;
      const newDeadline = deadline?.toISOString() || null;
      if (newDeadline !== sac.deadline) updates.deadline = newDeadline;

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase.from('sacs').update(updates).eq('id', sac.id);
        if (error) throw error;

        // Log changes
        const fieldLabels: Record<string, string> = {
          title: 'Título', description: 'Descrição', client_id: 'Cliente',
          analyst_id: 'Analista', priority: 'Prioridade', nf_number: 'NF',
          deadline: 'Prazo',
        };
        for (const [key, newVal] of Object.entries(updates)) {
          await supabase.from('sac_history').insert({
            sac_id: sac.id,
            user_id: user.id,
            action: `${fieldLabels[key] || key} alterado`,
            old_value: String((sac as any)[key] ?? ''),
            new_value: String(newVal ?? ''),
          });
        }
      }

      // Save custom field values - upsert approach
      const customEntries = Object.entries(customValues).filter(([_, v]) => v !== undefined);
      for (const [fieldId, value] of customEntries) {
        const { data: existing } = await supabase
          .from('sac_custom_values')
          .select('id')
          .eq('sac_id', sac.id)
          .eq('field_id', fieldId)
          .maybeSingle();

        if (existing) {
          await supabase.from('sac_custom_values').update({ value }).eq('id', existing.id);
        } else if (value) {
          await supabase.from('sac_custom_values').insert({ sac_id: sac.id, field_id: fieldId, value });
        }
      }

      toast.success('SAC atualizado com sucesso!');
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      toast.error('Erro ao atualizar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar SAC</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Título *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label>Descrição *</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} required />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Analista</Label>
              <Select value={analystId} onValueChange={setAnalystId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {analysts.map(a => <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Número da NF</Label>
              <Input value={nfNumber} onChange={(e) => setNfNumber(e.target.value)} placeholder="Ex: 12345" />
            </div>

            <div className="space-y-2">
              <Label>Prazo</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !deadline && 'text-muted-foreground')}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadline ? format(deadline, 'PPP', { locale: ptBR }) : 'Selecione'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={deadline} onSelect={setDeadline} initialFocus locale={ptBR} />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Custom Fields */}
          {customFields.length > 0 && (
            <div className="space-y-4">
              <Label className="text-base font-semibold">Campos Personalizados</Label>
              <div className="grid gap-4 md:grid-cols-2">
                <CustomFieldsRenderer fields={customFields} values={customValues} onChange={handleCustomFieldChange} />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={loading || !title.trim() || !description.trim()}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
