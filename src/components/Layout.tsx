import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      <main className="ml-64 flex-1 h-screen min-w-0 overflow-y-auto overflow-x-hidden p-8">
        {children}
      </main>
    </div>
  );
};
