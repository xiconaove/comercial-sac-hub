import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Calendar, Download, TrendingUp, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { subDays } from 'date-fns';

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

  useEffect(() => {
    fetchReportData();
  }, [period]);

  const fetchReportData = async () => {
    setLoading(true);
    const startDate = subDays(new Date(), parseInt(period)).toISOString();
    
    const { data, error } = await supabase
      .from('sacs')
      .select('id, status, priority, created_at, resolved_at, deadline, analyst_id')
      .gte('created_at', startDate)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSacs(data);
      
      // Fetch analyst names
      const analystIds = [...new Set(data.map(s => s.analyst_id).filter(Boolean))] as string[];
      if (analystIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', analystIds);
        
        setAnalystNames(new Map(profiles?.map(p => [p.id, p.full_name || 'Sem nome']) || []));
      }
    }
    setLoading(false);
  };

  // Calculate stats
  const stats = {
    total: sacs.length,
    abertos: sacs.filter(s => s.status === 'aberto').length,
    emAndamento: sacs.filter(s => s.status === 'em_andamento').length,
    resolvidos: sacs.filter(s => s.status === 'resolvido').length,
    vencidos: sacs.filter(s => s.deadline && new Date(s.deadline) < new Date() && s.status !== 'resolvido').length,
  };

  // Status distribution for pie chart
  const statusData = [
    { name: 'Aberto', value: sacs.filter(s => s.status === 'aberto').length, color: 'hsl(217, 91%, 50%)' },
    { name: 'Em Andamento', value: sacs.filter(s => s.status === 'em_andamento').length, color: 'hsl(38, 92%, 50%)' },
    { name: 'Ag. Cliente', value: sacs.filter(s => s.status === 'aguardando_cliente').length, color: 'hsl(270, 91%, 60%)' },
    { name: 'Ag. Interno', value: sacs.filter(s => s.status === 'aguardando_interno').length, color: 'hsl(24, 95%, 53%)' },
    { name: 'Resolvido', value: sacs.filter(s => s.status === 'resolvido').length, color: 'hsl(142, 76%, 36%)' },
    { name: 'Cancelado', value: sacs.filter(s => s.status === 'cancelado').length, color: 'hsl(215, 15%, 45%)' },
  ].filter(d => d.value > 0);

  // Priority distribution for bar chart
  const priorityData = [
    { name: 'Baixa', value: sacs.filter(s => s.priority === 'baixa').length },
    { name: 'Média', value: sacs.filter(s => s.priority === 'media').length },
    { name: 'Alta', value: sacs.filter(s => s.priority === 'alta').length },
    { name: 'Urgente', value: sacs.filter(s => s.priority === 'urgente').length },
  ];

  // Analyst performance
  const analystPerformance = sacs.reduce((acc, sac) => {
    const name = sac.analyst_id ? (analystNames.get(sac.analyst_id) || 'Não atribuído') : 'Não atribuído';
    if (!acc[name]) acc[name] = { total: 0, resolvidos: 0 };
    acc[name].total++;
    if (sac.status === 'resolvido') acc[name].resolvidos++;
    return acc;
  }, {} as Record<string, { total: number; resolvidos: number }>);

  const analystData = Object.entries(analystPerformance)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">Análise de desempenho e métricas do SAC</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="shadow-card border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total de SACs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-info/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold text-info">{stats.abertos}</p>
                <p className="text-xs text-muted-foreground">Abertos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-warning">{stats.emAndamento}</p>
                <p className="text-xs text-muted-foreground">Em Andamento</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-success">{stats.resolvidos}</p>
                <p className="text-xs text-muted-foreground">Resolvidos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive">{stats.vencidos}</p>
                <p className="text-xs text-muted-foreground">Vencidos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
            <CardDescription>SACs agrupados por status atual</CardDescription>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle>SACs por Prioridade</CardTitle>
            <CardDescription>Distribuição de chamados por nível de prioridade</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(217, 91%, 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0 lg:col-span-2">
          <CardHeader>
            <CardTitle>Desempenho por Analista</CardTitle>
            <CardDescription>Top 5 analistas com mais SACs</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analystData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" name="Total" fill="hsl(217, 91%, 50%)" radius={[0, 4, 4, 0]} />
                <Bar dataKey="resolvidos" name="Resolvidos" fill="hsl(142, 76%, 36%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
