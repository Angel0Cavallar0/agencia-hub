import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ThemeConfig {
  darkMode: boolean;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  faviconUrl: string;
}

interface ThemeContextType extends ThemeConfig {
  setDarkMode: (value: boolean) => void;
  setPrimaryColor: (color: string) => void;
  setSecondaryColor: (color: string) => void;
  setLogoUrl: (url: string) => void;
  setFaviconUrl: (url: string) => void;
  saveAsGlobal: () => Promise<void>;
  loadGlobalSettings: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const defaultConfig: ThemeConfig = {
  darkMode: false,
  primaryColor: "166 100% 21%",
  secondaryColor: "166 98% 34%",
  logoUrl: "",
  faviconUrl: "",
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [config, setConfig] = useState<ThemeConfig>(() => {
    const saved = localStorage.getItem("leon-theme-config");
    return saved ? JSON.parse(saved) : defaultConfig;
  });

  useEffect(() => {
    loadGlobalSettings();
  }, []);

  useEffect(() => {
    localStorage.setItem("leon-theme-config", JSON.stringify(config));
    
    if (config.darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    document.documentElement.style.setProperty("--primary", config.primaryColor);
    document.documentElement.style.setProperty("--accent", config.primaryColor);
    document.documentElement.style.setProperty("--sidebar-primary", config.primaryColor);
    document.documentElement.style.setProperty("--ring", config.primaryColor);
    
    document.documentElement.style.setProperty("--secondary", config.secondaryColor);

    if (config.faviconUrl) {
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement("link");
      link.type = "image/x-icon";
      link.rel = "shortcut icon";
      link.href = config.faviconUrl;
      document.getElementsByTagName("head")[0].appendChild(link);
    }
  }, [config]);

  const setDarkMode = (value: boolean) => {
    setConfig((prev) => ({ ...prev, darkMode: value }));
  };

  const setPrimaryColor = (color: string) => {
    setConfig((prev) => ({ ...prev, primaryColor: color }));
  };

  const setSecondaryColor = (color: string) => {
    setConfig((prev) => ({ ...prev, secondaryColor: color }));
  };

  const setLogoUrl = (url: string) => {
    setConfig((prev) => ({ ...prev, logoUrl: url }));
  };

  const setFaviconUrl = (url: string) => {
    setConfig((prev) => ({ ...prev, faviconUrl: url }));
  };

  const loadGlobalSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("global_settings")
        .select("value")
        .eq("key", "theme_colors")
        .maybeSingle();

      if (error) throw error;
      
      if (data?.value && typeof data.value === 'object' && 'primary' in data.value && 'secondary' in data.value) {
        setConfig((prev) => ({
          ...prev,
          primaryColor: (data.value as any).primary || prev.primaryColor,
          secondaryColor: (data.value as any).secondary || prev.secondaryColor,
        }));
      }
    } catch (error) {
      console.error("Erro ao carregar configurações globais:", error);
    }
  };

  const saveAsGlobal = async () => {
    try {
      const { error } = await supabase
        .from("global_settings")
        .upsert({
          key: "theme_colors",
          value: {
            primary: config.primaryColor,
            secondary: config.secondaryColor,
          },
        });

      if (error) throw error;
      toast.success("Cores padrão salvas para todos os usuários!");
    } catch (error: any) {
      toast.error("Erro ao salvar configurações globais: " + error.message);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        ...config,
        setDarkMode,
        setPrimaryColor,
        setSecondaryColor,
        setLogoUrl,
        setFaviconUrl,
        saveAsGlobal,
        loadGlobalSettings,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
