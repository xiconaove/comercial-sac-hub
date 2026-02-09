import { useLocation } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Headphones,
  Users,
  Building2,
  BarChart3,
  Settings,
  FileText,
  Shield,
  LogOut,
  Book,
  Paperclip,
  History,
  CheckSquare,
  Settings2,
  GitBranch,
  Globe,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/ThemeToggle';
import saLogo from '@/assets/sa-logo.png';

const mainNavItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'SACs', url: '/sacs', icon: Headphones },
  { title: 'Minhas Tarefas', url: '/tasks', icon: CheckSquare },
  { title: 'Clientes', url: '/clients', icon: Building2 },
  { title: 'Relatórios', url: '/reports', icon: BarChart3 },
  { title: 'Histórico', url: '/history', icon: History },
  { title: 'Arquivos', url: '/docs', icon: Paperclip },
];

const adminNavItems = [
  { title: 'Usuários', url: '/admin/users', icon: Users },
  { title: 'Permissões', url: '/admin/permissions', icon: Shield },
  { title: 'Campos Personalizados', url: '/admin/custom-fields', icon: Settings },
  { title: 'Etapas do Fluxo', url: '/admin/workflow-stages', icon: GitBranch },
  { title: 'Landing Pages', url: '/admin/landing-pages', icon: Globe },
  { title: 'Config. Card', url: '/admin/card-settings', icon: Settings2 },
  { title: 'Logs do Sistema', url: '/admin/logs', icon: FileText },
];

export function AppSidebar() {
  const location = useLocation();
  const { profile, signOut, isAdminOrSupervisor } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');
  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Sidebar className="border-r-0 gradient-sidebar" collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <img src={saLogo} alt="SA" className="h-9 w-9 rounded-lg bg-white/10 p-1" />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-sidebar-foreground tracking-tight">SA COMERC</span>
              <span className="text-[10px] text-sidebar-foreground/60 uppercase tracking-widest">Sistema SAC</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 uppercase text-[10px] tracking-widest font-semibold">
            {!collapsed && 'Menu'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground/70 transition-all duration-200 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdminOrSupervisor() && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/50 uppercase text-[10px] tracking-widest font-semibold">
              {!collapsed && 'Admin'}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink
                        to={item.url}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground/70 transition-all duration-200 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
                      >
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span className="text-sm">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-3">
        <Separator className="mb-3 bg-sidebar-border/50" />
        <div className="flex items-center gap-2.5">
          <Avatar className="h-8 w-8 border border-sidebar-foreground/20">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs">
              {getInitials(profile?.full_name)}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground truncate">
                {profile?.full_name || 'Usuário'}
              </p>
              <p className="text-[10px] text-sidebar-foreground/50 truncate">
                {profile?.email}
              </p>
            </div>
          )}
          <div className="flex items-center gap-0.5">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className="h-7 w-7 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
