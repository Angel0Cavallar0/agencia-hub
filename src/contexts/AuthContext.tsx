import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type AppRole = "admin" | "gerente" | "supervisor" | "assistente" | "geral";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [allowedRolesCache, setAllowedRolesCache] = useState<AppRole[] | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const validRoles: AppRole[] = ["admin", "gerente", "supervisor", "assistente", "geral"];
  const defaultAllowedRoles: AppRole[] = ["admin", "supervisor"];

  const normalizeRole = (role: unknown): AppRole | null => {
    if (typeof role !== "string") return null;

    const normalized = role.trim().toLowerCase();
    return validRoles.find((value) => value === normalized) ?? null;
  };

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

    return normalizeRole(data?.role);
  };

  const parseAllowedRoles = (value: unknown): AppRole[] => {
    const tryNormalizeArray = (input: unknown): AppRole[] => {
      if (!Array.isArray(input)) return [];

      const validValues = input
        .map((item) => normalizeRole(item))
        .filter((item): item is AppRole => Boolean(item));

      return Array.from(new Set(validValues));
    };

    const stringValue = typeof value === "string" ? value.trim() : null;

    if (stringValue) {
      try {
        const parsed = JSON.parse(stringValue);
        const fromJson = tryNormalizeArray(parsed);
        if (fromJson.length) return fromJson;
      } catch {
        const splitValues = stringValue
          .split(",")
          .map((item) => normalizeRole(item))
          .filter((item): item is AppRole => Boolean(item));

        if (splitValues.length) return Array.from(new Set(splitValues));
      }
    }

    const arrayValues = tryNormalizeArray(value);
    if (arrayValues.length) return arrayValues;

    if (stringValue) {
      const normalized = normalizeRole(stringValue);
      return normalized ? [normalized] : [];
    }

    if (value && typeof value === "object") {
      const maybeRoles =
        "roles" in value
          ? (value as { roles?: unknown }).roles
          : "allowed_access_levels" in value
            ? (value as { allowed_access_levels?: unknown }).allowed_access_levels
            : null;

      const normalizedFromObject = tryNormalizeArray(maybeRoles);
      if (normalizedFromObject.length) return normalizedFromObject;
    }

    return [];
  };

  const fetchAllowedRoles = async (): Promise<AppRole[]> => {
    if (allowedRolesCache) {
      return allowedRolesCache;
    }

    try {
      const { data, error } = await supabase
        .from("global_settings")
        .select("value")
        .eq("key", "allowed_access_levels")
        .maybeSingle();

      if (error) throw error;

      const parsedRoles = data?.value ? parseAllowedRoles(data.value) : [];
      const resolvedRoles = parsedRoles.length ? parsedRoles : defaultAllowedRoles;
      setAllowedRolesCache(resolvedRoles);
      return resolvedRoles;
    } catch (error) {
      console.error("Erro ao carregar perfis permitidos:", error);
      setAllowedRolesCache(defaultAllowedRoles);
      return defaultAllowedRoles;
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(async () => {
            const role = await fetchUserRole(session.user.id);
            const allowedRoles = await fetchAllowedRoles();

            if (role && allowedRoles.includes(role)) {
              setUserRole(role);
              setLoading(false);
            } else {
              await supabase.auth.signOut();
              setUserRole(null);
              setLoading(false);
              toast.error("Usuário sem permissão para acessar o painel.");
            }
          }, 0);
        } else {
          setUserRole(null);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setTimeout(async () => {
          const role = await fetchUserRole(session.user.id);
          const allowedRoles = await fetchAllowedRoles();

          if (role && allowedRoles.includes(role)) {
            setUserRole(role);
            setLoading(false);
          } else {
            await supabase.auth.signOut();
            setUserRole(null);
            setLoading(false);
            toast.error("Usuário sem permissão para acessar o painel.");
          }
        }, 0);
      } else {
        setLoading(false);
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
      const role = await fetchUserRole(data.user.id);

      const allowedRoles = await fetchAllowedRoles();

      if (!role || !allowedRoles.includes(role)) {
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
    <AuthContext.Provider value={{ user, session, userRole, loading, signIn, signOut }}>
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
