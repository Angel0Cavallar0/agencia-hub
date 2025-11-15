import {
  FileText,
  LayoutDashboard,
  Users,
  UserCog,
  MousePointerClick,
  MessageSquare,
  Building2,
  LogOut,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useEffect, useMemo, useState } from "react";
import { NavLink } from "./NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Users, label: "Clientes", path: "/clientes" },
  { icon: UserCog, label: "Colaboradores", path: "/colaboradores" },
  {
    icon: MousePointerClick,
    label: "ClickUp",
    path: "/clickup",
    submenu: [
      { label: "Responsáveis", path: "/clickup/responsaveis" },
      { label: "Tarefas", path: "/clickup/tarefas" },
      { label: "Pastas", path: "/clickup/pastas" },
      { label: "Listas", path: "/clickup/listas" },
    ],
  },
];

type SidebarProfile = {
  id_colaborador: string | null;
  nome: string | null;
  sobrenome: string | null;
  apelido: string | null;
  foto_url: string | null;
};

type UserPermissions = {
  crm_access: boolean;
  wpp_acess: boolean;
};

export function Sidebar() {
  const { user, signOut, userRole } = useAuth();
  const { logoUrl } = useTheme();
  const [clickUpOpen, setClickUpOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<SidebarProfile | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions>({
    crm_access: false,
    wpp_acess: false,
  });

  useEffect(() => {
    let isActive = true;

    const loadProfile = async () => {
      if (!user?.id) {
        if (isActive) {
          setProfile(null);
          setPermissions({ crm_access: false, wpp_acess: false });
        }
        return;
      }

      const { data } = await supabase
        .from("colaborador")
        .select("id_colaborador, nome, sobrenome, apelido, foto_url")
        .eq("user_id", user.id)
        .maybeSingle();

      if (isActive) {
        setProfile(
          data
            ? {
                id_colaborador: data.id_colaborador ?? null,
                nome: data.nome ?? null,
                sobrenome: data.sobrenome ?? null,
                apelido: data.apelido ?? null,
                foto_url: data.foto_url ?? null,
              }
            : null
        );
      }

      // Buscar permissões
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (isActive && userRoles) {
        const resolvedWppAccess =
          typeof userRoles.wpp_acess === "boolean"
            ? userRoles.wpp_acess
            : typeof (userRoles as { wpp_access?: boolean }).wpp_access === "boolean"
            ? (userRoles as { wpp_access?: boolean }).wpp_access ?? false
            : false;

        const resolvedCrmAccess =
          typeof userRoles.crm_access === "boolean"
            ? userRoles.crm_access
            : typeof (userRoles as { crm_acess?: boolean }).crm_acess === "boolean"
            ? (userRoles as { crm_acess?: boolean }).crm_acess ?? false
            : false;

        setPermissions({
          crm_access: resolvedCrmAccess,
          wpp_acess: resolvedWppAccess,
        });
      }
    };

    loadProfile();

    return () => {
      isActive = false;
    };
  }, [user?.id]);

  const displayName = useMemo(() => {
    if (profile?.apelido) return profile.apelido;

    const nameParts = [profile?.nome, profile?.sobrenome].filter(Boolean) as string[];
    if (nameParts.length > 0) {
      return nameParts.join(" ");
    }

    return user?.email ?? "Usuário";
  }, [profile?.apelido, profile?.nome, profile?.sobrenome, user?.email]);

  const initials = useMemo(() => {
    if (!displayName) return "?";
    const [first = "", second = ""] = displayName.trim().split(/\s+/);
    const firstInitial = first.charAt(0);
    const secondInitial = second.charAt(0);
    const combined = `${firstInitial}${secondInitial}`.toUpperCase();
    if (combined.trim().length > 0) {
      return combined;
    }
    if (firstInitial) return firstInitial.toUpperCase();
    return "?";
  }, [displayName]);

  return (
    <aside className="fixed inset-y-0 left-0 flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="h-10 w-auto" />
        ) : (
          <h2 className="text-xl font-bold text-sidebar-foreground">Leon Manager</h2>
        )}
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
            (item.submenu && item.submenu.some(sub => location.pathname === sub.path));

          if (item.submenu) {
            return (
              <div 
                key={item.path} 
                className="space-y-1"
                onMouseEnter={() => setClickUpOpen(true)}
                onMouseLeave={() => setClickUpOpen(false)}
              >
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </div>
                {clickUpOpen && (
                  <div className="ml-8 space-y-1">
                    {item.submenu.map((subItem) => (
                      <NavLink
                        key={subItem.path}
                        to={subItem.path}
                        end
                        className="block px-3 py-2 rounded-lg text-sm transition-colors text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                      >
                        {subItem.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end
              className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          );
        })}

        {/* CRM - Condicional baseado em permissões */}
        {permissions.crm_access && (
          <NavLink
            to="/crm"
            end
            className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
          >
            <Building2 className="h-5 w-5" />
            <span className="font-medium">CRM</span>
          </NavLink>
        )}

        {/* WhatsApp - Condicional baseado em permissões */}
        {permissions.wpp_acess && (
          <NavLink
            to="/whatsapp"
            end
            className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
          >
            <MessageSquare className="h-5 w-5" />
            <span className="font-medium">WhatsApp</span>
          </NavLink>
        )}
      </nav>

      {/* Footer com Logs, Configurações e Sair */}
      <div className="px-4 py-3 border-t border-sidebar-border">
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => navigate("/perfil")}
            className="flex items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-sidebar-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          >
            <Avatar className="h-10 w-10">
              {profile?.foto_url ? (
                <AvatarImage src={profile.foto_url} alt={displayName} />
              ) : (
                <AvatarFallback className="bg-sidebar-accent/20 text-sidebar-foreground">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-sidebar-foreground">{displayName}</p>
            </div>
          </button>
          <div className="h-px bg-sidebar-border" />
          <TooltipProvider delayDuration={0}>
            <div className="flex items-center justify-center gap-3">
              {userRole === "admin" && (
                <>
                  <Tooltip>
                  <TooltipTrigger asChild>
                    <NavLink
                      to="/logs"
                      end
                      aria-label="Logs"
                      className="flex items-center justify-center p-2 text-sidebar-foreground transition-colors hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                      activeClassName="text-sidebar-accent-foreground"
                    >
                      <FileText className="h-5 w-5" />
                      <span className="sr-only">Logs</span>
                    </NavLink>
                  </TooltipTrigger>
                  <TooltipContent side="top">Logs</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <NavLink
                      to="/configuracoes"
                      end
                      aria-label="Configurações"
                      className="flex items-center justify-center p-2 text-sidebar-foreground transition-colors hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                      activeClassName="text-sidebar-accent-foreground"
                    >
                      <Settings className="h-5 w-5" />
                      <span className="sr-only">Configurações</span>
                    </NavLink>
                  </TooltipTrigger>
                  <TooltipContent side="top">Configurações</TooltipContent>
                </Tooltip>
              </>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={signOut}
                  aria-label="Sair"
                  className="flex items-center justify-center p-2 text-sidebar-foreground transition-colors hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="sr-only">Sair</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">Sair</TooltipContent>
            </Tooltip>
            </div>
          </TooltipProvider>
        </div>
      </div>
    </aside>
  );
}
