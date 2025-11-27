import {
  FileText,
  Home,
  LayoutDashboard,
  Users,
  UserCog,
  MousePointerClick,
  MessageSquare,
  Building2,
  LogOut,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  MoreVertical,
  Workflow,
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
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

const mainMenuItems = [
  { icon: Home, label: "Home", path: "/home" },
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Users, label: "Clientes", path: "/clientes" },
  { icon: UserCog, label: "Colaboradores", path: "/colaboradores" },
];

const clickUpMenuItem = {
  icon: MousePointerClick,
  label: "ClickUp",
  path: "/clickup",
  submenu: [
    { label: "Responsáveis", path: "/clickup/responsaveis" },
    { label: "Tarefas", path: "/clickup/tarefas" },
    { label: "Pastas", path: "/clickup/pastas" },
    { label: "Listas", path: "/clickup/listas" },
  ],
} as const;

const menuItems = [...mainMenuItems, clickUpMenuItem];

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
  n8n_access: boolean;
};

type SidebarProps = {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};

export function Sidebar({ collapsed = false, onToggleCollapse }: SidebarProps) {
  const { user, signOut, userRole } = useAuth();
  const { logoUrl, logoIconUrl } = useTheme();
  const [clickUpOpen, setClickUpOpen] = useState(false);
  const [hoverTimer, setHoverTimer] = useState<number | null>(null);
  const [closeTimer, setCloseTimer] = useState<number | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<SidebarProfile | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions>({
    crm_access: false,
    wpp_acess: false,
    n8n_access: false,
  });

  useEffect(() => {
    let isActive = true;

    const loadProfile = async () => {
      if (!user?.id) {
        if (isActive) {
          setProfile(null);
          setPermissions({ crm_access: false, wpp_acess: false, n8n_access: false });
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

        const resolvedN8nAccess =
          typeof (userRoles as { n8n_access?: boolean }).n8n_access === "boolean"
            ? (userRoles as { n8n_access?: boolean }).n8n_access ?? false
            : typeof (userRoles as { n8n_acess?: boolean }).n8n_acess === "boolean"
              ? (userRoles as { n8n_acess?: boolean }).n8n_acess ?? false
              : resolvedCrmAccess || resolvedWppAccess;

        setPermissions({
          crm_access: resolvedCrmAccess,
          wpp_acess: resolvedWppAccess,
          n8n_access: resolvedN8nAccess,
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

  const handleClickUpEnter = () => {
    if (hoverTimer) {
      window.clearTimeout(hoverTimer);
    }

    if (closeTimer) {
      window.clearTimeout(closeTimer);
      setCloseTimer(null);
    }

    const timer = window.setTimeout(() => {
      setClickUpOpen(true);
    }, 250);

    setHoverTimer(timer);
  };

  const handleClickUpLeave = () => {
    if (hoverTimer) {
      window.clearTimeout(hoverTimer);
      setHoverTimer(null);
    }

    if (closeTimer) {
      window.clearTimeout(closeTimer);
    }

    const timer = window.setTimeout(() => {
      setClickUpOpen(false);
    }, 200);

    setCloseTimer(timer);
  };

  useEffect(() => {
    return () => {
      if (hoverTimer) {
        window.clearTimeout(hoverTimer);
      }

      if (closeTimer) {
        window.clearTimeout(closeTimer);
      }
    };
  }, [hoverTimer, closeTimer]);

  const containerWidth = collapsed ? "w-20" : "w-64";
  const iconClassName = collapsed ? "h-6 w-6" : "h-5 w-5";

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 flex h-full flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200",
        containerWidth
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center justify-center border-b border-sidebar-border",
          collapsed ? "p-3" : "p-4"
        )}
      >
        {(collapsed ? logoIconUrl : logoUrl) ? (
          <img
            src={collapsed ? logoIconUrl || logoUrl : logoUrl}
            alt="Logo"
            className={cn(
              "h-10 object-contain",
              collapsed ? "w-10" : "w-auto",
              collapsed ? "mx-auto" : undefined
            )}
          />
        ) : (
          <h2
            className={cn(
              "text-xl font-bold text-sidebar-foreground truncate",
              collapsed ? "text-sm" : undefined
            )}
          >
            Leon Manager
          </h2>
        )}
      </div>

      {/* Menu Items */}
      <nav className="relative flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path ||
            (item.submenu && item.submenu.some(sub => location.pathname === sub.path));

          if (item.submenu) {
            return (
              <div
                key={item.path}
                className="relative space-y-1"
                onMouseEnter={handleClickUpEnter}
                onMouseLeave={handleClickUpLeave}
              >
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer",
                    collapsed ? "justify-center" : undefined,
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className={iconClassName} />
                  {!collapsed && <span className="font-medium">{item.label}</span>}
                </div>
                {clickUpOpen && (
                  <div className="absolute left-full top-0 z-20 ml-3 w-56 rounded-lg bg-sidebar-accent text-sidebar-accent-foreground shadow-lg">
                    <div className="space-y-1 p-3">
                      {item.submenu.map((subItem) => (
                        <NavLink
                          key={subItem.path}
                          to={subItem.path}
                          end
                          className="block rounded-lg px-3 py-2 text-sm transition-colors hover:bg-sidebar bg-sidebar/20"
                          activeClassName="bg-sidebar text-sidebar-foreground"
                        >
                          {subItem.label}
                        </NavLink>
                      ))}
                    </div>
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
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                collapsed ? "justify-center" : undefined
              )}
              activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
            >
              <Icon className={iconClassName} />
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </NavLink>
          );
        })}

        {/* CRM - Condicional baseado em permissões */}
        {permissions.crm_access && (
          <NavLink
            to="/crm"
            end
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              collapsed ? "justify-center" : undefined
            )}
            activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
          >
            <Building2 className={iconClassName} />
            {!collapsed && <span className="font-medium">CRM</span>}
          </NavLink>
        )}

        {/* n8n - Condicional baseado em permissões */}
        {permissions.n8n_access && (
          <NavLink
            to="/n8n"
            end
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              collapsed ? "justify-center" : undefined
            )}
            activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
          >
            <Workflow className={iconClassName} />
            {!collapsed && <span className="font-medium">n8n</span>}
          </NavLink>
        )}

        {/* WhatsApp - Condicional baseado em permissões */}
        {permissions.wpp_acess && (
          <NavLink
            to="/whatsapp"
            end
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              collapsed ? "justify-center" : undefined
            )}
            activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
          >
            <MessageSquare className={iconClassName} />
            {!collapsed && <span className="font-medium">WhatsApp</span>}
          </NavLink>
        )}
      </nav>

      {/* Footer com Logs, Configurações e Sair */}
      <div
        className={cn(
          "border-t border-[#006B52] px-4 py-2",
          collapsed ? "px-2" : undefined
        )}
      >
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => navigate("/perfil")}
            className={cn(
              "flex items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-sidebar-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
              collapsed ? "justify-center" : undefined
            )}
          >
            <Avatar className="h-9 w-9">
              {profile?.foto_url ? (
                <AvatarImage src={profile.foto_url} alt={displayName} />
              ) : (
                <AvatarFallback className="bg-sidebar-accent/20 text-sidebar-foreground">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-sidebar-foreground">{displayName}</p>
              </div>
            )}
          </button>
          <TooltipProvider delayDuration={0}>
            {collapsed ? (
              <HoverCard openDelay={0} closeDelay={75}>
                <HoverCardTrigger asChild>
                  <button
                    type="button"
                    aria-label="Ações rápidas"
                    className="flex w-full items-center justify-center rounded-lg p-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </HoverCardTrigger>
                <HoverCardContent
                  side="top"
                  align="start"
                  className="w-56 border-sidebar-border bg-sidebar text-sidebar-foreground"
                >
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={onToggleCollapse}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-sidebar-accent/10"
                    >
                      <PanelLeftOpen className={iconClassName} />
                      <span>Expandir menu</span>
                    </button>
                    {userRole === "admin" && (
                      <NavLink
                        to="/logs"
                        end
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent/10"
                        activeClassName="bg-sidebar-accent/20 text-sidebar-accent-foreground"
                      >
                        <FileText className={iconClassName} />
                        <span>Logs</span>
                      </NavLink>
                    )}
                    <NavLink
                      to="/configuracoes"
                      end
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent/10"
                      activeClassName="bg-sidebar-accent/20 text-sidebar-accent-foreground"
                    >
                      <Settings className={iconClassName} />
                      <span>Configurações</span>
                    </NavLink>
                    <button
                      type="button"
                      onClick={signOut}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-sidebar-accent/10"
                    >
                      <LogOut className={iconClassName} />
                      <span>Sair</span>
                    </button>
                  </div>
                </HoverCardContent>
              </HoverCard>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={onToggleCollapse}
                      aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
                      className="flex items-center justify-center p-2 text-sidebar-foreground transition-colors hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                    >
                      {collapsed ? (
                        <PanelLeftOpen className={iconClassName} />
                      ) : (
                        <PanelLeftClose className={iconClassName} />
                      )}
                      <span className="sr-only">{collapsed ? "Expandir menu" : "Recolher menu"}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">{collapsed ? "Expandir" : "Recolher"}</TooltipContent>
                </Tooltip>
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
                          <FileText className={iconClassName} />
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
                          <Settings className={iconClassName} />
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
                      <LogOut className={iconClassName} />
                      <span className="sr-only">Sair</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Sair</TooltipContent>
                </Tooltip>
              </div>
            )}
          </TooltipProvider>
        </div>
      </div>
    </aside>
  );
}
