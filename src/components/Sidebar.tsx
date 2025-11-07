import { FileText, LayoutDashboard, Users, UserCog, MousePointerClick, LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useState } from "react";
import { NavLink } from "./NavLink";
import { useLocation } from "react-router-dom";

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
    <aside className="w-64 bg-sidebar-background border-r border-sidebar-border flex flex-col">
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
      <div className="p-4 border-t border-sidebar-border space-y-2">
        {userRole === "admin" && (
          <>
            <NavLink
              to="/logs"
              end
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
              activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
            >
              <FileText className="h-5 w-5" />
              <span className="font-medium">Logs</span>
            </NavLink>
            <NavLink
              to="/configuracoes"
              end
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
              activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
            >
              <Settings className="h-5 w-5" />
              <span className="font-medium">Configurações</span>
            </NavLink>
          </>
        )}
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </aside>
  );
}
