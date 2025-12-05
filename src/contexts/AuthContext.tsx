import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type AppRole = "admin" | "manager" | "supervisor" | "assistent" | "basic";

const roleOrder: AppRole[] = ["basic", "assistent", "supervisor", "manager", "admin"];
const isRoleAllowed = (role: AppRole, minRole: AppRole) =>
  roleOrder.indexOf(role) >= roleOrder.indexOf(minRole);

const normalizeRole = (value: string | null | undefined): AppRole | null => {
  switch (value) {
    case "admin":
    case "manager":
    case "supervisor":
    case "assistent":
    case "basic":
      return value;
    case "gerente":
      return "manager";
    case "assistente":
      return "assistent";
    case "geral":
    case "user":
      return "basic";
    default:
      return null;
  }
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: AppRole | null;
  minAccessLevel: AppRole;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [minAccessLevel, setMinAccessLevel] = useState<AppRole>("basic");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUserRole = async (userId: string): Promise<AppRole | null> => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Erro ao buscar role:", error);
      return null;
    }

    const normalizedRole = normalizeRole(data?.role ?? null);

    if (data?.role && normalizedRole && data.role !== normalizedRole) {
      await supabase
        .from("user_roles")
        .update({ role: normalizedRole })
        .eq("user_id", userId);
    }

    return normalizedRole;
  };

  const fetchMinAccessLevel = async (): Promise<AppRole> => {
    const { data, error } = await supabase
      .from("global_settings")
      .select("value")
      .eq("key", "min_access_level")
      .maybeSingle();

    if (error) {
      console.error("Erro ao buscar nível mínimo de acesso:", error);
      return "basic";
    }

    const normalizedValue = normalizeRole(typeof data?.value === "string" ? data.value : null);
    return normalizedValue ?? "basic";
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(async () => {
            const [role, minLevel] = await Promise.all([
              fetchUserRole(session.user.id),
              fetchMinAccessLevel(),
            ]);

            setUserRole(role);
            setMinAccessLevel(minLevel);
            setLoading(false);
          }, 0);
        } else {
          setUserRole(null);
          fetchMinAccessLevel().then(setMinAccessLevel).finally(() => setLoading(false));
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(async () => {
          const [role, minLevel] = await Promise.all([
            fetchUserRole(session.user.id),
            fetchMinAccessLevel(),
          ]);

          setUserRole(role);
          setMinAccessLevel(minLevel);
          setLoading(false);
        }, 0);
      } else {
        fetchMinAccessLevel().then(setMinAccessLevel).finally(() => setLoading(false));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    if (data.user) {
      const [role, minLevel] = await Promise.all([
        fetchUserRole(data.user.id),
        fetchMinAccessLevel(),
      ]);

      setMinAccessLevel(minLevel);

      if (!role || !isRoleAllowed(role, minLevel)) {
        await supabase.auth.signOut();
        throw new Error("Usuário sem permissão para acessar o painel.");
      }

      setUserRole(role);
      navigate("/dashboard");
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserRole(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider
      value={{ user, session, userRole, minAccessLevel, loading, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
