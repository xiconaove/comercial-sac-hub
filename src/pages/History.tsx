import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Link } from 'react-router-dom';
import { 
  Search, 
  History as HistoryIcon, 
  ArrowRight,
  User,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface HistoryEntry {
  id: string;
  sac_id: string;
  sac_number: number;
  sac_title: string;
  user_id: string | null;
  user_name: string | null;
  action: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string | null;
}

const actionLabels: Record<string, string> = {
  status_change: 'Alteração de Status',
  priority_change: 'Alteração de Prioridade',
  analyst_change: 'Alteração de Analista',
  deadline_change: 'Alteração de Prazo',
  created: 'SAC Criado',
  comment_added: 'Comentário Adicionado',
  image_added: 'Imagem Adicionada',
  observer_added: 'Observador Adicionado',
};

export default function History() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    
    const { data: historyData, error } = await supabase
      .from('sac_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      toast({ title: 'Erro ao carregar histórico', variant: 'destructive' });
      setLoading(false);
      return;
    }

    // Fetch related data
    const sacIds = [...new Set((historyData || []).map(h => h.sac_id))];
    const userIds = [...new Set((historyData || []).map(h => h.user_id).filter(Boolean))];

    const [sacsRes, usersRes] = await Promise.all([
      sacIds.length > 0
        ? supabase.from('sacs').select('id, number, title').in('id', sacIds)
        : { data: [] },
      userIds.length > 0
        ? supabase.from('profiles').select('id, full_name').in('id', userIds as string[])
        : { data: [] },
    ]);

    const sacsMap = new Map((sacsRes.data || []).map(s => [s.id, { number: s.number, title: s.title }]));
    const usersMap = new Map((usersRes.data || []).map(u => [u.id, u.full_name]));

    const formatted: HistoryEntry[] = (historyData || []).map(h => {
      const sac = sacsMap.get(h.sac_id);
      return {
        ...h,
        sac_number: sac?.number || 0,
        sac_title: sac?.title || 'SAC não encontrado',
        user_name: h.user_id ? usersMap.get(h.user_id) || null : null,
      };
    });

    setHistory(formatted);
    setLoading(false);
  };

  const filteredHistory = history.filter(h =>
    h.sac_title.toLowerCase().includes(search.toLowerCase()) ||
    h.sac_number.toString().includes(search) ||
    h.user_name?.toLowerCase().includes(search.toLowerCase()) ||
    h.action.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <HistoryIcon className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Histórico Geral</h1>
          <p className="text-muted-foreground">Todas as alterações do sistema</p>
        </div>
      </div>

      <Card className="shadow-card border-0">
        <CardHeader className="pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por SAC, usuário ou ação..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando...
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum registro encontrado
              </div>
            ) : (
              <div className="space-y-4">
                {filteredHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-primary" />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link 
                          to={`/sacs/${entry.sac_id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          #{entry.sac_number}
                        </Link>
                        <span className="text-sm truncate">{entry.sac_title}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="outline">
                          {actionLabels[entry.action] || entry.action}
                        </Badge>
                        
                        {entry.old_value && entry.new_value && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <span className="line-through">{entry.old_value}</span>
                            <ArrowRight className="h-3 w-3" />
                            <span className="font-medium text-foreground">{entry.new_value}</span>
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        {entry.user_name && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {entry.user_name}
                          </span>
                        )}
                        {entry.created_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(entry.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
