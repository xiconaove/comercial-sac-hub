import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  DndContext, DragOverlay, closestCorners,
  KeyboardSensor, PointerSensor, useSensor, useSensors,
  DragStartEvent, DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { SacKanbanCard } from './SacKanbanCard';
import { SacKanbanColumn } from './SacKanbanColumn';
import { useToast } from '@/hooks/use-toast';

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

export function SacKanban() {
  const [sacs, setSacs] = useState<SacCard[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCard, setActiveCard] = useState<SacCard | null>(null);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch workflow stages
    const { data: stagesData } = await supabase
      .from('workflow_stages')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (stagesData) {
      setColumns(stagesData.map(s => ({ id: s.slug, title: s.name, color: s.color })));
    }

    // Fetch SACs
    const { data: sacsData } = await supabase
      .from('sacs')
      .select('id, number, title, status, priority, deadline, created_at, client_id, analyst_id')
      .order('created_at', { ascending: false });

    if (sacsData) {
      const clientIds = [...new Set(sacsData.map(s => s.client_id).filter(Boolean))];
      const analystIds = [...new Set(sacsData.map(s => s.analyst_id).filter(Boolean))];
      const [clientsRes, analystsRes] = await Promise.all([
        clientIds.length > 0 ? supabase.from('clients').select('id, name').in('id', clientIds) : { data: [] },
        analystIds.length > 0 ? supabase.from('profiles').select('id, full_name').in('id', analystIds) : { data: [] },
      ]);
      const clientsMap = new Map((clientsRes.data || []).map(c => [c.id, c.name]));
      const analystsMap = new Map((analystsRes.data || []).map(a => [a.id, a.full_name]));
      
      setSacs(sacsData.map(sac => ({
        id: sac.id, number: sac.number, title: sac.title,
        status: sac.status || 'aberto', priority: sac.priority || 'media',
        deadline: sac.deadline, created_at: sac.created_at || '',
        client_name: sac.client_id ? clientsMap.get(sac.client_id) || null : null,
        analyst_name: sac.analyst_id ? analystsMap.get(sac.analyst_id) || null : null,
      })));
    }
    setLoading(false);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveCard(sacs.find(s => s.id === event.active.id) || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);
    if (!over) return;

    const sacId = active.id as string;
    const newStatus = over.id as string;
    const sac = sacs.find(s => s.id === sacId);
    if (!sac || sac.status === newStatus) return;

    setSacs(prev => prev.map(s => s.id === sacId ? { ...s, status: newStatus } : s));

    const { error } = await supabase
      .from('sacs')
      .update({ status: newStatus as any })
      .eq('id', sacId);

    if (error) {
      setSacs(prev => prev.map(s => s.id === sacId ? { ...s, status: sac.status } : s));
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' });
    } else {
      toast({ title: 'Status atualizado', description: `SAC #${sac.number} → ${columns.find(c => c.id === newStatus)?.title}` });
    }
  };

  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-4">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="flex-shrink-0 w-72">
            <Skeleton className="h-10 mb-3 rounded-lg" />
            <Skeleton className="h-28 mb-2 rounded-lg" />
            <Skeleton className="h-28 mb-2 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4 min-h-[calc(100vh-280px)]">
        {columns.map(column => (
          <SacKanbanColumn key={column.id} column={column} sacs={sacs.filter(s => s.status === column.id)} />
        ))}
      </div>
      <DragOverlay>
        {activeCard ? <SacKanbanCard sac={activeCard} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
