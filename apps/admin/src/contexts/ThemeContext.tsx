import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

interface ThemeConfig {
  darkMode: boolean;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  logoIconUrl: string;
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
  setLogoIconUrl: (url: string) => void;
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
  logoIconUrl:
    "https://cngslbtadxahipmuwftu.supabase.co/storage/v1/object/public/imagens/logos_camaleon/fav_icon_branca.png",
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
      const sanitizedLogoIconUrl =
        typeof parsedConfig.logoIconUrl === "string" && parsedConfig.logoIconUrl.trim() !== ""
          ? parsedConfig.logoIconUrl
          : defaultConfig.logoIconUrl;
      const sanitizedFaviconUrl =
        typeof parsedConfig.faviconUrl === "string" && parsedConfig.faviconUrl.trim() !== ""
          ? parsedConfig.faviconUrl
          : defaultConfig.faviconUrl;

      return {
        ...defaultConfig,
        ...parsedConfig,
        darkMode: sanitizedDarkMode,
        logoUrl: sanitizedLogoUrl,
        logoIconUrl: sanitizedLogoIconUrl,
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

  const setLogoIconUrl = (url: string) => {
    setConfig((prev) => ({ ...prev, logoIconUrl: url }));
  };

  const setFaviconUrl = (url: string) => {
    setConfig((prev) => ({ ...prev, faviconUrl: url }));
  };

  const parseThemeSettings = (value: unknown): Partial<ThemeConfig> => {
    if (!value || typeof value !== "object") return {};

    const settings = value as Partial<ThemeConfig>;
    return {
      darkMode: typeof settings.darkMode === "boolean" ? settings.darkMode : undefined,
      primaryColor: typeof settings.primaryColor === "string" ? settings.primaryColor : undefined,
      secondaryColor: typeof settings.secondaryColor === "string" ? settings.secondaryColor : undefined,
      logoUrl: typeof settings.logoUrl === "string" ? settings.logoUrl : undefined,
      logoIconUrl: typeof settings.logoIconUrl === "string" ? settings.logoIconUrl : undefined,
      faviconUrl: typeof settings.faviconUrl === "string" ? settings.faviconUrl : undefined,
    };
  };

  const loadGlobalSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("global_settings")
        .select("key, value")
        .in("key", ["theme_settings", "theme_colors"]);

      if (error) throw error;

      const themeSettings = data?.find((item) => item.key === "theme_settings");
      const themeColors = data?.find((item) => item.key === "theme_colors");

      setConfig((prev) => {
        const parsedSettings = parseThemeSettings(themeSettings?.value);
        const parsedColors = parseThemeSettings(themeColors?.value);

        return {
          ...prev,
          darkMode: parsedSettings.darkMode ?? prev.darkMode,
          primaryColor: parsedSettings.primaryColor || parsedColors.primaryColor || prev.primaryColor,
          secondaryColor: parsedSettings.secondaryColor || parsedColors.secondaryColor || prev.secondaryColor,
          logoUrl: parsedSettings.logoUrl || prev.logoUrl,
          logoIconUrl: parsedSettings.logoIconUrl || prev.logoIconUrl,
          faviconUrl: parsedSettings.faviconUrl || prev.faviconUrl,
        };
      });
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
      const { error } = await supabase.from("global_settings").upsert([
        {
          key: "theme_settings",
          value: {
            darkMode: config.darkMode,
            primaryColor: config.primaryColor,
            secondaryColor: config.secondaryColor,
            logoUrl: config.logoUrl,
            logoIconUrl: config.logoIconUrl,
            faviconUrl: config.faviconUrl,
          },
        },
        {
          key: "theme_colors",
          value: {
            primary: config.primaryColor,
            secondary: config.secondaryColor,
          },
        },
      ]);

      if (error) throw error;
      await logger.success("Configurações globais de tema atualizadas", {
        primaryColor: config.primaryColor,
        secondaryColor: config.secondaryColor,
        darkMode: config.darkMode,
        logoUrl: config.logoUrl,
        logoIconUrl: config.logoIconUrl,
        faviconUrl: config.faviconUrl,
      });
      toast.success("Configurações salvas como padrão para todos os usuários!");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      await logger.error("Erro ao salvar configurações globais", "CONFIG_SAVE_ERROR", {
        errorMessage,
        errorStack,
        primaryColor: config.primaryColor,
        secondaryColor: config.secondaryColor,
        darkMode: config.darkMode,
        logoUrl: config.logoUrl,
        logoIconUrl: config.logoIconUrl,
        faviconUrl: config.faviconUrl,
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
        setLogoIconUrl,
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
