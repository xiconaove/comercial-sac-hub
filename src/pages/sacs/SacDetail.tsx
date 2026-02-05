import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft, Calendar, Building2, User, Clock, Send, History, Eye, MessageSquare,
  Loader2, FileText, UserPlus, Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

type SacStatus = 'aberto' | 'em_andamento' | 'aguardando_cliente' | 'aguardando_interno' | 'resolvido' | 'cancelado';

interface SacDetailData {
  id: string; number: number; title: string; description: string; status: SacStatus;
  priority: string; nf_number: string | null; deadline: string | null;
  created_at: string; updated_at: string; resolved_at: string | null;
  client_id: string | null; analyst_id: string | null; created_by: string;
}

interface Comment { id: string; content: string; is_internal: boolean; created_at: string; user_id: string; user_name: string | null; user_avatar: string | null; }
interface HistoryItem { id: string; action: string; old_value: string | null; new_value: string | null; created_at: string; user_name: string | null; }
interface Observer { id: string; user_id: string; user_name: string | null; user_email: string | null; }
interface Profile { id: string; full_name: string | null; email: string; }

export default function SacDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [sac, setSac] = useState<SacDetailData | null>(null);
  const [clientName, setClientName] = useState<string | null>(null);
  const [analystName, setAnalystName] = useState<string | null>(null);
  const [creatorName, setCreatorName] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [observers, setObservers] = useState<Observer[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [selectedObserver, setSelectedObserver] = useState('');

  useEffect(() => {
    if (id) {
      Promise.all([fetchSacDetails(), fetchComments(), fetchHistory(), fetchObservers(), fetchAllProfiles()]);
    }
  }, [id]);

  const fetchSacDetails = async () => {
    const { data } = await supabase.from('sacs').select('*').eq('id', id).maybeSingle();
    if (data) {
      setSac(data as SacDetailData);
      const [clientRes, analystRes, creatorRes] = await Promise.all([
        data.client_id ? supabase.from('clients').select('name').eq('id', data.client_id).maybeSingle() : null,
        data.analyst_id ? supabase.from('profiles').select('full_name').eq('id', data.analyst_id).maybeSingle() : null,
        supabase.from('profiles').select('full_name').eq('id', data.created_by).maybeSingle()
      ]);
      setClientName(clientRes?.data?.name || null);
      setAnalystName(analystRes?.data?.full_name || null);
      setCreatorName(creatorRes?.data?.full_name || null);
    }
    setLoading(false);
  };

  const fetchComments = async () => {
    const { data } = await supabase.from('sac_comments').select('id, content, is_internal, created_at, user_id').eq('sac_id', id).order('created_at', { ascending: true });
    if (data) {
      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', userIds);
      const pMap = new Map(profiles?.map(p => [p.id, p]) || []);
      setComments(data.map(c => ({ ...c, user_name: pMap.get(c.user_id)?.full_name || null, user_avatar: pMap.get(c.user_id)?.avatar_url || null })));
    }
  };

  const fetchHistory = async () => {
    const { data } = await supabase.from('sac_history').select('id, action, old_value, new_value, created_at, user_id').eq('sac_id', id).order('created_at', { ascending: false });
    if (data) {
      const userIds = [...new Set(data.map(h => h.user_id).filter(Boolean))] as string[];
      const { data: profiles } = userIds.length > 0 ? await supabase.from('profiles').select('id, full_name').in('id', userIds) : { data: [] };
      const pMap = new Map<string, string>();
      profiles?.forEach(p => pMap.set(p.id, p.full_name || ''));
      setHistory(data.map(h => ({ ...h, user_name: h.user_id ? pMap.get(h.user_id) || null : null })));
    }
  };

  const fetchObservers = async () => {
    const { data } = await supabase.from('sac_observers').select('id, user_id').eq('sac_id', id);
    if (data) {
      const userIds = data.map(o => o.user_id);
      const { data: profiles } = userIds.length > 0 ? await supabase.from('profiles').select('id, full_name, email').in('id', userIds) : { data: [] };
      const pMap = new Map((profiles as Profile[])?.map(p => [p.id, p]) || []);
      setObservers(data.map(o => ({ ...o, user_name: pMap.get(o.user_id)?.full_name || null, user_email: pMap.get(o.user_id)?.email || null })));
    }
  };

  const fetchAllProfiles = async () => {
    const { data } = await supabase.from('profiles').select('id, full_name, email').eq('is_active', true).order('full_name');
    if (data) setAllProfiles(data as Profile[]);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!sac || !user) return;
    const { error } = await supabase.from('sacs').update({ status: newStatus as SacStatus, resolved_at: newStatus === 'resolvido' ? new Date().toISOString() : null }).eq('id', sac.id);
    if (!error) {
      await supabase.from('sac_history').insert({ sac_id: sac.id, user_id: user.id, action: 'Status alterado', old_value: sac.status, new_value: newStatus });
      toast.success('Status atualizado!');
      fetchSacDetails();
      fetchHistory();
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user || !sac) return;
    setSendingComment(true);
    const { error } = await supabase.from('sac_comments').insert({ sac_id: sac.id, user_id: user.id, content: newComment, is_internal: isInternal });
    if (!error) {
      await supabase.from('sac_history').insert({ sac_id: sac.id, user_id: user.id, action: isInternal ? 'Comentário interno' : 'Comentário adicionado' });
      setNewComment('');
      fetchComments();
      fetchHistory();
      toast.success('Comentário adicionado!');
    }
    setSendingComment(false);
  };

  const handleAddObserver = async () => {
    if (!selectedObserver || !sac || !user) return;
    if (observers.find(o => o.user_id === selectedObserver)) {
      toast.error('Observador já adicionado');
      return;
    }
    const { error } = await supabase.from('sac_observers').insert({ sac_id: sac.id, user_id: selectedObserver });
    if (!error) {
      toast.success('Observador adicionado!');
      setSelectedObserver('');
      fetchObservers();
    } else {
      toast.error('Erro ao adicionar observador');
    }
  };

  const handleRemoveObserver = async (observerId: string) => {
    const { error } = await supabase.from('sac_observers').delete().eq('id', observerId);
    if (!error) {
      toast.success('Observador removido!');
      fetchObservers();
    }
  };

  const getStatusBadge = (status: string) => {
    const v: Record<string, { label: string; className: string }> = {
      aberto: { label: 'Aberto', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
      em_andamento: { label: 'Em Andamento', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
      aguardando_cliente: { label: 'Ag. Cliente', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
      aguardando_interno: { label: 'Ag. Interno', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
      resolvido: { label: 'Resolvido', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
      cancelado: { label: 'Cancelado', className: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300' },
    };
    const d = v[status] || v.aberto;
    return <Badge className={d.className}>{d.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const v: Record<string, { label: string; className: string }> = {
      baixa: { label: 'Baixa', className: 'border-gray-300 text-gray-600' },
      media: { label: 'Média', className: 'border-blue-300 text-blue-600' },
      alta: { label: 'Alta', className: 'border-orange-300 text-orange-600' },
      urgente: { label: 'Urgente', className: 'border-red-300 text-red-600' },
    };
    const d = v[priority] || v.media;
    return <Badge variant="outline" className={d.className}>{d.label}</Badge>;
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!sac) return <div className="p-6 text-center"><p className="text-muted-foreground">SAC não encontrado</p><Button variant="link" onClick={() => navigate('/sacs')}>Voltar</Button></div>;

  const availableObservers = allProfiles.filter(p => !observers.find(o => o.user_id === p.id));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/sacs')}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />Voltar
        </Button>
        <div className="flex-1 flex items-center gap-3 flex-wrap">
          <span className="text-xl font-bold text-primary">#{sac.number}</span>
          {getStatusBadge(sac.status)}
          {getPriorityBadge(sac.priority)}
          {sac.deadline && new Date(sac.deadline) < new Date() && sac.status !== 'resolvido' && sac.status !== 'cancelado' && (
            <Badge variant="destructive" className="text-xs">Vencido</Badge>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Title & Description */}
          <Card className="shadow-card border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{sac.title}</CardTitle>
              <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{format(new Date(sac.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                {sac.nf_number && <span className="flex items-center gap-1"><FileText className="h-3 w-3" />NF: {sac.nf_number}</span>}
              </div>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">{sac.description}</p>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="comments" className="w-full">
            <TabsList className="w-full justify-start bg-muted/50">
              <TabsTrigger value="comments" className="gap-1.5 text-xs"><MessageSquare className="h-3.5 w-3.5" />Comentários ({comments.length})</TabsTrigger>
              <TabsTrigger value="history" className="gap-1.5 text-xs"><History className="h-3.5 w-3.5" />Histórico ({history.length})</TabsTrigger>
              <TabsTrigger value="observers" className="gap-1.5 text-xs"><Eye className="h-3.5 w-3.5" />Observadores ({observers.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="comments" className="mt-3">
              <Card className="shadow-card border-0">
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {comments.length === 0 ? (
                      <p className="text-center text-muted-foreground py-6 text-sm">Nenhum comentário</p>
                    ) : comments.map((c) => (
                      <div key={c.id} className={`flex gap-3 p-3 rounded-lg ${c.is_internal ? 'bg-warning/10 border border-warning/20' : 'bg-muted/50'}`}>
                        <Avatar className="h-7 w-7"><AvatarImage src={c.user_avatar || undefined} /><AvatarFallback className="text-[10px]">{c.user_name?.[0] || 'U'}</AvatarFallback></Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-xs">{c.user_name}</span>
                            {c.is_internal && <Badge variant="outline" className="text-[9px] py-0">Interno</Badge>}
                            <span className="text-[10px] text-muted-foreground">{format(new Date(c.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}</span>
                          </div>
                          <p className="text-sm mt-1 whitespace-pre-wrap">{c.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Escreva um comentário..." rows={3} className="text-sm" />
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-xs">
                        <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} className="rounded" />
                        Comentário interno
                      </label>
                      <Button size="sm" onClick={handleAddComment} disabled={sendingComment || !newComment.trim()}>
                        {sendingComment ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        <span className="ml-1.5">Enviar</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-3">
              <Card className="shadow-card border-0">
                <CardContent className="p-4">
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {history.map((h) => (
                      <div key={h.id} className="flex items-start gap-3 p-2.5 border-l-2 border-primary/20 pl-4 hover:bg-muted/30 rounded-r-lg transition-colors">
                        <div className="flex-1">
                          <p className="text-xs font-medium">{h.action}</p>
                          {h.old_value && h.new_value && <p className="text-[10px] text-muted-foreground">{h.old_value} → {h.new_value}</p>}
                          <p className="text-[10px] text-muted-foreground mt-0.5">{h.user_name} • {format(new Date(h.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="observers" className="mt-3">
              <Card className="shadow-card border-0">
                <CardContent className="p-4 space-y-4">
                  {/* Add Observer */}
                  <div className="flex items-center gap-2">
                    <Select value={selectedObserver} onValueChange={setSelectedObserver}>
                      <SelectTrigger className="flex-1 h-9"><SelectValue placeholder="Selecione um usuário" /></SelectTrigger>
                      <SelectContent>
                        {availableObservers.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.full_name || p.email}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={handleAddObserver} disabled={!selectedObserver}>
                      <UserPlus className="h-3.5 w-3.5 mr-1" />Adicionar
                    </Button>
                  </div>

                  {observers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4 text-sm">Nenhum observador</p>
                  ) : (
                    <div className="space-y-2">
                      {observers.map((obs) => (
                        <div key={obs.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-7 w-7"><AvatarFallback className="text-[10px]">{obs.user_name?.[0] || 'U'}</AvatarFallback></Avatar>
                            <div>
                              <p className="text-xs font-medium">{obs.user_name}</p>
                              <p className="text-[10px] text-muted-foreground">{obs.user_email}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveObserver(obs.id)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="shadow-card border-0">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Status</CardTitle></CardHeader>
            <CardContent>
              <Select value={sac.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="aberto">Aberto</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="aguardando_cliente">Ag. Cliente</SelectItem>
                  <SelectItem value="aguardando_interno">Ag. Interno</SelectItem>
                  <SelectItem value="resolvido">Resolvido</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="shadow-card border-0">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Informações</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { icon: Building2, label: 'Cliente', value: clientName || 'Não informado' },
                { icon: User, label: 'Analista', value: analystName || 'Não atribuído' },
                { icon: Calendar, label: 'Prazo', value: sac.deadline ? format(new Date(sac.deadline), 'dd/MM/yyyy', { locale: ptBR }) : 'Não definido' },
                { icon: User, label: 'Criado por', value: creatorName || 'Desconhecido' },
                { icon: Clock, label: 'Criado em', value: format(new Date(sac.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) },
                { icon: Clock, label: 'Atualizado', value: sac.updated_at ? format(new Date(sac.updated_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : '-' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <item.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{item.label}</p>
                    <p className="text-xs font-medium truncate">{item.value}</p>
                  </div>
                </div>
              ))}
              {sac.resolved_at && (
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Resolvido em</p>
                    <p className="text-xs font-medium">{format(new Date(sac.resolved_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

// import needed for resolved_at display
import { CheckCircle2 } from 'lucide-react';
