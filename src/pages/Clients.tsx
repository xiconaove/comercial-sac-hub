import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Search, Pencil, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomFields } from '@/hooks/useCustomFields';
import { CustomFieldsRenderer } from '@/components/CustomFieldsRenderer';
import { motion } from 'framer-motion';

interface Client {
  id: string; name: string; document: string | null; email: string | null;
  phone: string | null; city: string | null; state: string | null; is_active: boolean;
}

export default function Clients() {
  const { user, isAdminOrSupervisor } = useAuth();
  const { fields: customFields } = useCustomFields('client');
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  const [name, setName] = useState('');
  const [document, setDocument] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [customValues, setCustomValues] = useState<Record<string, string>>({});

  useEffect(() => { fetchClients(); }, []);

  const fetchClients = async () => {
    const { data } = await supabase.from('clients').select('*').order('name');
    if (data) setClients(data as Client[]);
    setLoading(false);
  };

  const resetForm = () => {
    setName(''); setDocument(''); setEmail(''); setPhone('');
    setCity(''); setState(''); setAddress(''); setNotes('');
    setEditingClient(null); setCustomValues({});
  };

  const handleOpenDialog = async (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setName(client.name); setDocument(client.document || '');
      setEmail(client.email || ''); setPhone(client.phone || '');
      setCity(client.city || ''); setState(client.state || '');
      // Load custom values for this client
      const { data: cvData } = await supabase
        .from('client_custom_values')
        .select('field_id, value')
        .eq('client_id', client.id);
      const vals: Record<string, string> = {};
      cvData?.forEach(cv => { if (cv.value) vals[cv.field_id] = cv.value; });
      setCustomValues(vals);
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCustomFieldChange = (fieldId: string, value: string) => {
    setCustomValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error('Nome é obrigatório'); return; }

    const clientData = {
      name, document: document || null, email: email || null,
      phone: phone || null, city: city || null, state: state || null,
      address: address || null, notes: notes || null, created_by: user?.id,
    };

    let clientId: string;

    if (editingClient) {
      const { error } = await supabase.from('clients').update(clientData).eq('id', editingClient.id);
      if (error) { toast.error('Erro ao atualizar'); return; }
      clientId = editingClient.id;
      toast.success('Cliente atualizado!');
    } else {
      const { data, error } = await supabase.from('clients').insert(clientData).select().single();
      if (error) { toast.error('Erro ao criar'); return; }
      clientId = data.id;
      toast.success('Cliente criado!');
    }

    // Save custom field values
    const entries = Object.entries(customValues).filter(([_, v]) => v);
    if (entries.length > 0) {
      // Delete existing and re-insert
      await supabase.from('client_custom_values').delete().eq('client_id', clientId);
      await supabase.from('client_custom_values').insert(
        entries.map(([fieldId, value]) => ({ client_id: clientId, field_id: fieldId, value }))
      );
    }

    fetchClients();
    setIsDialogOpen(false);
    resetForm();
  };

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.document?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-muted-foreground text-sm">Gerencie os clientes do sistema</p>
        </div>
        {isAdminOrSupervisor() && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary h-9 text-sm" onClick={() => handleOpenDialog()}>
                <Plus className="mr-1.5 h-4 w-4" />Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
                <DialogDescription>{editingClient ? 'Atualize os dados' : 'Preencha os dados'}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>CNPJ/CPF</Label><Input value={document} onChange={(e) => setDocument(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Telefone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
                </div>
                <div className="space-y-2"><Label>E-mail</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Cidade</Label><Input value={city} onChange={(e) => setCity(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Estado</Label><Input value={state} onChange={(e) => setState(e.target.value)} maxLength={2} /></div>
                </div>

                {/* Custom fields for Client */}
                {customFields.length > 0 && (
                  <>
                    <Label className="text-sm font-semibold mt-2">Campos Personalizados</Label>
                    <CustomFieldsRenderer fields={customFields} values={customValues} onChange={handleCustomFieldChange} />
                  </>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSubmit} className="gradient-primary">{editingClient ? 'Salvar' : 'Criar'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="shadow-card border-0">
        <CardContent className="p-3">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome, CNPJ ou e-mail..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-9" />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card border-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CNPJ/CPF</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Cidade/UF</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Carregando...</TableCell></TableRow>
              ) : filteredClients.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">
                  <Building2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground/20" />
                  <p className="text-muted-foreground text-sm">Nenhum cliente encontrado</p>
                </TableCell></TableRow>
              ) : filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell className="text-sm">{client.document || '-'}</TableCell>
                  <TableCell className="text-sm">{client.email || '-'}</TableCell>
                  <TableCell className="text-sm">{client.phone || '-'}</TableCell>
                  <TableCell className="text-sm">{client.city && client.state ? `${client.city}/${client.state}` : '-'}</TableCell>
                  <TableCell><Badge variant={client.is_active ? 'default' : 'secondary'}>{client.is_active ? 'Ativo' : 'Inativo'}</Badge></TableCell>
                  <TableCell>
                    {isAdminOrSupervisor() && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(client)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}
