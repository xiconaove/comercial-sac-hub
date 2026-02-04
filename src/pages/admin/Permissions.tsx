import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Shield, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface Permission {
  id: string;
  role: AppRole;
  resource: string;
  can_create: boolean | null;
  can_read: boolean | null;
  can_update: boolean | null;
  can_delete: boolean | null;
}

const roleLabels: Record<AppRole, string> = {
  admin: 'Administrador',
  supervisor: 'Supervisor',
  analista: 'Analista',
  usuario: 'Usuário',
};

const defaultResources = ['sacs', 'clients', 'reports', 'users', 'custom_fields', 'system_logs'];

export default function Permissions() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    role: 'usuario' as AppRole,
    resource: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .order('role')
      .order('resource');

    if (error) {
      toast({ title: 'Erro ao carregar permissões', variant: 'destructive' });
    } else {
      setPermissions(data || []);
    }
    setLoading(false);
  };

  const handleTogglePermission = async (
    permission: Permission,
    field: 'can_create' | 'can_read' | 'can_update' | 'can_delete'
  ) => {
    const newValue = !permission[field];
    
    const { error } = await supabase
      .from('permissions')
      .update({ [field]: newValue })
      .eq('id', permission.id);

    if (error) {
      toast({ title: 'Erro ao atualizar permissão', variant: 'destructive' });
    } else {
      setPermissions(prev => prev.map(p => 
        p.id === permission.id ? { ...p, [field]: newValue } : p
      ));
    }
  };

  const handleCreatePermission = async () => {
    if (!formData.resource.trim()) {
      toast({ title: 'Recurso é obrigatório', variant: 'destructive' });
      return;
    }

    const exists = permissions.some(
      p => p.role === formData.role && p.resource === formData.resource
    );

    if (exists) {
      toast({ title: 'Esta permissão já existe', variant: 'destructive' });
      return;
    }

    const { error } = await supabase
      .from('permissions')
      .insert({
        role: formData.role,
        resource: formData.resource,
        can_create: false,
        can_read: true,
        can_update: false,
        can_delete: false,
      });

    if (error) {
      toast({ title: 'Erro ao criar permissão', variant: 'destructive' });
    } else {
      toast({ title: 'Permissão criada com sucesso' });
      fetchPermissions();
      setDialogOpen(false);
      setFormData({ role: 'usuario', resource: '' });
    }
  };

  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.role]) acc[perm.role] = [];
    acc[perm.role].push(perm);
    return acc;
  }, {} as Record<AppRole, Permission[]>);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Permissões</h1>
            <p className="text-muted-foreground">Configure permissões por papel</p>
          </div>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gradient-primary">
          <Plus className="mr-2 h-4 w-4" />
          Nova Permissão
        </Button>
      </div>

      {loading ? (
        <Card className="shadow-card border-0">
          <CardContent className="py-8 text-center">
            Carregando...
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {(['admin', 'supervisor', 'analista', 'usuario'] as AppRole[]).map(role => (
            <Card key={role} className="shadow-card border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Badge variant="outline">{roleLabels[role]}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recurso</TableHead>
                      <TableHead className="text-center w-24">Criar</TableHead>
                      <TableHead className="text-center w-24">Ler</TableHead>
                      <TableHead className="text-center w-24">Atualizar</TableHead>
                      <TableHead className="text-center w-24">Excluir</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(groupedPermissions[role] || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          Nenhuma permissão configurada
                        </TableCell>
                      </TableRow>
                    ) : (
                      (groupedPermissions[role] || []).map(perm => (
                        <TableRow key={perm.id}>
                          <TableCell className="font-medium">{perm.resource}</TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={perm.can_create ?? false}
                              onCheckedChange={() => handleTogglePermission(perm, 'can_create')}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={perm.can_read ?? false}
                              onCheckedChange={() => handleTogglePermission(perm, 'can_read')}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={perm.can_update ?? false}
                              onCheckedChange={() => handleTogglePermission(perm, 'can_update')}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={perm.can_delete ?? false}
                              onCheckedChange={() => handleTogglePermission(perm, 'can_delete')}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Permissão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Papel</Label>
              <Select
                value={formData.role}
                onValueChange={(v) => setFormData(prev => ({ ...prev, role: v as AppRole }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="analista">Analista</SelectItem>
                  <SelectItem value="usuario">Usuário</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Recurso</Label>
              <Select
                value={formData.resource}
                onValueChange={(v) => setFormData(prev => ({ ...prev, resource: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um recurso" />
                </SelectTrigger>
                <SelectContent>
                  {defaultResources.map(resource => (
                    <SelectItem key={resource} value={resource}>
                      {resource}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreatePermission}>
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
