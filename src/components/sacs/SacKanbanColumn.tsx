import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SacKanbanCard } from './SacKanbanCard';
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

interface Column {
  id: SacStatus;
  title: string;
  color: string;
}

interface SacKanbanColumnProps {
  column: Column;
  sacs: SacCard[];
}

export function SacKanbanColumn({ column, sacs }: SacKanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex-shrink-0 w-80 flex flex-col bg-muted/50 rounded-lg',
        isOver && 'ring-2 ring-primary ring-offset-2'
      )}
    >
      <div className="flex items-center gap-2 p-3 border-b">
        <div className={cn('w-3 h-3 rounded-full', column.color)} />
        <h3 className="font-semibold text-sm">{column.title}</h3>
        <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {sacs.length}
        </span>
      </div>
      
      <ScrollArea className="flex-1 p-2">
        <SortableContext
          items={sacs.map(s => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {sacs.map(sac => (
              <SacKanbanCard key={sac.id} sac={sac} />
            ))}
          </div>
        </SortableContext>
        
        {sacs.length === 0 && (
          <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
            Nenhum SAC
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
