import { FileText, LayoutDashboard, Users, UserCog, MousePointerClick, LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useState } from "react";
import { NavLink } from "./NavLink";
import { useLocation } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

export function Sidebar() {
  const { signOut, userRole } = useAuth();
  const { logoUrl } = useTheme();
  const [clickUpOpen, setClickUpOpen] = useState(false);
  const location = useLocation();

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex h-full flex-col">
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
      </nav>

      {/* Footer com Logs, Configurações e Sair */}
      <div className="px-4 py-3 border-t border-sidebar-border">
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
    </aside>
  );
}
