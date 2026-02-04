import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  CheckSquare, 
  Clock, 
  AlertTriangle,
  Eye,
  Calendar,
  Building2
} from 'lucide-react';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type SacStatus = Database['public']['Enums']['sac_status'];

interface Task {
  id: string;
  number: number;
  title: string;
  status: SacStatus;
  priority: string;
  deadline: string | null;
  client_name: string | null;
  type: 'assigned' | 'observing' | 'overdue' | 'upcoming';
}

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) fetchTasks();
  }, [user]);

  const fetchTasks = async () => {
    setLoading(true);
    
    // Fetch assigned SACs
    const { data: assignedSacs, error: assignedError } = await supabase
      .from('sacs')
      .select('id, number, title, status, priority, deadline, client_id')
      .eq('analyst_id', user!.id)
      .not('status', 'in', '("resolvido","cancelado")')
      .order('deadline', { ascending: true, nullsFirst: false });

    // Fetch observing SACs
    const { data: observerData } = await supabase
      .from('sac_observers')
      .select('sac_id')
      .eq('user_id', user!.id);

    const observingSacIds = (observerData || []).map(o => o.sac_id);
    
    let observingSacs: any[] = [];
    if (observingSacIds.length > 0) {
      const { data } = await supabase
        .from('sacs')
        .select('id, number, title, status, priority, deadline, client_id')
        .in('id', observingSacIds)
        .not('status', 'in', '("resolvido","cancelado")');
      observingSacs = data || [];
    }

    // Get client names
    const allSacs = [...(assignedSacs || []), ...observingSacs];
    const clientIds = [...new Set(allSacs.map(s => s.client_id).filter(Boolean))];
    
    let clientsMap = new Map<string, string>();
    if (clientIds.length > 0) {
      const { data: clients } = await supabase
        .from('clients')
        .select('id, name')
        .in('id', clientIds);
      clientsMap = new Map((clients || []).map(c => [c.id, c.name]));
    }

    const now = new Date();
    const weekFromNow = addDays(now, 7);

    const formattedTasks: Task[] = [];

    // Process assigned SACs
    (assignedSacs || []).forEach(sac => {
      const isOverdue = sac.deadline && isAfter(now, new Date(sac.deadline));
      const isUpcoming = sac.deadline && isBefore(new Date(sac.deadline), weekFromNow) && !isOverdue;
      
      formattedTasks.push({
        id: sac.id,
        number: sac.number,
        title: sac.title,
        status: sac.status as SacStatus,
        priority: sac.priority || 'media',
        deadline: sac.deadline,
        client_name: sac.client_id ? clientsMap.get(sac.client_id) || null : null,
        type: isOverdue ? 'overdue' : isUpcoming ? 'upcoming' : 'assigned',
      });
    });

    // Process observing SACs
    observingSacs.forEach(sac => {
      if (!formattedTasks.some(t => t.id === sac.id)) {
        formattedTasks.push({
          id: sac.id,
          number: sac.number,
          title: sac.title,
          status: sac.status as SacStatus,
          priority: sac.priority || 'media',
          deadline: sac.deadline,
          client_name: sac.client_id ? clientsMap.get(sac.client_id) || null : null,
          type: 'observing',
        });
      }
    });

    setTasks(formattedTasks);
    setLoading(false);
  };

  const getStatusBadge = (status: SacStatus) => {
    const variants: Record<SacStatus, { label: string; className: string }> = {
      aberto: { label: 'Aberto', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
      em_andamento: { label: 'Em Andamento', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
      aguardando_cliente: { label: 'Ag. Cliente', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
      aguardando_interno: { label: 'Ag. Interno', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
      resolvido: { label: 'Resolvido', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
      cancelado: { label: 'Cancelado', className: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' },
    };
    const v = variants[status];
    return <Badge className={v.className}>{v.label}</Badge>;
  };

  const overdueTasks = tasks.filter(t => t.type === 'overdue');
  const upcomingTasks = tasks.filter(t => t.type === 'upcoming');
  const assignedTasks = tasks.filter(t => t.type === 'assigned');
  const observingTasks = tasks.filter(t => t.type === 'observing');

  const TaskCard = ({ task }: { task: Task }) => (
    <div className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Link 
            to={`/sacs/${task.id}`}
            className="font-medium text-primary hover:underline"
          >
            #{task.number}
          </Link>
          {getStatusBadge(task.status)}
        </div>
        <p className="text-sm truncate mb-1">{task.title}</p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {task.client_name && (
            <span className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {task.client_name}
            </span>
          )}
          {task.deadline && (
            <span className={`flex items-center gap-1 ${task.type === 'overdue' ? 'text-destructive font-medium' : ''}`}>
              <Calendar className="h-3 w-3" />
              {format(new Date(task.deadline), 'dd/MM/yyyy', { locale: ptBR })}
            </span>
          )}
        </div>
      </div>
      <Button asChild variant="ghost" size="icon">
        <Link to={`/sacs/${task.id}`}>
          <Eye className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <CheckSquare className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Minhas Tarefas</h1>
          <p className="text-muted-foreground">SACs atribuídos a você e que você está observando</p>
        </div>
      </div>

      {loading ? (
        <Card className="shadow-card border-0">
          <CardContent className="py-8 text-center">
            Carregando...
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {overdueTasks.length > 0 && (
            <Card className="shadow-card border-0 border-l-4 border-l-destructive">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Atrasados ({overdueTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {overdueTasks.map(task => <TaskCard key={task.id} task={task} />)}
              </CardContent>
            </Card>
          )}

          {upcomingTasks.length > 0 && (
            <Card className="shadow-card border-0 border-l-4 border-l-warning">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-warning" />
                  Próximos 7 dias ({upcomingTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {upcomingTasks.map(task => <TaskCard key={task.id} task={task} />)}
              </CardContent>
            </Card>
          )}

          <Card className="shadow-card border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-primary" />
                Atribuídos a mim ({assignedTasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {assignedTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum SAC atribuído a você
                </p>
              ) : (
                assignedTasks.map(task => <TaskCard key={task.id} task={task} />)
              )}
            </CardContent>
          </Card>

          {observingTasks.length > 0 && (
            <Card className="shadow-card border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="h-5 w-5 text-muted-foreground" />
                  Observando ({observingTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {observingTasks.map(task => <TaskCard key={task.id} task={task} />)}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
