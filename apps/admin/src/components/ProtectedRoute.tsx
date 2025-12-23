import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, userRole, minAccessLevel, loading } = useAuth();

  const roleOrder = ["basic", "assistent", "supervisor", "manager", "admin"] as const;
  const isRoleAllowed = (role: string) =>
    roleOrder.indexOf(role as (typeof roleOrder)[number]) >=
    roleOrder.indexOf(minAccessLevel);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user || !userRole || !isRoleAllowed(userRole)) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
