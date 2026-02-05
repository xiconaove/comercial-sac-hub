import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Headphones, Clock, CheckCircle2, AlertTriangle, TrendingUp, Plus, 
  ArrowUpRight, Users, BarChart3, Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { motion } from 'framer-motion';

interface DashboardStats {
  total: number;
  abertos: number;
  emAndamento: number;
  resolvidos: number;
  vencidos: number;
  aguardando: number;
  hojeCriados: number;
}

interface RecentSac {
  id: string;
  number: number;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  client_name: string | null;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({ total: 0, abertos: 0, emAndamento: 0, resolvidos: 0, vencidos: 0, aguardando: 0, hojeCriados: 0 });
  const [recentSacs, setRecentSacs] = useState<RecentSac[]>([]);
  const [statusData, setStatusData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [weeklyData, setWeeklyData] = useState<{ day: string; criados: number; resolvidos: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: sacs } = await supabase
        .from('sacs')
        .select('id, number, title, status, priority, created_at, deadline, client_id, resolved_at')
        .order('created_at', { ascending: false });

      if (sacs) {
        const now = new Date();
        const today = startOfDay(now);
        
        const statsData: DashboardStats = {
          total: sacs.length,
          abertos: sacs.filter(s => s.status === 'aberto').length,
          emAndamento: sacs.filter(s => s.status === 'em_andamento').length,
          resolvidos: sacs.filter(s => s.status === 'resolvido').length,
          vencidos: sacs.filter(s => s.deadline && new Date(s.deadline) < now && s.status !== 'resolvido' && s.status !== 'cancelado').length,
          aguardando: sacs.filter(s => s.status === 'aguardando_cliente' || s.status === 'aguardando_interno').length,
          hojeCriados: sacs.filter(s => s.created_at && new Date(s.created_at) >= today).length,
        };
        setStats(statsData);

        // Status pie data
        setStatusData([
          { name: 'Aberto', value: statsData.abertos, color: 'hsl(217, 91%, 50%)' },
          { name: 'Em Andamento', value: statsData.emAndamento, color: 'hsl(38, 92%, 50%)' },
          { name: 'Aguardando', value: statsData.aguardando, color: 'hsl(270, 91%, 60%)' },
          { name: 'Resolvido', value: statsData.resolvidos, color: 'hsl(142, 76%, 36%)' },
        ].filter(d => d.value > 0));

        // Weekly data
        const last7 = Array.from({ length: 7 }, (_, i) => {
          const d = subDays(now, 6 - i);
          const dayStart = startOfDay(d);
          const dayEnd = endOfDay(d);
          return {
            day: format(d, 'EEE', { locale: ptBR }),
            criados: sacs.filter(s => s.created_at && new Date(s.created_at) >= dayStart && new Date(s.created_at) <= dayEnd).length,
            resolvidos: sacs.filter(s => s.resolved_at && new Date(s.resolved_at) >= dayStart && new Date(s.resolved_at) <= dayEnd).length,
          };
        });
        setWeeklyData(last7);

        // Recent SACs with client names
        const recentRaw = sacs.slice(0, 8);
        const clientIds = [...new Set(recentRaw.map(s => s.client_id).filter(Boolean))];
        const { data: clients } = clientIds.length > 0
          ? await supabase.from('clients').select('id, name').in('id', clientIds)
          : { data: [] };
        const cMap = new Map((clients || []).map(c => [c.id, c.name]));
        setRecentSacs(recentRaw.map(s => ({
          id: s.id, number: s.number, title: s.title, status: s.status,
          priority: s.priority, created_at: s.created_at,
          client_name: s.client_id ? cMap.get(s.client_id) || null : null,
        })));
      }
    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const v: Record<string, { label: string; className: string }> = {
      aberto: { label: 'Aberto', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
      em_andamento: { label: 'Em Andamento', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
      aguardando_cliente: { label: 'Ag. Cliente', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
      resolvido: { label: 'Resolvido', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
      cancelado: { label: 'Cancelado', className: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300' },
    };
    const d = v[status] || v.aberto;
    return <Badge className={d.className}>{d.label}</Badge>;
  };

  const statCards = [
    { label: 'Total SACs', value: stats.total, icon: Headphones, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Abertos', value: stats.abertos, icon: Headphones, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { label: 'Em Andamento', value: stats.emAndamento, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
    { label: 'Resolvidos', value: stats.resolvidos, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
    { label: 'Vencidos', value: stats.vencidos, icon: AlertTriangle, color: 'text-destructive', bg: 'bg-red-100 dark:bg-red-900/30' },
    { label: 'Criados Hoje', value: stats.hojeCriados, icon: Plus, color: 'text-indigo-600', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-6 space-y-6">
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Bem-vindo, {profile?.full_name || 'Usuário'}</p>
        </div>
        <Button asChild className="gradient-primary h-9 text-sm">
          <Link to="/sacs/new"><Plus className="mr-1.5 h-4 w-4" />Novo SAC</Link>
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {statCards.map((s, i) => (
          <motion.div key={s.label} variants={item}>
            <Card className="shadow-card border-0 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-lg ${s.bg} flex items-center justify-center`}>
                    <s.icon className={`h-4 w-4 ${s.color}`} />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{s.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <motion.div variants={item}>
          <Card className="shadow-card border-0 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Distribuição por Status</CardTitle>
            </CardHeader>
            <CardContent>
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {statusData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">Sem dados</div>}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item} className="lg:col-span-2">
          <Card className="shadow-card border-0 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Últimos 7 dias</CardTitle>
              <CardDescription className="text-xs">SACs criados vs resolvidos</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weeklyData}>
                  <XAxis dataKey="day" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="criados" name="Criados" fill="hsl(217, 91%, 50%)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="resolvidos" name="Resolvidos" fill="hsl(142, 76%, 36%)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent SACs */}
      <motion.div variants={item}>
        <Card className="shadow-card border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm">SACs Recentes</CardTitle>
              <CardDescription className="text-xs">Últimos chamados registrados</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-xs">
              <Link to="/sacs">Ver todos <ArrowUpRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentSacs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Headphones className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Nenhum SAC registrado</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentSacs.map((sac) => (
                  <Link key={sac.id} to={`/sacs/${sac.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-primary w-12">#{sac.number}</span>
                      <div>
                        <p className="font-medium text-sm truncate max-w-[250px]">{sac.title}</p>
                        <p className="text-xs text-muted-foreground">{sac.client_name || 'Sem cliente'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground hidden sm:block">
                        {sac.created_at && format(new Date(sac.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                      </span>
                      {getStatusBadge(sac.status)}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
