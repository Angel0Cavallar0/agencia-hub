import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

interface ThemeConfig {
  darkMode: boolean;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  faviconUrl: string;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const adjustHslLightness = (hsl: string, delta: number) => {
  const [hue, saturation, lightness] = hsl.split(" ");
  const h = parseFloat(hue);
  const s = parseFloat(saturation.replace("%", ""));
  const l = parseFloat(lightness.replace("%", ""));

  const nextLightness = clamp(l + delta, 0, 100);
  const sanitizedLightness = Number.isFinite(nextLightness) ? nextLightness : 0;

  return `${isNaN(h) ? 0 : h} ${isNaN(s) ? 0 : s}% ${sanitizedLightness}%`;
};

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
  darkMode: true,
  primaryColor: "166 100% 21%",
  secondaryColor: "166 98% 34%",
  logoUrl: "https://cngslbtadxahipmuwftu.supabase.co/storage/v1/object/public/imagens/logos_camaleon/logo_branca_transp.png",
  faviconUrl: "https://cngslbtadxahipmuwftu.supabase.co/storage/v1/object/public/imagens/logos_camaleon/fav_icon.webp",
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [config, setConfig] = useState<ThemeConfig>(() => {
    const saved = localStorage.getItem("leon-theme-config");
    if (!saved) {
      return defaultConfig;
    }

    try {
      const parsedConfig = JSON.parse(saved) as Partial<ThemeConfig>;
      const sanitizedDarkMode =
        typeof parsedConfig.darkMode === "boolean"
          ? parsedConfig.darkMode
          : defaultConfig.darkMode;
      const sanitizedLogoUrl =
        typeof parsedConfig.logoUrl === "string" && parsedConfig.logoUrl.trim() !== ""
          ? parsedConfig.logoUrl
          : defaultConfig.logoUrl;
      const sanitizedFaviconUrl =
        typeof parsedConfig.faviconUrl === "string" && parsedConfig.faviconUrl.trim() !== ""
          ? parsedConfig.faviconUrl
          : defaultConfig.faviconUrl;

      return {
        ...defaultConfig,
        ...parsedConfig,
        darkMode: sanitizedDarkMode,
        logoUrl: sanitizedLogoUrl,
        faviconUrl: sanitizedFaviconUrl,
      } as ThemeConfig;
    } catch (error) {
      console.error("Erro ao analisar configurações salvas:", error);
      return defaultConfig;
    }
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
    document.documentElement.style.setProperty("--sidebar-background", config.primaryColor);
    document.documentElement.style.setProperty(
      "--sidebar-accent",
      adjustHslLightness(config.primaryColor, 8)
    );
    document.documentElement.style.setProperty(
      "--sidebar-border",
      adjustHslLightness(config.primaryColor, -12)
    );
    document.documentElement.style.setProperty("--sidebar-ring", config.secondaryColor);

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

      if (data?.value && typeof data.value === "object" && "primary" in data.value && "secondary" in data.value) {
        setConfig((prev) => ({
          ...prev,
          primaryColor: (data.value as any).primary || prev.primaryColor,
          secondaryColor: (data.value as any).secondary || prev.secondaryColor,
        }));
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      await logger.error("Erro ao carregar configurações globais", "CONFIG_LOAD_ERROR", {
        errorMessage,
        errorStack,
      });
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
      await logger.success("Configurações globais de tema atualizadas", {
        primaryColor: config.primaryColor,
        secondaryColor: config.secondaryColor,
      });
      toast.success("Cores padrão salvas para todos os usuários!");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      await logger.error("Erro ao salvar configurações globais", "CONFIG_SAVE_ERROR", {
        errorMessage,
        errorStack,
        primaryColor: config.primaryColor,
        secondaryColor: config.secondaryColor,
      });
      toast.error("Erro ao salvar configurações globais: " + errorMessage);
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
