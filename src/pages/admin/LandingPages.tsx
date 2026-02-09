import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Plus, Pencil, Copy, ExternalLink, Trash2, Loader2, Globe,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface LandingPage {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  welcome_message: string | null;
  success_message: string | null;
  responsible_id: string | null;
  is_active: boolean;
  created_at: string;
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
}

const emptyForm = {
  title: '',
  description: '',
  slug: '',
  logo_url: '',
  primary_color: '#3b82f6',
  secondary_color: '#1e40af',
  welcome_message: '',
  success_message: 'Seu chamado foi registrado com sucesso!',
  responsible_id: '',
  is_active: true,
};

export default function LandingPages() {
  const { user } = useAuth();
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchPages();
    fetchProfiles();
  }, []);

  const fetchPages = async () => {
    const { data } = await supabase
      .from('landing_pages')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setPages(data);
    setLoading(false);
  };

  const fetchProfiles = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('is_active', true)
      .order('full_name');
    if (data) setProfiles(data);
  };

  const generateSlug = (title: string) =>
    title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (page: LandingPage) => {
    setEditingId(page.id);
    setForm({
      title: page.title,
      description: page.description || '',
      slug: page.slug,
      logo_url: page.logo_url || '',
      primary_color: page.primary_color,
      secondary_color: page.secondary_color,
      welcome_message: page.welcome_message || '',
      success_message: page.success_message || '',
      responsible_id: page.responsible_id || '',
      is_active: page.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.slug.trim()) {
      toast.error('Título e slug são obrigatórios');
      return;
    }
    if (!user) return;
    setSaving(true);

    const payload = {
      title: form.title,
      description: form.description || null,
      slug: form.slug,
      logo_url: form.logo_url || null,
      primary_color: form.primary_color,
      secondary_color: form.secondary_color,
      welcome_message: form.welcome_message || null,
      success_message: form.success_message || null,
      responsible_id: form.responsible_id || null,
      is_active: form.is_active,
    };

    if (editingId) {
      const { error } = await supabase.from('landing_pages').update(payload).eq('id', editingId);
      if (error) toast.error('Erro ao atualizar: ' + error.message);
      else toast.success('Landing page atualizada!');
    } else {
      const { error } = await supabase.from('landing_pages').insert({ ...payload, created_by: user.id });
      if (error) toast.error('Erro ao criar: ' + error.message);
      else toast.success('Landing page criada!');
    }

    setSaving(false);
    setDialogOpen(false);
    fetchPages();
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    const { error } = await supabase.from('landing_pages').delete().eq('id', deletingId);
    if (error) toast.error('Erro ao excluir');
    else {
      toast.success('Landing page excluída!');
      fetchPages();
    }
    setDeleteDialogOpen(false);
    setDeletingId(null);
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/lp/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado!');
  };

  const getResponsibleName = (id: string | null) => {
    if (!id) return '—';
    const p = profiles.find(p => p.id === id);
    return p?.full_name || p?.email || '—';
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Landing Pages</h1>
          <p className="text-sm text-muted-foreground">Gerencie páginas públicas para abertura de SACs</p>
        </div>
        <Button onClick={openCreate} className="gradient-primary">
          <Plus className="mr-2 h-4 w-4" />Nova Landing Page
        </Button>
      </div>

      <Card className="shadow-card border-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <Globe className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p>Nenhuma landing page criada</p>
                  </TableCell>
                </TableRow>
              ) : pages.map((page) => (
                <TableRow key={page.id}>
                  <TableCell className="font-medium">{page.title}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">/lp/{page.slug}</code>
                  </TableCell>
                  <TableCell className="text-sm">{getResponsibleName(page.responsible_id)}</TableCell>
                  <TableCell>
                    <Badge className={page.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-500'}>
                      {page.is_active ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(page.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyLink(page.slug)} title="Copiar link">
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild title="Abrir">
                        <a href={`/lp/${page.slug}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(page)} title="Editar">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setDeletingId(page.id); setDeleteDialogOpen(true); }} title="Excluir">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Landing Page' : 'Nova Landing Page'}</DialogTitle>
            <DialogDescription>Configure os detalhes da página pública</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => {
                    setForm(f => ({
                      ...f,
                      title: e.target.value,
                      slug: editingId ? f.slug : generateSlug(e.target.value),
                    }));
                  }}
                  placeholder="Ex: Suporte SA Comerc"
                />
              </div>
              <div className="space-y-2">
                <Label>Slug (URL) *</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm(f => ({ ...f, slug: generateSlug(e.target.value) }))}
                  placeholder="suporte-sa-comerc"
                />
                <p className="text-[10px] text-muted-foreground">{window.location.origin}/lp/{form.slug || '...'}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descreva o propósito desta landing page" rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Mensagem de boas-vindas</Label>
              <Textarea value={form.welcome_message} onChange={(e) => setForm(f => ({ ...f, welcome_message: e.target.value }))} placeholder="Texto exibido no topo do formulário" rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Mensagem de sucesso</Label>
              <Input value={form.success_message} onChange={(e) => setForm(f => ({ ...f, success_message: e.target.value }))} placeholder="Mensagem após criar o SAC" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>URL do Logo</Label>
                <Input value={form.logo_url} onChange={(e) => setForm(f => ({ ...f, logo_url: e.target.value }))} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>Responsável</Label>
                <Select value={form.responsible_id} onValueChange={(v) => setForm(f => ({ ...f, responsible_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {profiles.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.full_name || p.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Cor primária</Label>
                <div className="flex gap-2">
                  <input type="color" value={form.primary_color} onChange={(e) => setForm(f => ({ ...f, primary_color: e.target.value }))} className="h-9 w-12 rounded border cursor-pointer" />
                  <Input value={form.primary_color} onChange={(e) => setForm(f => ({ ...f, primary_color: e.target.value }))} className="flex-1" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Cor secundária</Label>
                <div className="flex gap-2">
                  <input type="color" value={form.secondary_color} onChange={(e) => setForm(f => ({ ...f, secondary_color: e.target.value }))} className="h-9 w-12 rounded border cursor-pointer" />
                  <Input value={form.secondary_color} onChange={(e) => setForm(f => ({ ...f, secondary_color: e.target.value }))} className="flex-1" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm(f => ({ ...f, is_active: v }))} />
              <Label>Landing page ativa</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="gradient-primary">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingId ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Landing Page</DialogTitle>
            <DialogDescription>Tem certeza? Esta ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
