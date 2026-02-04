import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SacKanban } from '@/components/sacs/SacKanban';
import { Plus, List, Kanban } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';

export default function SacKanbanPage() {
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">SACs - Kanban</h1>
          <p className="text-muted-foreground">Arraste e solte para alterar o status</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Tabs defaultValue="kanban" className="w-auto">
            <TabsList>
              <TabsTrigger value="list" onClick={() => navigate('/sacs')}>
                <List className="h-4 w-4 mr-1" />
                Lista
              </TabsTrigger>
              <TabsTrigger value="kanban">
                <Kanban className="h-4 w-4 mr-1" />
                Kanban
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button asChild className="gradient-primary">
            <Link to="/sacs/new">
              <Plus className="mr-2 h-4 w-4" />
              Novo SAC
            </Link>
          </Button>
        </div>
      </div>

      <SacKanban />
    </div>
  );
}
