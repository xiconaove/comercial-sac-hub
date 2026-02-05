import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2, MoveUp, MoveDown, Settings, Headphones, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

interface CustomField {
  id: string;
  name: string;
  field_type: string;
  options: string[] | null;
  is_required: boolean | null;
  is_active: boolean | null;
  display_order: number | null;
  entity_type: string;
}

const fieldTypes = [
  { value: 'text', label: 'Texto' },
  { value: 'textarea', label: 'Texto Longo' },
  { value: 'number', label: 'Número' },
  { value: 'date', label: 'Data' },
  { value: 'select', label: 'Seleção' },
  { value: 'checkbox', label: 'Checkbox' },
];

const entityTypes = [
  { value: 'sac', label: 'SAC', icon: Headphones },
  { value: 'client', label: 'Cliente', icon: Building2 },
];

export default function CustomFields() {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [filterEntity, setFilterEntity] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    field_type: 'text',
    options: '',
    is_required: false,
    entity_type: 'sac',
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => { fetchFields(); }, []);

  const fetchFields = async () => {
    const { data, error } = await supabase
      .from('custom_fields')
      .select('*')
      .order('display_order');

    if (!error && data) {
      setFields(data.map(f => ({
        ...f,
        options: f.options ? (f.options as string[]) : null,
        entity_type: (f as any).entity_type || 'sac',
      })));
    }
    setLoading(false);
  };

  const handleOpenCreate = () => {
    setEditingField(null);
    setFormData({ name: '', field_type: 'text', options: '', is_required: false, entity_type: 'sac' });
    setDialogOpen(true);
  };

  const handleOpenEdit = (field: CustomField) => {
    setEditingField(field);
    setFormData({
      name: field.name,
      field_type: field.field_type,
      options: field.options?.join('\n') || '',
      is_required: field.is_required || false,
      entity_type: field.entity_type,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({ title: 'Nome é obrigatório', variant: 'destructive' });
      return;
    }

    const options = formData.field_type === 'select' && formData.options
      ? formData.options.split('\n').filter(o => o.trim())
      : null;

    if (editingField) {
      const { error } = await supabase
        .from('custom_fields')
        .update({
          name: formData.name,
          field_type: formData.field_type,
          options,
          is_required: formData.is_required,
          entity_type: formData.entity_type,
        } as any)
        .eq('id', editingField.id);

      if (!error) {
        toast({ title: 'Campo atualizado!' });
        fetchFields();
        setDialogOpen(false);
      }
    } else {
      const maxOrder = Math.max(...fields.map(f => f.display_order || 0), 0);
      const { error } = await supabase
        .from('custom_fields')
        .insert({
          name: formData.name,
          field_type: formData.field_type,
          options,
          is_required: formData.is_required,
          entity_type: formData.entity_type,
          display_order: maxOrder + 1,
          created_by: user?.id,
        } as any);

      if (!error) {
        toast({ title: 'Campo criado!' });
        fetchFields();
        setDialogOpen(false);
      }
    }
  };

  const handleDelete = async (field: CustomField) => {
    if (!confirm(`Excluir o campo "${field.name}"?`)) return;
    await supabase.from('custom_fields').delete().eq('id', field.id);
    toast({ title: 'Campo excluído' });
    fetchFields();
  };

  const handleToggleActive = async (field: CustomField) => {
    await supabase.from('custom_fields').update({ is_active: !field.is_active }).eq('id', field.id);
    setFields(prev => prev.map(f => f.id === field.id ? { ...f, is_active: !f.is_active } : f));
  };

  const handleMoveOrder = async (field: CustomField, direction: 'up' | 'down') => {
    const currentIndex = filteredFields.findIndex(f => f.id === field.id);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= filteredFields.length) return;
    const otherField = filteredFields[newIndex];
    await Promise.all([
      supabase.from('custom_fields').update({ display_order: newIndex }).eq('id', field.id),
      supabase.from('custom_fields').update({ display_order: currentIndex }).eq('id', otherField.id),
    ]);
    fetchFields();
  };

  const filteredFields = filterEntity === 'all'
    ? fields
    : fields.filter(f => f.entity_type === filterEntity);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            Campos Personalizados
          </h1>
          <p className="text-muted-foreground">Crie campos extras para SACs e Clientes</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterEntity} onValueChange={setFilterEntity}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="sac">SAC</SelectItem>
              <SelectItem value="client">Cliente</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleOpenCreate} className="gradient-primary">
            <Plus className="mr-2 h-4 w-4" />
            Novo Campo
          </Button>
        </div>
      </div>

      <Card className="shadow-card border-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Obrigatório</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[120px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Carregando...</TableCell></TableRow>
              ) : filteredFields.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum campo personalizado</TableCell></TableRow>
              ) : (
                filteredFields.map((field, index) => (
                  <TableRow key={field.id}>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <Button variant="ghost" size="icon" className="h-5 w-5" disabled={index === 0} onClick={() => handleMoveOrder(field, 'up')}>
                          <MoveUp className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-5 w-5" disabled={index === filteredFields.length - 1} onClick={() => handleMoveOrder(field, 'down')}>
                          <MoveDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{field.name}</TableCell>
                    <TableCell>
                      <Badge variant={field.entity_type === 'sac' ? 'default' : 'secondary'}>
                        {field.entity_type === 'sac' ? '📋 SAC' : '🏢 Cliente'}
                      </Badge>
                    </TableCell>
                    <TableCell>{fieldTypes.find(t => t.value === field.field_type)?.label}</TableCell>
                    <TableCell>
                      <Badge variant={field.is_required ? 'default' : 'outline'}>{field.is_required ? 'Sim' : 'Não'}</Badge>
                    </TableCell>
                    <TableCell>
                      <Switch checked={field.is_active ?? true} onCheckedChange={() => handleToggleActive(field)} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(field)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(field)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingField ? 'Editar Campo' : 'Novo Campo Personalizado'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Campo</Label>
              <Input value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="Ex: Número do Pedido" />
            </div>

            <div className="space-y-2">
              <Label>Exibir em</Label>
              <div className="grid grid-cols-2 gap-2">
                {entityTypes.map(et => (
                  <Button
                    key={et.value}
                    type="button"
                    variant={formData.entity_type === et.value ? 'default' : 'outline'}
                    className="justify-start gap-2"
                    onClick={() => setFormData(prev => ({ ...prev, entity_type: et.value }))}
                  >
                    <et.icon className="h-4 w-4" />
                    {et.label}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {formData.entity_type === 'sac' 
                  ? 'Este campo será exibido no formulário de criação/edição de SAC'
                  : 'Este campo será exibido no formulário de criação/edição de Cliente'}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={formData.field_type} onValueChange={(v) => setFormData(prev => ({ ...prev, field_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {fieldTypes.map(type => (<SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            {formData.field_type === 'select' && (
              <div className="space-y-2">
                <Label>Opções (uma por linha)</Label>
                <Textarea value={formData.options} onChange={(e) => setFormData(prev => ({ ...prev, options: e.target.value }))} placeholder="Opção 1&#10;Opção 2" rows={4} />
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label>Campo Obrigatório</Label>
              <Switch checked={formData.is_required} onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_required: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} className="gradient-primary">{editingField ? 'Salvar' : 'Criar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
