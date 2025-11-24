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
  ChevronsLeftRight,
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

const mainMenuItems = [
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
};

export function Sidebar() {
  const { user, signOut, userRole } = useAuth();
  const { logoUrl, logoIconUrl } = useTheme();
  const [clickUpOpen, setClickUpOpen] = useState(false);
  const [hoverTimer, setHoverTimer] = useState<number | null>(null);
  const [closeTimer, setCloseTimer] = useState<number | null>(null);
  const [footerMenuOpen, setFooterMenuOpen] = useState(false);
  const [footerHoverTimer, setFooterHoverTimer] = useState<number | null>(null);
  const [footerCloseTimer, setFooterCloseTimer] = useState<number | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sidebar-collapsed") === "true";
  });
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

      if (footerHoverTimer) {
        window.clearTimeout(footerHoverTimer);
      }

      if (footerCloseTimer) {
        window.clearTimeout(footerCloseTimer);
      }
    };
  }, [hoverTimer, closeTimer, footerHoverTimer, footerCloseTimer]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("sidebar-collapsed", isCollapsed ? "true" : "false");
  }, [isCollapsed]);

  useEffect(() => {
    if (!isCollapsed) {
      setFooterMenuOpen(false);
    }
  }, [isCollapsed]);

  const activeLogoIcon = logoIconUrl?.trim() ? logoIconUrl : logoUrl;

  const handleFooterEnter = () => {
    if (footerHoverTimer) {
      window.clearTimeout(footerHoverTimer);
    }

    if (footerCloseTimer) {
      window.clearTimeout(footerCloseTimer);
      setFooterCloseTimer(null);
    }

    const timer = window.setTimeout(() => {
      setFooterMenuOpen(true);
    }, 150);

    setFooterHoverTimer(timer);
  };

  const handleFooterLeave = () => {
    if (footerHoverTimer) {
      window.clearTimeout(footerHoverTimer);
      setFooterHoverTimer(null);
    }

    if (footerCloseTimer) {
      window.clearTimeout(footerCloseTimer);
    }

    const timer = window.setTimeout(() => {
      setFooterMenuOpen(false);
    }, 180);

    setFooterCloseTimer(timer);
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 flex h-full flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "border-b border-sidebar-border p-6",
          isCollapsed ? "flex items-center justify-center" : ""
        )}
      >
        {activeLogoIcon ? (
          <img
            src={isCollapsed ? activeLogoIcon : logoUrl}
            alt="Logo"
            className={cn(
              "object-contain",
              isCollapsed ? "h-10 w-10" : "h-10 w-auto"
            )}
          />
        ) : (
          <h2 className="text-xl font-bold text-sidebar-foreground">Leon Manager</h2>
        )}
      </div>

      {/* Menu Items */}
      <nav className="relative flex-1 space-y-2 p-4">
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
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isCollapsed ? "justify-center" : ""
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {!isCollapsed && <span className="font-medium">{item.label}</span>}
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
                isCollapsed ? "justify-center" : ""
              )}
              activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
            >
              <Icon className="h-5 w-5" />
              {!isCollapsed && <span className="font-medium">{item.label}</span>}
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
              isCollapsed ? "justify-center" : ""
            )}
            activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
          >
            <Building2 className="h-5 w-5" />
            {!isCollapsed && <span className="font-medium">CRM</span>}
          </NavLink>
        )}

        {/* WhatsApp - Condicional baseado em permissões */}
        {permissions.wpp_acess && (
          <NavLink
            to="/whatsapp"
            end
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              isCollapsed ? "justify-center" : ""
            )}
            activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
          >
            <MessageSquare className="h-5 w-5" />
            {!isCollapsed && <span className="font-medium">WhatsApp</span>}
          </NavLink>
        )}
      </nav>

      {/* Footer com Logs, Configurações, Recolher e Sair */}
      <div className="border-t border-sidebar-border px-4 py-3">
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => navigate("/perfil")}
            className={cn(
              "flex items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-sidebar-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
              isCollapsed ? "justify-center" : ""
            )}
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
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-sidebar-foreground">{displayName}</p>
              </div>
            )}
          </button>
          <div className="h-px bg-sidebar-border" />
          <TooltipProvider delayDuration={0}>
            {isCollapsed ? (
              <div
                className="relative flex justify-center"
                onMouseEnter={handleFooterEnter}
                onMouseLeave={handleFooterLeave}
              >
                <button
                  type="button"
                  aria-label="Abrir menu rápido"
                  className="flex items-center justify-center rounded-lg p-2 text-sidebar-foreground transition-colors hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                >
                  <Settings className="h-5 w-5" />
                </button>
                {footerMenuOpen && (
                  <div className="absolute left-full bottom-0 z-20 mb-2 ml-3 w-52 rounded-lg bg-sidebar-accent text-sidebar-accent-foreground shadow-lg">
                    <div className="space-y-1 p-3">
                      <button
                        type="button"
                        onClick={() => setIsCollapsed(false)}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-sidebar/20"
                      >
                        <ChevronsLeftRight className="h-4 w-4" />
                        <span>Expandir barra</span>
                      </button>
                      {userRole === "admin" && (
                        <>
                          <NavLink
                            to="/configuracoes"
                            end
                            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar/20"
                            activeClassName="bg-sidebar text-sidebar-foreground"
                          >
                            <Settings className="h-4 w-4" />
                            <span>Configurações</span>
                          </NavLink>
                          <NavLink
                            to="/logs"
                            end
                            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar/20"
                            activeClassName="bg-sidebar text-sidebar-foreground"
                          >
                            <FileText className="h-4 w-4" />
                            <span>Logs</span>
                          </NavLink>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={signOut}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-sidebar/20"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sair</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setIsCollapsed(true)}
                      aria-label="Recolher barra"
                      className="flex items-center justify-center rounded-lg p-2 text-sidebar-foreground transition-colors hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                    >
                      <ChevronsLeftRight className="h-5 w-5" />
                      <span className="sr-only">Recolher barra</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Recolher barra</TooltipContent>
                </Tooltip>
                {userRole === "admin" && (
                  <>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <NavLink
                          to="/configuracoes"
                          end
                          aria-label="Configurações"
                          className="flex items-center justify-center rounded-lg p-2 text-sidebar-foreground transition-colors hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                          activeClassName="text-sidebar-accent-foreground"
                        >
                          <Settings className="h-5 w-5" />
                          <span className="sr-only">Configurações</span>
                        </NavLink>
                      </TooltipTrigger>
                      <TooltipContent side="top">Configurações</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <NavLink
                          to="/logs"
                          end
                          aria-label="Logs"
                          className="flex items-center justify-center rounded-lg p-2 text-sidebar-foreground transition-colors hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                          activeClassName="text-sidebar-accent-foreground"
                        >
                          <FileText className="h-5 w-5" />
                          <span className="sr-only">Logs</span>
                        </NavLink>
                      </TooltipTrigger>
                      <TooltipContent side="top">Logs</TooltipContent>
                    </Tooltip>
                  </>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={signOut}
                      aria-label="Sair"
                      className="flex items-center justify-center rounded-lg p-2 text-sidebar-foreground transition-colors hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                    >
                      <LogOut className="h-5 w-5" />
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
