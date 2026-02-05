import { Outlet, useLocation } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.25, ease: 'easeOut' as const },
};

export function AppLayout() {
  const { profile, roles } = useAuth();
  const location = useLocation();

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
          <header className="sticky top-0 z-40 h-14 border-b bg-background/80 backdrop-blur-xl">
            <div className="flex h-full items-center gap-4 px-4 md:px-6">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
              
              <div className="flex-1 flex items-center gap-4">
                <div className="relative hidden md:flex max-w-sm flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar SACs, clientes..."
                    className="pl-10 bg-muted/40 border-0 focus-visible:ring-1 h-9 rounded-full text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={roleBadge.variant} className="hidden sm:flex text-[10px] px-2 py-0.5">
                  {roleBadge.label}
                </Badge>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative h-9 w-9">
                      <Bell className="h-4 w-4" />
                      <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground flex items-center justify-center">
                        3
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <DropdownMenuLabel>Notificações</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                      <span className="font-medium text-sm">Novo SAC atribuído</span>
                      <span className="text-xs text-muted-foreground">SAC #1234 foi atribuído a você</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                      <span className="font-medium text-sm">Prazo próximo</span>
                      <span className="text-xs text-muted-foreground">SAC #1232 vence em 2 horas</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                {...pageTransition}
                className="h-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
