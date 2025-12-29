import {
  Home,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useMemo } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "@/contexts/ThemeContext";
import { NavLink } from "./NavLink";

type MenuItem = {
  icon: typeof Home;
  label: string;
  path: string;
};

const menuItems: MenuItem[] = [
  { icon: Home, label: "Início", path: "/dashboard" },
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
];

type SidebarProps = {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};

export function Sidebar({ collapsed = false, onToggleCollapse }: SidebarProps) {
  const { user, signOut } = useAuth();
  const { logoUrl, logoIconUrl } = useTheme();
  const displayName = useMemo(() => {
    return user?.user_metadata?.name || user?.email?.split("@")[0] || "Usuário";
  }, [user?.email, user?.user_metadata?.name]);

  const initials = useMemo(() => {
    if (displayName?.trim()) {
      const [first = "", second = ""] = displayName.trim().split(/\s+/);
      const combined = `${first.charAt(0)}${second.charAt(0)}`.toUpperCase();
      return combined.trim() ? combined : first.charAt(0).toUpperCase();
    }
    return "?";
  }, [displayName]);

  const iconClassName = collapsed ? "h-6 w-6" : "h-5 w-5";
  const containerWidth = collapsed ? "w-20" : "w-64";

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200",
          containerWidth
        )}
      >
        {/* Header/Logo */}
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
              Agência Hub
            </h2>
          )}
        </div>

        {/* Menu Items */}
        <nav className="relative flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const link = (
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

            return collapsed ? (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            ) : (
              link
            );
          })}
        </nav>

        {/* Footer */}
        <div className={cn("border-t border-sidebar-border px-4 py-2", collapsed ? "px-2" : undefined)}>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              className={cn(
                "flex items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-sidebar-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                collapsed ? "justify-center" : undefined
              )}
            >
              <Avatar className="h-9 w-9">
                {user?.user_metadata?.avatar_url ? (
                  <AvatarImage src={user.user_metadata.avatar_url} alt={displayName} />
                ) : (
                  <AvatarFallback className="bg-sidebar-accent/20 text-sidebar-foreground">
                    {initials}
                  </AvatarFallback>
                )}
              </Avatar>
              {!collapsed && (
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-sidebar-foreground">{displayName}</p>
                  <p className="text-xs text-sidebar-foreground/60 truncate">{user?.email}</p>
                </div>
              )}
            </button>

            <div className="flex items-center justify-center gap-3">
              {onToggleCollapse && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={onToggleCollapse}
                      aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
                      className="flex items-center justify-center p-2 text-sidebar-foreground transition-colors hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                    >
                      {collapsed ? <PanelLeftOpen className={iconClassName} /> : <PanelLeftClose className={iconClassName} />}
                      <span className="sr-only">{collapsed ? "Expandir menu" : "Recolher menu"}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">{collapsed ? "Expandir" : "Recolher"}</TooltipContent>
                </Tooltip>
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
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
