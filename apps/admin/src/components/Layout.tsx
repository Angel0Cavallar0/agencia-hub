import { ReactNode, useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";

interface LayoutProps {
  children: ReactNode;
  /**
   * Remove default padding from the main area to allow full-bleed layouts
   * (e.g., pages that need to occupy the entire viewport without gutters).
   */
  noPadding?: boolean;
}

export const Layout = ({ children, noPadding = false }: LayoutProps) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const stored = window.localStorage.getItem("sidebar-collapsed");
    return stored === "true";
  });

  useEffect(() => {
    window.localStorage.setItem(
      "sidebar-collapsed",
      isSidebarCollapsed ? "true" : "false"
    );
  }, [isSidebarCollapsed]);

  const mainPadding = noPadding ? "" : "p-8";
  const mainOverflow = noPadding ? "overflow-hidden" : "overflow-y-auto";
  const sidebarWidth = isSidebarCollapsed ? "ml-20" : "ml-64";

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar
        collapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />
      <main
        className={`${sidebarWidth} flex-1 h-screen min-w-0 overflow-x-hidden ${mainOverflow} ${mainPadding}`}
      >
        {children}
      </main>
    </div>
  );
};
