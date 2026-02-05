import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area,
} from 'recharts';
import { Calendar, Download, TrendingUp, Clock, CheckCircle2, AlertTriangle, BarChart3, PieChartIcon, Activity } from 'lucide-react';
import { subDays, format, differenceInHours, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface SacReport {
  id: string;
  status: string;
  priority: string;
  created_at: string;
  resolved_at: string | null;
  deadline: string | null;
  analyst_id: string | null;
}

export default function Reports() {
  const [period, setPeriod] = useState('30');
  const [sacs, setSacs] = useState<SacReport[]>([]);
  const [analystNames, setAnalystNames] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchReportData(); }, [period]);

  const fetchReportData = async () => {
    setLoading(true);
    const startDate = subDays(new Date(), parseInt(period)).toISOString();
    const { data } = await supabase
      .from('sacs')
      .select('id, status, priority, created_at, resolved_at, deadline, analyst_id')
      .gte('created_at', startDate)
      .order('created_at', { ascending: false });

    if (data) {
      setSacs(data);
      const analystIds = [...new Set(data.map(s => s.analyst_id).filter(Boolean))] as string[];
      if (analystIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', analystIds);
        setAnalystNames(new Map(profiles?.map(p => [p.id, p.full_name || 'Sem nome']) || []));
      }
    }
    setLoading(false);
  };

  const stats = {
    total: sacs.length,
    abertos: sacs.filter(s => s.status === 'aberto').length,
    resolvidos: sacs.filter(s => s.status === 'resolvido').length,
    vencidos: sacs.filter(s => s.deadline && new Date(s.deadline) < new Date() && s.status !== 'resolvido').length,
    tempoMedioResolucao: (() => {
      const resolved = sacs.filter(s => s.resolved_at && s.created_at);
      if (resolved.length === 0) return 0;
      const total = resolved.reduce((acc, s) => acc + differenceInHours(new Date(s.resolved_at!), new Date(s.created_at)), 0);
      return Math.round(total / resolved.length);
    })(),
    taxaResolucao: sacs.length > 0 ? Math.round((sacs.filter(s => s.status === 'resolvido').length / sacs.length) * 100) : 0,
  };

  const statusData = [
    { name: 'Aberto', value: sacs.filter(s => s.status === 'aberto').length, color: 'hsl(217, 91%, 50%)' },
    { name: 'Em Andamento', value: sacs.filter(s => s.status === 'em_andamento').length, color: 'hsl(38, 92%, 50%)' },
    { name: 'Ag. Cliente', value: sacs.filter(s => s.status === 'aguardando_cliente').length, color: 'hsl(270, 91%, 60%)' },
    { name: 'Ag. Interno', value: sacs.filter(s => s.status === 'aguardando_interno').length, color: 'hsl(24, 95%, 53%)' },
    { name: 'Resolvido', value: sacs.filter(s => s.status === 'resolvido').length, color: 'hsl(142, 76%, 36%)' },
    { name: 'Cancelado', value: sacs.filter(s => s.status === 'cancelado').length, color: 'hsl(215, 15%, 45%)' },
  ].filter(d => d.value > 0);

  const priorityData = [
    { name: 'Baixa', value: sacs.filter(s => s.priority === 'baixa').length, color: 'hsl(215, 15%, 60%)' },
    { name: 'Média', value: sacs.filter(s => s.priority === 'media').length, color: 'hsl(217, 91%, 50%)' },
    { name: 'Alta', value: sacs.filter(s => s.priority === 'alta').length, color: 'hsl(24, 95%, 53%)' },
    { name: 'Urgente', value: sacs.filter(s => s.priority === 'urgente').length, color: 'hsl(0, 84%, 60%)' },
  ];

  const analystPerformance = sacs.reduce((acc, sac) => {
    const name = sac.analyst_id ? (analystNames.get(sac.analyst_id) || 'Não atribuído') : 'Não atribuído';
    if (!acc[name]) acc[name] = { total: 0, resolvidos: 0 };
    acc[name].total++;
    if (sac.status === 'resolvido') acc[name].resolvidos++;
    return acc;
  }, {} as Record<string, { total: number; resolvidos: number }>);

  const analystData = Object.entries(analystPerformance).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.total - a.total).slice(0, 8);

  // Daily trend
  const days = parseInt(period);
  const trendData = Array.from({ length: Math.min(days, 30) }, (_, i) => {
    const d = subDays(new Date(), Math.min(days, 30) - 1 - i);
    const dayStart = startOfDay(d);
    const dayEnd = endOfDay(d);
    return {
      date: format(d, 'dd/MM', { locale: ptBR }),
      criados: sacs.filter(s => s.created_at && new Date(s.created_at) >= dayStart && new Date(s.created_at) <= dayEnd).length,
      resolvidos: sacs.filter(s => s.resolved_at && new Date(s.resolved_at) >= dayStart && new Date(s.resolved_at) <= dayEnd).length,
    };
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground text-sm">Análise de desempenho e métricas</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[160px] h-9">
              <Calendar className="mr-2 h-3.5 w-3.5" /><SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm"><Download className="mr-1.5 h-3.5 w-3.5" />Exportar</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'Total', value: stats.total, icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Abertos', value: stats.abertos, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
          { label: 'Resolvidos', value: stats.resolvidos, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
          { label: 'Vencidos', value: stats.vencidos, icon: AlertTriangle, color: 'text-destructive', bg: 'bg-red-100 dark:bg-red-900/30' },
          { label: 'Tempo Médio', value: `${stats.tempoMedioResolucao}h`, icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
          { label: 'Taxa Resolução', value: `${stats.taxaResolucao}%`, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
        ].map(s => (
          <Card key={s.label} className="shadow-card border-0">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-lg font-bold">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Report Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" />Visão Geral</TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5"><Activity className="h-3.5 w-3.5" />Análise Temporal</TabsTrigger>
          <TabsTrigger value="team" className="gap-1.5"><PieChartIcon className="h-3.5 w-3.5" />Equipe</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="shadow-card border-0">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Distribuição por Status</CardTitle></CardHeader>
              <CardContent>
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip /><Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="h-[280px] flex items-center justify-center text-muted-foreground">Sem dados</div>}
              </CardContent>
            </Card>
            <Card className="shadow-card border-0">
              <CardHeader className="pb-2"><CardTitle className="text-sm">SACs por Prioridade</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={priorityData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="value" name="SACs" radius={[4, 4, 0, 0]}>
                      {priorityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card className="shadow-card border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Tendência Diária</CardTitle>
              <CardDescription className="text-xs">Criados vs Resolvidos por dia</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="criados" name="Criados" stroke="hsl(217, 91%, 50%)" fill="hsl(217, 91%, 50%)" fillOpacity={0.15} />
                  <Area type="monotone" dataKey="resolvidos" name="Resolvidos" stroke="hsl(142, 76%, 36%)" fill="hsl(142, 76%, 36%)" fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <Card className="shadow-card border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Desempenho por Analista</CardTitle>
              <CardDescription className="text-xs">Total de SACs vs Resolvidos por analista</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={analystData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis type="number" fontSize={11} />
                  <YAxis dataKey="name" type="category" width={130} fontSize={11} />
                  <Tooltip /><Legend />
                  <Bar dataKey="total" name="Total" fill="hsl(217, 91%, 50%)" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="resolvidos" name="Resolvidos" fill="hsl(142, 76%, 36%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
