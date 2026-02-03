import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Headphones, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Users,
  Plus,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardStats {
  total: number;
  abertos: number;
  emAndamento: number;
  resolvidos: number;
  vencidos: number;
}

interface RecentSac {
  id: string;
  number: number;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  client?: { name: string };
}

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({ total: 0, abertos: 0, emAndamento: 0, resolvidos: 0, vencidos: 0 });
  const [recentSacs, setRecentSacs] = useState<RecentSac[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: sacs } = await supabase
        .from('sacs')
        .select('id, number, title, status, priority, created_at, deadline, client:clients(name)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (sacs) {
        const now = new Date();
        const statsData: DashboardStats = {
          total: sacs.length,
          abertos: sacs.filter(s => s.status === 'aberto').length,
          emAndamento: sacs.filter(s => s.status === 'em_andamento').length,
          resolvidos: sacs.filter(s => s.status === 'resolvido').length,
          vencidos: sacs.filter(s => s.deadline && new Date(s.deadline) < now && s.status !== 'resolvido').length,
        };
        setStats(statsData);
        setRecentSacs(sacs.slice(0, 5) as RecentSac[]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      aberto: { label: 'Aberto', className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
      em_andamento: { label: 'Em Andamento', className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100' },
      aguardando_cliente: { label: 'Aguardando Cliente', className: 'bg-purple-100 text-purple-700 hover:bg-purple-100' },
      aguardando_interno: { label: 'Aguardando Interno', className: 'bg-orange-100 text-orange-700 hover:bg-orange-100' },
      resolvido: { label: 'Resolvido', className: 'bg-green-100 text-green-700 hover:bg-green-100' },
      cancelado: { label: 'Cancelado', className: 'bg-gray-100 text-gray-700 hover:bg-gray-100' },
    };
    const v = variants[status] || variants.aberto;
    return <Badge className={v.className}>{v.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      baixa: { label: 'Baixa', className: 'bg-gray-100 text-gray-600' },
      media: { label: 'Média', className: 'bg-blue-100 text-blue-600' },
      alta: { label: 'Alta', className: 'bg-orange-100 text-orange-600' },
      urgente: { label: 'Urgente', className: 'bg-red-100 text-red-600' },
    };
    const v = variants[priority] || variants.media;
    return <Badge variant="outline" className={v.className}>{v.label}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Bem-vindo, {profile?.full_name || 'Usuário'}</p>
        </div>
        <Button asChild className="gradient-primary">
          <Link to="/sacs/new">
            <Plus className="mr-2 h-4 w-4" />
            Novo SAC
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="shadow-card border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total SACs</CardTitle>
            <Headphones className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-success" />
              <span className="text-success">+12%</span> vs. mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Abertos</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Headphones className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.abertos}</div>
            <p className="text-xs text-muted-foreground mt-1">Aguardando atendimento</p>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Em Andamento</CardTitle>
            <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
              <Clock className="h-4 w-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.emAndamento}</div>
            <p className="text-xs text-muted-foreground mt-1">Sendo tratados</p>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Resolvidos</CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.resolvidos}</div>
            <p className="text-xs text-muted-foreground mt-1">Este mês</p>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vencidos</CardTitle>
            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.vencidos}</div>
            <p className="text-xs text-muted-foreground mt-1">Prazo excedido</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent SACs */}
      <Card className="shadow-card border-0">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>SACs Recentes</CardTitle>
            <CardDescription>Últimos chamados registrados</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/sacs">Ver todos</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentSacs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Headphones className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Nenhum SAC registrado ainda</p>
              <Button asChild variant="link" className="mt-2">
                <Link to="/sacs/new">Criar primeiro SAC</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentSacs.map((sac) => (
                <Link
                  key={sac.id}
                  to={`/sacs/${sac.id}`}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">#{sac.number}</span>
                    </div>
                    <div>
                      <p className="font-medium">{sac.title}</p>
                      <p className="text-sm text-muted-foreground">{sac.client?.name || 'Sem cliente'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(sac.priority)}
                    {getStatusBadge(sac.status)}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
