import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Plus, Search, Eye, Calendar, User, Building2, List, Kanban } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SacKanban } from '@/components/sacs/SacKanban';
import { motion } from 'framer-motion';

interface Sac {
  id: string;
  number: number;
  title: string;
  status: string;
  priority: string;
  nf_number: string | null;
  deadline: string | null;
  created_at: string;
  client_name: string | null;
  analyst_name: string | null;
}

type SacStatus = 'aberto' | 'em_andamento' | 'aguardando_cliente' | 'aguardando_interno' | 'resolvido' | 'cancelado';
type SacPriority = 'baixa' | 'media' | 'alta' | 'urgente';

export default function SacList() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [sacs, setSacs] = useState<Sac[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || 'all');
  const [viewMode, setViewMode] = useState<string>('list');

  useEffect(() => { fetchSacs(); }, [statusFilter, priorityFilter]);

  const fetchSacs = async () => {
    setLoading(true);
    let query = supabase
      .from('sacs')
      .select('id, number, title, status, priority, nf_number, deadline, created_at, client_id, analyst_id')
      .order('created_at', { ascending: false });
    if (statusFilter !== 'all') query = query.eq('status', statusFilter as SacStatus);
    if (priorityFilter !== 'all') query = query.eq('priority', priorityFilter as SacPriority);

    const { data: sacsData } = await query;
    if (sacsData) {
      const clientIds = [...new Set(sacsData.map(s => s.client_id).filter(Boolean))];
      const analystIds = [...new Set(sacsData.map(s => s.analyst_id).filter(Boolean))];
      const [clientsRes, analystsRes] = await Promise.all([
        clientIds.length > 0 ? supabase.from('clients').select('id, name').in('id', clientIds) : { data: [] },
        analystIds.length > 0 ? supabase.from('profiles').select('id, full_name').in('id', analystIds) : { data: [] },
      ]);
      const clientsMap = new Map((clientsRes.data || []).map(c => [c.id, c.name]));
      const analystsMap = new Map((analystsRes.data || []).map(a => [a.id, a.full_name]));
      setSacs(sacsData.map(sac => ({
        id: sac.id, number: sac.number, title: sac.title, status: sac.status,
        priority: sac.priority, nf_number: sac.nf_number, deadline: sac.deadline,
        created_at: sac.created_at,
        client_name: sac.client_id ? clientsMap.get(sac.client_id) || null : null,
        analyst_name: sac.analyst_id ? analystsMap.get(sac.analyst_id) || null : null,
      })));
    }
    setLoading(false);
  };

  const filteredSacs = sacs.filter(sac =>
    sac.title.toLowerCase().includes(search.toLowerCase()) ||
    sac.number.toString().includes(search) ||
    sac.nf_number?.toLowerCase().includes(search.toLowerCase()) ||
    sac.client_name?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const v: Record<string, { label: string; className: string }> = {
      aberto: { label: 'Aberto', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
      em_andamento: { label: 'Em Andamento', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
      aguardando_cliente: { label: 'Ag. Cliente', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
      aguardando_interno: { label: 'Ag. Interno', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
      resolvido: { label: 'Resolvido', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
      cancelado: { label: 'Cancelado', className: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300' },
    };
    const item = v[status] || v.aberto;
    return <Badge className={item.className}>{item.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const v: Record<string, { label: string; className: string }> = {
      baixa: { label: 'Baixa', className: 'border-gray-300 text-gray-600' },
      media: { label: 'Média', className: 'border-blue-300 text-blue-600' },
      alta: { label: 'Alta', className: 'border-orange-300 text-orange-600' },
      urgente: { label: 'Urgente', className: 'border-red-300 text-red-600' },
    };
    const item = v[priority] || v.media;
    return <Badge variant="outline" className={item.className}>{item.label}</Badge>;
  };

  const isOverdue = (deadline: string | null, status: string) => {
    if (!deadline || status === 'resolvido' || status === 'cancelado') return false;
    return new Date(deadline) < new Date();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">SACs</h1>
          <p className="text-muted-foreground">Gerencie todos os chamados de atendimento</p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={setViewMode} className="w-auto">
            <TabsList className="h-9">
              <TabsTrigger value="list" className="text-xs gap-1 px-3">
                <List className="h-3.5 w-3.5" />Lista
              </TabsTrigger>
              <TabsTrigger value="kanban" className="text-xs gap-1 px-3">
                <Kanban className="h-3.5 w-3.5" />Kanban
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button asChild className="gradient-primary h-9 text-sm">
            <Link to="/sacs/new">
              <Plus className="mr-1.5 h-4 w-4" />Novo SAC
            </Link>
          </Button>
        </div>
      </div>

      {viewMode === 'list' && (
        <>
          <Card className="shadow-card border-0">
            <CardContent className="p-3">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar por título, número, NF ou cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-9" />
                </div>
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Status</SelectItem>
                      <SelectItem value="aberto">Aberto</SelectItem>
                      <SelectItem value="em_andamento">Em Andamento</SelectItem>
                      <SelectItem value="aguardando_cliente">Ag. Cliente</SelectItem>
                      <SelectItem value="aguardando_interno">Ag. Interno</SelectItem>
                      <SelectItem value="resolvido">Resolvido</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-[130px] h-9"><SelectValue placeholder="Prioridade" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-0">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">#</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Analista</TableHead>
                    <TableHead>Prazo</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8">Carregando...</TableCell></TableRow>
                  ) : filteredSacs.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum SAC encontrado</TableCell></TableRow>
                  ) : (
                    filteredSacs.map((sac) => (
                      <TableRow key={sac.id} className={`cursor-pointer hover:bg-muted/50 ${isOverdue(sac.deadline, sac.status) ? 'bg-destructive/5' : ''}`} onClick={() => navigate(`/sacs/${sac.id}`)}>
                        <TableCell className="font-medium text-primary">#{sac.number}</TableCell>
                        <TableCell>
                          <div className="max-w-[200px] truncate font-medium">{sac.title}</div>
                          {sac.nf_number && <div className="text-xs text-muted-foreground">NF: {sac.nf_number}</div>}
                        </TableCell>
                        <TableCell><div className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-muted-foreground" /><span className="truncate max-w-[100px] text-sm">{sac.client_name || '-'}</span></div></TableCell>
                        <TableCell><div className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-muted-foreground" /><span className="truncate max-w-[100px] text-sm">{sac.analyst_name || '-'}</span></div></TableCell>
                        <TableCell>
                          {sac.deadline ? (
                            <div className={`flex items-center gap-1 text-sm ${isOverdue(sac.deadline, sac.status) ? 'text-destructive font-medium' : ''}`}>
                              <Calendar className="h-3.5 w-3.5" />
                              {format(new Date(sac.deadline), 'dd/MM/yy', { locale: ptBR })}
                            </div>
                          ) : <span className="text-muted-foreground text-sm">-</span>}
                        </TableCell>
                        <TableCell>{getPriorityBadge(sac.priority)}</TableCell>
                        <TableCell>{getStatusBadge(sac.status)}</TableCell>
                        <TableCell>
                          <Button asChild variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                            <Link to={`/sacs/${sac.id}`}><Eye className="h-4 w-4" /></Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {viewMode === 'kanban' && (
        <div className="mt-2">
          <SacKanban />
        </div>
      )}
    </motion.div>
  );
}
