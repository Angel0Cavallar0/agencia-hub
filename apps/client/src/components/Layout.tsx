import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export const Layout = () => {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const saved = window.localStorage.getItem("sidebar-collapsed");
    return saved === "true";
  });

  useEffect(() => {
    window.localStorage.setItem("sidebar-collapsed", collapsed ? "true" : "false");
  }, [collapsed]);

  const sidebarWidth = collapsed ? "ml-20" : "ml-64";

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((prev) => !prev)} />
      <main className={`${sidebarWidth} flex-1 h-screen min-w-0 overflow-x-hidden overflow-y-auto p-8`}>
        <Outlet />
      </main>
    </div>
  );
};
