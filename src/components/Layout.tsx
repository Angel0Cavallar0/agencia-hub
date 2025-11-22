import { ReactNode } from "react";
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
  const mainPadding = noPadding ? "" : "p-8";
  const mainOverflow = noPadding ? "overflow-hidden" : "overflow-y-auto";

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      <main
        className={`ml-64 flex-1 h-screen min-w-0 overflow-x-hidden ${mainOverflow} ${mainPadding}`}
      >
        {children}
      </main>
    </div>
  );
};
