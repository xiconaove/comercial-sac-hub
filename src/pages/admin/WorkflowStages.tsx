import { useState, useEffect } from 'react';
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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2, MoveUp, MoveDown, GitBranch, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

interface WorkflowStage {
  id: string;
  name: string;
  slug: string;
  color: string;
  display_order: number;
  is_default: boolean;
  is_active: boolean;
}

const colorOptions = [
  { value: 'bg-blue-500', label: 'Azul' },
  { value: 'bg-yellow-500', label: 'Amarelo' },
  { value: 'bg-purple-500', label: 'Roxo' },
  { value: 'bg-orange-500', label: 'Laranja' },
  { value: 'bg-green-500', label: 'Verde' },
  { value: 'bg-gray-500', label: 'Cinza' },
  { value: 'bg-red-500', label: 'Vermelho' },
  { value: 'bg-pink-500', label: 'Rosa' },
  { value: 'bg-teal-500', label: 'Teal' },
  { value: 'bg-indigo-500', label: 'Índigo' },
];

export default function WorkflowStages() {
  const [stages, setStages] = useState<WorkflowStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<WorkflowStage | null>(null);
  const [formData, setFormData] = useState({ name: '', slug: '', color: 'bg-blue-500' });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => { fetchStages(); }, []);

  const fetchStages = async () => {
    const { data } = await supabase
      .from('workflow_stages')
      .select('*')
      .order('display_order');
    if (data) setStages(data as WorkflowStage[]);
    setLoading(false);
  };

  const handleOpenCreate = () => {
    setEditingStage(null);
    setFormData({ name: '', slug: '', color: 'bg-blue-500' });
    setDialogOpen(true);
  };

  const handleOpenEdit = (stage: WorkflowStage) => {
    if (stage.is_default) return;
    setEditingStage(stage);
    setFormData({ name: stage.name, slug: stage.slug, color: stage.color });
    setDialogOpen(true);
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({ title: 'Nome é obrigatório', variant: 'destructive' });
      return;
    }

    const slug = formData.slug || generateSlug(formData.name);

    if (editingStage) {
      const { error } = await supabase
        .from('workflow_stages')
        .update({ name: formData.name, slug, color: formData.color })
        .eq('id', editingStage.id);
      if (!error) {
        toast({ title: 'Etapa atualizada!' });
        fetchStages();
        setDialogOpen(false);
      } else {
        toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
      }
    } else {
      const maxOrder = Math.max(...stages.map(s => s.display_order), -1);
      const { error } = await supabase
        .from('workflow_stages')
        .insert({
          name: formData.name,
          slug,
          color: formData.color,
          display_order: maxOrder + 1,
          created_by: user?.id,
        });
      if (!error) {
        toast({ title: 'Etapa criada!' });
        fetchStages();
        setDialogOpen(false);
      } else {
        toast({ title: 'Erro ao criar', description: error.message, variant: 'destructive' });
      }
    }
  };

  const handleDelete = async (stage: WorkflowStage) => {
    if (stage.is_default) {
      toast({ title: 'Etapas padrão não podem ser excluídas', variant: 'destructive' });
      return;
    }
    if (!confirm(`Excluir a etapa "${stage.name}"?`)) return;
    await supabase.from('workflow_stages').delete().eq('id', stage.id);
    toast({ title: 'Etapa excluída' });
    fetchStages();
  };

  const handleToggleActive = async (stage: WorkflowStage) => {
    await supabase.from('workflow_stages').update({ is_active: !stage.is_active }).eq('id', stage.id);
    setStages(prev => prev.map(s => s.id === stage.id ? { ...s, is_active: !s.is_active } : s));
  };

  const handleMoveOrder = async (stage: WorkflowStage, direction: 'up' | 'down') => {
    const idx = stages.findIndex(s => s.id === stage.id);
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= stages.length) return;
    const other = stages[newIdx];
    await Promise.all([
      supabase.from('workflow_stages').update({ display_order: newIdx }).eq('id', stage.id),
      supabase.from('workflow_stages').update({ display_order: idx }).eq('id', other.id),
    ]);
    fetchStages();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GitBranch className="h-6 w-6 text-primary" />
            Etapas do Fluxo
          </h1>
          <p className="text-muted-foreground">Gerencie as etapas do Kanban (somente admin)</p>
        </div>
        <Button onClick={handleOpenCreate} className="gradient-primary">
          <Plus className="mr-2 h-4 w-4" />
          Nova Etapa
        </Button>
      </div>

      <Card className="shadow-card border-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Ordem</TableHead>
                <TableHead>Cor</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Ativo</TableHead>
                <TableHead className="w-[120px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stages.map((stage, index) => (
                <TableRow key={stage.id}>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <Button variant="ghost" size="icon" className="h-5 w-5" disabled={index === 0} onClick={() => handleMoveOrder(stage, 'up')}>
                        <MoveUp className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-5 w-5" disabled={index === stages.length - 1} onClick={() => handleMoveOrder(stage, 'down')}>
                        <MoveDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell><div className={`w-4 h-4 rounded-full ${stage.color}`} /></TableCell>
                  <TableCell className="font-medium">{stage.name}</TableCell>
                  <TableCell className="text-muted-foreground text-xs font-mono">{stage.slug}</TableCell>
                  <TableCell>
                    {stage.is_default ? (
                      <Badge variant="secondary" className="gap-1"><Lock className="h-3 w-3" />Padrão</Badge>
                    ) : (
                      <Badge variant="outline">Personalizado</Badge>
                    )}
                  </TableCell>
                  <TableCell><Switch checked={stage.is_active} onCheckedChange={() => handleToggleActive(stage)} /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" disabled={stage.is_default} onClick={() => handleOpenEdit(stage)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" disabled={stage.is_default} onClick={() => handleDelete(stage)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStage ? 'Editar Etapa' : 'Nova Etapa'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value, slug: generateSlug(e.target.value) }))} placeholder="Ex: Em Revisão" />
            </div>
            <div className="space-y-2">
              <Label>Slug (identificador)</Label>
              <Input value={formData.slug} onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))} placeholder="em_revisao" className="font-mono text-sm" />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map(c => (
                  <button key={c.value} type="button" onClick={() => setFormData(prev => ({ ...prev, color: c.value }))}
                    className={`w-8 h-8 rounded-full ${c.value} transition-transform ${formData.color === c.value ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'}`}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} className="gradient-primary">{editingStage ? 'Salvar' : 'Criar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
