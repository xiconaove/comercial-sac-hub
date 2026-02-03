import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Calendar,
  Building2,
  User,
  Clock,
  Send,
  History,
  Eye,
  MessageSquare,
  Loader2,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

type SacStatus = 'aberto' | 'em_andamento' | 'aguardando_cliente' | 'aguardando_interno' | 'resolvido' | 'cancelado';

interface SacDetail {
  id: string;
  number: number;
  title: string;
  description: string;
  status: SacStatus;
  priority: string;
  nf_number: string | null;
  deadline: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  client_id: string | null;
  analyst_id: string | null;
  created_by: string;
}

interface Comment {
  id: string;
  content: string;
  is_internal: boolean;
  created_at: string;
  user_id: string;
  user_name: string | null;
  user_avatar: string | null;
}

interface HistoryItem {
  id: string;
  action: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  user_name: string | null;
}

interface Observer {
  id: string;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
}

export default function SacDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [sac, setSac] = useState<SacDetail | null>(null);
  const [clientName, setClientName] = useState<string | null>(null);
  const [analystName, setAnalystName] = useState<string | null>(null);
  const [creatorName, setCreatorName] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [observers, setObservers] = useState<Observer[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);

  useEffect(() => {
    if (id) {
      fetchSacDetails();
      fetchComments();
      fetchHistory();
      fetchObservers();
    }
  }, [id]);

  const fetchSacDetails = async () => {
    const { data, error } = await supabase
      .from('sacs')
      .select('*')
      .eq('id', id)
      .single();

    if (!error && data) {
      setSac(data as SacDetail);
      
      // Fetch related names
      const [clientRes, analystRes, creatorRes] = await Promise.all([
        data.client_id ? supabase.from('clients').select('name').eq('id', data.client_id).single() : null,
        data.analyst_id ? supabase.from('profiles').select('full_name').eq('id', data.analyst_id).single() : null,
        supabase.from('profiles').select('full_name').eq('id', data.created_by).single()
      ]);
      
      setClientName(clientRes?.data?.name || null);
      setAnalystName(analystRes?.data?.full_name || null);
      setCreatorName(creatorRes?.data?.full_name || null);
    }
    setLoading(false);
  };

  const fetchComments = async () => {
    const { data } = await supabase
      .from('sac_comments')
      .select('id, content, is_internal, created_at, user_id')
      .eq('sac_id', id)
      .order('created_at', { ascending: true });
    
    if (data) {
      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      setComments(data.map(c => ({
        ...c,
        user_name: profileMap.get(c.user_id)?.full_name || null,
        user_avatar: profileMap.get(c.user_id)?.avatar_url || null,
      })));
    }
  };

  const fetchHistory = async () => {
    const { data } = await supabase
      .from('sac_history')
      .select('id, action, old_value, new_value, created_at, user_id')
      .eq('sac_id', id)
      .order('created_at', { ascending: false });
    
    if (data) {
      const userIds = [...new Set(data.map(h => h.user_id).filter(Boolean))] as string[];
      const { data: profiles } = userIds.length > 0 
        ? await supabase.from('profiles').select('id, full_name').in('id', userIds)
        : { data: [] };
      
      const profileMap = new Map<string, string>();
      profiles?.forEach(p => profileMap.set(p.id, p.full_name || ''));
      
      setHistory(data.map(h => ({
        ...h,
        user_name: h.user_id ? profileMap.get(h.user_id) || null : null,
      })));
    }
  };

  const fetchObservers = async () => {
    const { data } = await supabase
      .from('sac_observers')
      .select('id, user_id')
      .eq('sac_id', id);
    
    if (data) {
      const userIds = data.map(o => o.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      setObservers(data.map(o => ({
        ...o,
        user_name: profileMap.get(o.user_id)?.full_name || null,
        user_email: profileMap.get(o.user_id)?.email || null,
      })));
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!sac || !user) return;
    
    const { error } = await supabase
      .from('sacs')
      .update({ 
        status: newStatus as SacStatus,
        resolved_at: newStatus === 'resolvido' ? new Date().toISOString() : null
      })
      .eq('id', sac.id);

    if (!error) {
      await supabase.from('sac_history').insert({
        sac_id: sac.id,
        user_id: user.id,
        action: 'Status alterado',
        old_value: sac.status,
        new_value: newStatus,
      });
      
      toast.success('Status atualizado!');
      fetchSacDetails();
      fetchHistory();
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user || !sac) return;
    
    setSendingComment(true);
    const { error } = await supabase.from('sac_comments').insert({
      sac_id: sac.id,
      user_id: user.id,
      content: newComment,
      is_internal: isInternal,
    });

    if (!error) {
      await supabase.from('sac_history').insert({
        sac_id: sac.id,
        user_id: user.id,
        action: isInternal ? 'Comentário interno adicionado' : 'Comentário adicionado',
      });
      
      setNewComment('');
      fetchComments();
      fetchHistory();
      toast.success('Comentário adicionado!');
    }
    setSendingComment(false);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      aberto: { label: 'Aberto', className: 'bg-blue-100 text-blue-700' },
      em_andamento: { label: 'Em Andamento', className: 'bg-yellow-100 text-yellow-700' },
      aguardando_cliente: { label: 'Aguardando Cliente', className: 'bg-purple-100 text-purple-700' },
      aguardando_interno: { label: 'Aguardando Interno', className: 'bg-orange-100 text-orange-700' },
      resolvido: { label: 'Resolvido', className: 'bg-green-100 text-green-700' },
      cancelado: { label: 'Cancelado', className: 'bg-gray-100 text-gray-700' },
    };
    const v = variants[status] || variants.aberto;
    return <Badge className={`${v.className} text-sm`}>{v.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      baixa: { label: 'Baixa', className: 'border-gray-300 text-gray-600' },
      media: { label: 'Média', className: 'border-blue-300 text-blue-600' },
      alta: { label: 'Alta', className: 'border-orange-300 text-orange-600' },
      urgente: { label: 'Urgente', className: 'border-red-300 text-red-600' },
    };
    const v = variants[priority] || variants.media;
    return <Badge variant="outline" className={`${v.className} text-sm`}>{v.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!sac) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">SAC não encontrado</p>
        <Button variant="link" onClick={() => navigate('/sacs')}>Voltar para lista</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/sacs')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-primary">#{sac.number}</span>
            {getStatusBadge(sac.status)}
            {getPriorityBadge(sac.priority)}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-card border-0">
            <CardHeader>
              <CardTitle>{sac.title}</CardTitle>
              <CardDescription className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {format(new Date(sac.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
                {sac.nf_number && (
                  <span className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    NF: {sac.nf_number}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-foreground">{sac.description}</p>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="comments" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="comments" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Comentários ({comments.length})
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="h-4 w-4" />
                Histórico ({history.length})
              </TabsTrigger>
              <TabsTrigger value="observers" className="gap-2">
                <Eye className="h-4 w-4" />
                Observadores ({observers.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="comments" className="mt-4">
              <Card className="shadow-card border-0">
                <CardContent className="p-4 space-y-4">
                  {/* Comment List */}
                  <div className="space-y-4 max-h-[400px] overflow-y-auto">
                    {comments.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">Nenhum comentário ainda</p>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className={`flex gap-3 p-3 rounded-lg ${comment.is_internal ? 'bg-warning/10 border border-warning/20' : 'bg-muted/50'}`}>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={comment.user_avatar || undefined} />
                            <AvatarFallback className="text-xs">{comment.user_name?.[0] || 'U'}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{comment.user_name}</span>
                              {comment.is_internal && <Badge variant="outline" className="text-xs">Interno</Badge>}
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(comment.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </span>
                            </div>
                            <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <Separator />

                  {/* Add Comment */}
                  <div className="space-y-3">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Escreva um comentário..."
                      rows={3}
                    />
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={isInternal}
                          onChange={(e) => setIsInternal(e.target.checked)}
                          className="rounded"
                        />
                        <span>Comentário interno (não visível para o cliente)</span>
                      </label>
                      <Button onClick={handleAddComment} disabled={sendingComment || !newComment.trim()}>
                        {sendingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        <span className="ml-2">Enviar</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <Card className="shadow-card border-0">
                <CardContent className="p-4">
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {history.map((item) => (
                      <div key={item.id} className="flex items-start gap-3 p-2 border-l-2 border-primary/30 pl-4">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.action}</p>
                          {item.old_value && item.new_value && (
                            <p className="text-xs text-muted-foreground">
                              {item.old_value} → {item.new_value}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.user_name} • {format(new Date(item.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="observers" className="mt-4">
              <Card className="shadow-card border-0">
                <CardContent className="p-4">
                  {observers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Nenhum observador</p>
                  ) : (
                    <div className="space-y-2">
                      {observers.map((obs) => (
                        <div key={obs.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{obs.user_name?.[0] || 'U'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{obs.user_name}</p>
                            <p className="text-xs text-muted-foreground">{obs.user_email}</p>
                          </div>
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
        <div className="space-y-6">
          {/* Status */}
          <Card className="shadow-card border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={sac.status} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aberto">Aberto</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="aguardando_cliente">Aguardando Cliente</SelectItem>
                  <SelectItem value="aguardando_interno">Aguardando Interno</SelectItem>
                  <SelectItem value="resolvido">Resolvido</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Details */}
          <Card className="shadow-card border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Detalhes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Cliente</p>
                  <p className="text-sm font-medium">{clientName || 'Não informado'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Analista</p>
                  <p className="text-sm font-medium">{analystName || 'Não atribuído'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Prazo</p>
                  <p className="text-sm font-medium">
                    {sac.deadline ? format(new Date(sac.deadline), 'dd/MM/yyyy', { locale: ptBR }) : 'Não definido'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Criado por</p>
                  <p className="text-sm font-medium">{creatorName || 'Desconhecido'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
