import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings2, Calendar, Building2, User, Hash, FileText, Tag, Clock, Eye, Save
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

interface CardField {
  id: string;
  label: string;
  icon: React.ReactNode;
  enabled: boolean;
}

const defaultFields: CardField[] = [
  { id: 'number', label: 'Número do SAC', icon: <Hash className="h-4 w-4" />, enabled: true },
  { id: 'title', label: 'Título', icon: <FileText className="h-4 w-4" />, enabled: true },
  { id: 'client', label: 'Cliente', icon: <Building2 className="h-4 w-4" />, enabled: true },
  { id: 'analyst', label: 'Analista', icon: <User className="h-4 w-4" />, enabled: true },
  { id: 'priority', label: 'Prioridade', icon: <Tag className="h-4 w-4" />, enabled: true },
  { id: 'deadline', label: 'Prazo', icon: <Calendar className="h-4 w-4" />, enabled: true },
  { id: 'created_at', label: 'Data de Criação', icon: <Clock className="h-4 w-4" />, enabled: false },
  { id: 'nf_number', label: 'Número da NF', icon: <FileText className="h-4 w-4" />, enabled: false },
];

export default function CardSettings() {
  const { toast } = useToast();
  
  const [cardFields, setCardFields] = useState<CardField[]>(() => {
    const saved = localStorage.getItem('sacCardSettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return defaultFields.map(df => {
          const savedField = parsed.find((sf: any) => sf.id === df.id);
          return savedField ? { ...df, enabled: savedField.enabled } : df;
        });
      } catch { return defaultFields; }
    }
    return defaultFields;
  });

  const handleToggle = (fieldId: string) => {
    setCardFields(prev => {
      const updated = prev.map(f => f.id === fieldId ? { ...f, enabled: !f.enabled } : f);
      localStorage.setItem('sacCardSettings', JSON.stringify(updated.map(f => ({ id: f.id, enabled: f.enabled }))));
      return updated;
    });
  };

  const handleSave = () => {
    localStorage.setItem('sacCardSettings', JSON.stringify(cardFields.map(f => ({ id: f.id, enabled: f.enabled }))));
    toast({ title: 'Configurações salvas com sucesso!' });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6">
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
            <CardDescription>Alterne para mostrar/ocultar campos — salva automaticamente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {cardFields.map((field) => (
              <div key={field.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="text-muted-foreground">{field.icon}</div>
                  <span className="font-medium text-sm">{field.label}</span>
                </div>
                <Switch checked={field.enabled} onCheckedChange={() => handleToggle(field.id)} />
              </div>
            ))}
            <Separator className="my-4" />
            <Button onClick={handleSave} className="w-full gradient-primary">
              <Save className="mr-2 h-4 w-4" />
              Salvar
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Pré-visualização
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 space-y-3 bg-card shadow-sm">
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
                  <Building2 className="h-3 w-3" /><span>Cliente Exemplo</span>
                </div>
              )}
              {cardFields.find(f => f.id === 'nf_number')?.enabled && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <FileText className="h-3 w-3" /><span>NF: 12345</span>
                </div>
              )}
              <div className="flex items-center justify-between mt-2">
                {cardFields.find(f => f.id === 'deadline')?.enabled && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" /><span>15/02/2026</span>
                  </div>
                )}
                {cardFields.find(f => f.id === 'analyst')?.enabled && (
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-medium text-primary">JD</div>
                )}
              </div>
              {cardFields.find(f => f.id === 'created_at')?.enabled && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" /><span>Criado: 01/02/2026</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
