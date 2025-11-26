import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import ClienteNovo from "./pages/ClienteNovo";
import ClienteDetalhes from "./pages/ClienteDetalhes";
import Colaboradores from "./pages/Colaboradores";
import ColaboradorNovo from "./pages/ColaboradorNovo";
import ColaboradorDetalhes from "./pages/ColaboradorDetalhes";
import Configuracoes from "./pages/Configuracoes";
import Perfil from "./pages/Perfil";
import Logs from "./pages/Logs";
import CRM from "./pages/CRM";
import Whatsapp from "./pages/Whatsapp";
import ClickupResponsaveis from "./pages/clickup/Responsaveis";
import ClickupTarefas from "./pages/clickup/Tarefas";
import ClickupPastas from "./pages/clickup/Pastas";
import ClickupListas from "./pages/clickup/Listas";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route
                path="/home"
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clientes"
                element={
                  <ProtectedRoute>
                    <Clientes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clientes/novo"
                element={
                  <ProtectedRoute>
                    <ClienteNovo />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clientes/:id"
                element={
                  <ProtectedRoute>
                    <ClienteDetalhes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/colaboradores"
                element={
                  <ProtectedRoute>
                    <Colaboradores />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/colaboradores/novo"
                element={
                  <ProtectedRoute>
                    <ColaboradorNovo />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/colaboradores/:id"
                element={
                  <ProtectedRoute>
                    <ColaboradorDetalhes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clickup/responsaveis"
                element={
                  <ProtectedRoute>
                    <ClickupResponsaveis />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clickup/tarefas"
                element={
                  <ProtectedRoute>
                    <ClickupTarefas />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clickup/pastas"
                element={
                  <ProtectedRoute>
                    <ClickupPastas />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clickup/listas"
                element={
                  <ProtectedRoute>
                    <ClickupListas />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/logs"
                element={
                  <ProtectedRoute>
                    <Logs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/crm"
                element={
                  <ProtectedRoute>
                    <CRM />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/whatsapp"
                element={
                  <ProtectedRoute>
                    <Whatsapp />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/configuracoes"
                element={
                  <ProtectedRoute>
                    <Configuracoes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/perfil"
                element={
                  <ProtectedRoute>
                    <Perfil />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
