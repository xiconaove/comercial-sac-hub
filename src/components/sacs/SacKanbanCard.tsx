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
import type { Database } from '@/integrations/supabase/types';

type SacStatus = Database['public']['Enums']['sac_status'];

interface SacCard {
  id: string;
  number: number;
  title: string;
  status: SacStatus;
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
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  urgente: 'Urgente',
};

export function SacKanbanCard({ sac, isDragging }: SacKanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: sac.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue = sac.deadline && 
    sac.status !== 'resolvido' && 
    sac.status !== 'cancelado' &&
    isAfter(new Date(), new Date(sac.deadline));

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'touch-none',
        (isDragging || isSortableDragging) && 'opacity-50'
      )}
    >
      <Card className={cn(
        'border-l-4 cursor-pointer hover:shadow-md transition-shadow',
        priorityColors[sac.priority] || 'border-l-gray-400',
        isOverdue && 'bg-destructive/5'
      )}>
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing mt-0.5"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            
            <div className="flex-1 min-w-0">
              <Link to={`/sacs/${sac.id}`} className="block">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-semibold text-primary">#{sac.number}</span>
                  <Badge variant="outline" className="text-[10px] px-1.5">
                    {priorityLabels[sac.priority]}
                  </Badge>
                </div>
                
                <h4 className="font-medium text-sm line-clamp-2 mb-2">{sac.title}</h4>
                
                {sac.client_name && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                    <Building2 className="h-3 w-3" />
                    <span className="truncate">{sac.client_name}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-2">
                  {sac.deadline && (
                    <div className={cn(
                      'flex items-center gap-1 text-xs',
                      isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'
                    )}>
                      <Calendar className="h-3 w-3" />
                      {format(new Date(sac.deadline), 'dd/MM', { locale: ptBR })}
                    </div>
                  )}
                  
                  {sac.analyst_name && (
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                        {getInitials(sac.analyst_name)}
                      </AvatarFallback>
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
