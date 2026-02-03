import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

export function AppLayout() {
  const { profile, roles } = useAuth();

  const getRoleBadge = () => {
    if (roles.includes('admin')) return { label: 'Admin', variant: 'default' as const };
    if (roles.includes('supervisor')) return { label: 'Supervisor', variant: 'secondary' as const };
    if (roles.includes('analista')) return { label: 'Analista', variant: 'outline' as const };
    return { label: 'Usuário', variant: 'outline' as const };
  };

  const roleBadge = getRoleBadge();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-40 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-full items-center gap-4 px-4 md:px-6">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              
              <div className="flex-1 flex items-center gap-4">
                <div className="relative hidden md:flex max-w-md flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar SACs, clientes..."
                    className="pl-10 bg-muted/50 border-0 focus-visible:ring-1"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant={roleBadge.variant} className="hidden sm:flex">
                  {roleBadge.label}
                </Badge>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="h-5 w-5" />
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
                        3
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <DropdownMenuLabel>Notificações</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                      <span className="font-medium">Novo SAC atribuído</span>
                      <span className="text-xs text-muted-foreground">SAC #1234 foi atribuído a você</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                      <span className="font-medium">Prazo próximo</span>
                      <span className="text-xs text-muted-foreground">SAC #1232 vence em 2 horas</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                      <span className="font-medium">Comentário adicionado</span>
                      <span className="text-xs text-muted-foreground">Novo comentário no SAC #1230</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
