import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings2, 
  Calendar, 
  Building2, 
  User, 
  Hash,
  FileText,
  Tag,
  Clock,
  Eye,
  Save
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CardField {
  id: string;
  label: string;
  icon: React.ReactNode;
  enabled: boolean;
}

export default function CardSettings() {
  const { toast } = useToast();
  
  const [cardFields, setCardFields] = useState<CardField[]>([
    { id: 'number', label: 'Número do SAC', icon: <Hash className="h-4 w-4" />, enabled: true },
    { id: 'title', label: 'Título', icon: <FileText className="h-4 w-4" />, enabled: true },
    { id: 'client', label: 'Cliente', icon: <Building2 className="h-4 w-4" />, enabled: true },
    { id: 'analyst', label: 'Analista', icon: <User className="h-4 w-4" />, enabled: true },
    { id: 'priority', label: 'Prioridade', icon: <Tag className="h-4 w-4" />, enabled: true },
    { id: 'deadline', label: 'Prazo', icon: <Calendar className="h-4 w-4" />, enabled: true },
    { id: 'created_at', label: 'Data de Criação', icon: <Clock className="h-4 w-4" />, enabled: false },
    { id: 'nf_number', label: 'Número da NF', icon: <FileText className="h-4 w-4" />, enabled: false },
  ]);

  const handleToggle = (fieldId: string) => {
    setCardFields(prev => prev.map(f => 
      f.id === fieldId ? { ...f, enabled: !f.enabled } : f
    ));
  };

  const handleSave = () => {
    // Save to localStorage for now (could be saved to database)
    localStorage.setItem('sacCardSettings', JSON.stringify(cardFields));
    toast({ title: 'Configurações salvas com sucesso' });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Settings2 className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Configuração do Card</h1>
          <p className="text-muted-foreground">Personalize os campos exibidos nos cards do Kanban</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-lg">Campos Visíveis</CardTitle>
            <CardDescription>
              Selecione quais campos serão exibidos nos cards do Kanban
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {cardFields.map((field) => (
              <div key={field.id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="text-muted-foreground">{field.icon}</div>
                  <span className="font-medium">{field.label}</span>
                </div>
                <Switch
                  checked={field.enabled}
                  onCheckedChange={() => handleToggle(field.id)}
                />
              </div>
            ))}
            
            <Separator className="my-4" />
            
            <Button onClick={handleSave} className="w-full gradient-primary">
              <Save className="mr-2 h-4 w-4" />
              Salvar Configurações
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Pré-visualização
            </CardTitle>
            <CardDescription>
              Veja como o card ficará no Kanban
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 space-y-3 bg-card">
              {cardFields.find(f => f.id === 'number')?.enabled && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-primary">#1234</span>
                  {cardFields.find(f => f.id === 'priority')?.enabled && (
                    <Badge variant="outline" className="text-[10px]">Alta</Badge>
                  )}
                </div>
              )}
              
              {cardFields.find(f => f.id === 'title')?.enabled && (
                <h4 className="font-medium text-sm">Exemplo de título do SAC</h4>
              )}
              
              {cardFields.find(f => f.id === 'client')?.enabled && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Building2 className="h-3 w-3" />
                  <span>Cliente Exemplo</span>
                </div>
              )}

              {cardFields.find(f => f.id === 'nf_number')?.enabled && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <FileText className="h-3 w-3" />
                  <span>NF: 12345</span>
                </div>
              )}

              <div className="flex items-center justify-between mt-2">
                {cardFields.find(f => f.id === 'deadline')?.enabled && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>15/02/2026</span>
                  </div>
                )}
                
                {cardFields.find(f => f.id === 'analyst')?.enabled && (
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-medium text-primary">
                    JD
                  </div>
                )}
              </div>

              {cardFields.find(f => f.id === 'created_at')?.enabled && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Criado: 01/02/2026</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
