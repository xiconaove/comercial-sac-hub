import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  DndContext, 
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SacKanbanCard } from './SacKanbanCard';
import { SacKanbanColumn } from './SacKanbanColumn';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { Plus, Settings2 } from 'lucide-react';
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

const defaultColumns: Column[] = [
  { id: 'aberto', title: 'Aberto', color: 'bg-blue-500' },
  { id: 'em_andamento', title: 'Em Andamento', color: 'bg-yellow-500' },
  { id: 'aguardando_cliente', title: 'Ag. Cliente', color: 'bg-purple-500' },
  { id: 'aguardando_interno', title: 'Ag. Interno', color: 'bg-orange-500' },
  { id: 'resolvido', title: 'Resolvido', color: 'bg-green-500' },
  { id: 'cancelado', title: 'Cancelado', color: 'bg-gray-500' },
];

export function SacKanban() {
  const [sacs, setSacs] = useState<SacCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCard, setActiveCard] = useState<SacCard | null>(null);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchSacs();
  }, []);

  const fetchSacs = async () => {
    setLoading(true);
    
    const { data: sacsData, error } = await supabase
      .from('sacs')
      .select('id, number, title, status, priority, deadline, created_at, client_id, analyst_id')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Erro ao carregar SACs', variant: 'destructive' });
      setLoading(false);
      return;
    }

    if (sacsData) {
      const clientIds = [...new Set(sacsData.map(s => s.client_id).filter(Boolean))];
      const analystIds = [...new Set(sacsData.map(s => s.analyst_id).filter(Boolean))];
      
      const [clientsRes, analystsRes] = await Promise.all([
        clientIds.length > 0 
          ? supabase.from('clients').select('id, name').in('id', clientIds)
          : { data: [] },
        analystIds.length > 0
          ? supabase.from('profiles').select('id, full_name').in('id', analystIds)
          : { data: [] }
      ]);
      
      const clientsMap = new Map((clientsRes.data || []).map(c => [c.id, c.name]));
      const analystsMap = new Map((analystsRes.data || []).map(a => [a.id, a.full_name]));
      
      const formattedSacs: SacCard[] = sacsData.map(sac => ({
        id: sac.id,
        number: sac.number,
        title: sac.title,
        status: sac.status as SacStatus,
        priority: sac.priority || 'media',
        deadline: sac.deadline,
        created_at: sac.created_at || '',
        client_name: sac.client_id ? clientsMap.get(sac.client_id) || null : null,
        analyst_name: sac.analyst_id ? analystsMap.get(sac.analyst_id) || null : null,
      }));
      
      setSacs(formattedSacs);
    }
    setLoading(false);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const card = sacs.find(s => s.id === active.id);
    setActiveCard(card || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const sacId = active.id as string;
    const newStatus = over.id as SacStatus;
    
    const sac = sacs.find(s => s.id === sacId);
    if (!sac || sac.status === newStatus) return;

    // Optimistic update
    setSacs(prev => prev.map(s => 
      s.id === sacId ? { ...s, status: newStatus } : s
    ));

    const { error } = await supabase
      .from('sacs')
      .update({ status: newStatus })
      .eq('id', sacId);

    if (error) {
      // Rollback
      setSacs(prev => prev.map(s => 
        s.id === sacId ? { ...s, status: sac.status } : s
      ));
      toast({ 
        title: 'Erro ao atualizar status', 
        description: error.message,
        variant: 'destructive' 
      });
    } else {
      toast({ 
        title: 'Status atualizado',
        description: `SAC #${sac.number} movido para ${defaultColumns.find(c => c.id === newStatus)?.title}`
      });
    }
  };

  const getSacsByStatus = (status: SacStatus) => {
    return sacs.filter(sac => sac.status === status);
  };

  if (loading) {
    return (
      <div className="flex gap-4 p-4 overflow-x-auto">
        {defaultColumns.map(col => (
          <div key={col.id} className="flex-shrink-0 w-80">
            <Skeleton className="h-10 mb-4" />
            <Skeleton className="h-32 mb-2" />
            <Skeleton className="h-32 mb-2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 p-4 overflow-x-auto min-h-[calc(100vh-200px)]">
        {defaultColumns.map(column => (
          <SacKanbanColumn
            key={column.id}
            column={column}
            sacs={getSacsByStatus(column.id)}
          />
        ))}
      </div>
      
      <DragOverlay>
        {activeCard ? (
          <SacKanbanCard sac={activeCard} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
