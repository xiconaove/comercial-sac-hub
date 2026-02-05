import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, Building2, GripVertical } from 'lucide-react';
import { format, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface SacCard {
  id: string;
  number: number;
  title: string;
  status: string;
  priority: string;
  deadline: string | null;
  client_name: string | null;
  analyst_name: string | null;
  created_at: string;
}

interface SacKanbanCardProps {
  sac: SacCard;
  isDragging?: boolean;
}

const priorityColors: Record<string, string> = {
  baixa: 'border-l-gray-400',
  media: 'border-l-blue-400',
  alta: 'border-l-orange-400',
  urgente: 'border-l-red-500',
};

const priorityLabels: Record<string, string> = {
  baixa: 'Baixa', media: 'Média', alta: 'Alta', urgente: 'Urgente',
};

export function SacKanbanCard({ sac, isDragging }: SacKanbanCardProps) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging,
  } = useSortable({ id: sac.id });

  const style = { transform: CSS.Transform.toString(transform), transition };

  const isOverdue = sac.deadline && 
    sac.status !== 'resolvido' && sac.status !== 'cancelado' &&
    isAfter(new Date(), new Date(sac.deadline));

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div ref={setNodeRef} style={style} className={cn('touch-none', (isDragging || isSortableDragging) && 'opacity-40')}>
      <Card className={cn(
        'border-l-[3px] cursor-pointer hover:shadow-md transition-all duration-150 bg-card',
        priorityColors[sac.priority] || 'border-l-gray-400',
        isOverdue && 'bg-destructive/5'
      )}>
        <CardContent className="p-2.5">
          <div className="flex items-start gap-1.5">
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mt-0.5 opacity-40 hover:opacity-100 transition-opacity">
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <Link to={`/sacs/${sac.id}`} className="block">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[10px] font-bold text-primary">#{sac.number}</span>
                  <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">{priorityLabels[sac.priority]}</Badge>
                </div>
                <h4 className="font-medium text-xs line-clamp-2 mb-1.5 leading-tight">{sac.title}</h4>
                {sac.client_name && (
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1.5">
                    <Building2 className="h-2.5 w-2.5" />
                    <span className="truncate">{sac.client_name}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  {sac.deadline && (
                    <div className={cn('flex items-center gap-0.5 text-[10px]', isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground')}>
                      <Calendar className="h-2.5 w-2.5" />
                      {format(new Date(sac.deadline), 'dd/MM', { locale: ptBR })}
                    </div>
                  )}
                  {sac.analyst_name && (
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-[8px] bg-primary/10 text-primary">{getInitials(sac.analyst_name)}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
