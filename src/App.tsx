import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";

import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import SacList from "@/pages/sacs/SacList";
import SacForm from "@/pages/sacs/SacForm";
import SacDetail from "@/pages/sacs/SacDetail";
import Clients from "@/pages/Clients";
import Reports from "@/pages/Reports";
import Tasks from "@/pages/Tasks";
import History from "@/pages/History";
import Documentation from "@/pages/Documentation";
import Users from "@/pages/admin/Users";
import Permissions from "@/pages/admin/Permissions";
import CustomFields from "@/pages/admin/CustomFields";
import CardSettings from "@/pages/admin/CardSettings";
import WorkflowStages from "@/pages/admin/WorkflowStages";
import SystemLogs from "@/pages/admin/SystemLogs";
import LandingPages from "@/pages/admin/LandingPages";
import LandingPageForm from "@/pages/public/LandingPageForm";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider
    attribute="class"
    defaultTheme="system"
    enableSystem
    disableTransitionOnChange
  >
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/lp/:slug" element={<LandingPageForm />} />
              <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="sacs" element={<SacList />} />
                <Route path="sacs/new" element={<SacForm />} />
                <Route path="sacs/:id" element={<SacDetail />} />
                <Route path="clients" element={<Clients />} />
                <Route path="reports" element={<Reports />} />
                <Route path="tasks" element={<Tasks />} />
                <Route path="history" element={<History />} />
                <Route path="docs" element={<Documentation />} />
                <Route path="admin/users" element={<Users />} />
                <Route path="admin/permissions" element={<Permissions />} />
                <Route path="admin/custom-fields" element={<CustomFields />} />
                <Route path="admin/card-settings" element={<CardSettings />} />
                <Route path="admin/workflow-stages" element={<WorkflowStages />} />
                <Route path="admin/landing-pages" element={<LandingPages />} />
                <Route path="admin/logs" element={<SystemLogs />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
