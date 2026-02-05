import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SacKanbanCard } from './SacKanbanCard';
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

interface Column {
  id: string;
  title: string;
  color: string;
}

interface SacKanbanColumnProps {
  column: Column;
  sacs: SacCard[];
}

export function SacKanbanColumn({ column, sacs }: SacKanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex-shrink-0 w-72 flex flex-col bg-muted/30 rounded-xl border border-border/50 transition-all duration-200',
        isOver && 'ring-2 ring-primary/50 ring-offset-2 bg-primary/5'
      )}
    >
      <div className="flex items-center gap-2 p-3">
        <div className={cn('w-2.5 h-2.5 rounded-full', column.color)} />
        <h3 className="font-semibold text-xs uppercase tracking-wide">{column.title}</h3>
        <span className="ml-auto text-[10px] text-muted-foreground bg-background px-1.5 py-0.5 rounded-full font-medium">
          {sacs.length}
        </span>
      </div>
      
      <ScrollArea className="flex-1 px-2 pb-2">
        <SortableContext items={sacs.map(s => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {sacs.map(sac => (
              <SacKanbanCard key={sac.id} sac={sac} />
            ))}
          </div>
        </SortableContext>
        {sacs.length === 0 && (
          <div className="flex items-center justify-center h-20 text-muted-foreground/50 text-xs">
            Arraste SACs aqui
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
