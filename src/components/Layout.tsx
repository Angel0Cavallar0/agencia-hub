import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex h-screen w-full bg-background text-foreground">
      <Sidebar />
      <main className="flex flex-1 min-h-0 min-w-0 flex-col overflow-hidden p-8">
        {children}
      </main>
    </div>
  );
};
