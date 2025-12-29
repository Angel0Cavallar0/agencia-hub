import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ThemeConfig {
  logoUrl: string;
  logoIconUrl: string;
  faviconUrl: string;
}

interface ThemeContextType extends ThemeConfig {
  refreshTheme: () => Promise<void>;
}

const defaultConfig: ThemeConfig = {
  logoUrl:
    "https://cngslbtadxahipmuwftu.supabase.co/storage/v1/object/public/imagens/logos_camaleon/logo_branca_transp.png",
  logoIconUrl:
    "https://cngslbtadxahipmuwftu.supabase.co/storage/v1/object/public/imagens/logos_camaleon/fav_icon_branca.png",
  faviconUrl:
    "https://cngslbtadxahipmuwftu.supabase.co/storage/v1/object/public/imagens/logos_camaleon/fav_icon.webp",
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const parseThemeSettings = (value: unknown): Partial<ThemeConfig> => {
  if (!value || typeof value !== "object") return {};

  const settings = value as Partial<ThemeConfig>;
  return {
    logoUrl: typeof settings.logoUrl === "string" ? settings.logoUrl : undefined,
    logoIconUrl: typeof settings.logoIconUrl === "string" ? settings.logoIconUrl : undefined,
    faviconUrl: typeof settings.faviconUrl === "string" ? settings.faviconUrl : undefined,
  };
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [config, setConfig] = useState<ThemeConfig>(() => {
    const saved = localStorage.getItem("client-theme-config");
    if (!saved) return defaultConfig;

    try {
      const parsed = JSON.parse(saved) as Partial<ThemeConfig>;
      return {
        logoUrl: parsed.logoUrl?.trim() ? parsed.logoUrl : defaultConfig.logoUrl,
        logoIconUrl: parsed.logoIconUrl?.trim() ? parsed.logoIconUrl : defaultConfig.logoIconUrl,
        faviconUrl: parsed.faviconUrl?.trim() ? parsed.faviconUrl : defaultConfig.faviconUrl,
      };
    } catch {
      return defaultConfig;
    }
  });

  const refreshTheme = async () => {
    const { data, error } = await supabase
      .from("global_settings")
      .select("key, value")
      .in("key", ["theme_settings"]);

    if (error) {
      console.error("Erro ao carregar configurações de tema:", error);
      return;
    }

    const themeSettings = data?.find((item) => item.key === "theme_settings");
    const parsedSettings = parseThemeSettings(themeSettings?.value);

    setConfig((prev) => ({
      logoUrl: parsedSettings.logoUrl || prev.logoUrl,
      logoIconUrl: parsedSettings.logoIconUrl || prev.logoIconUrl,
      faviconUrl: parsedSettings.faviconUrl || prev.faviconUrl,
    }));
  };

  useEffect(() => {
    refreshTheme();
  }, []);

  useEffect(() => {
    localStorage.setItem("client-theme-config", JSON.stringify(config));

    if (config.faviconUrl) {
      const link =
        (document.querySelector("link[rel*='icon']") as HTMLLinkElement) ||
        document.createElement("link");
      link.type = "image/x-icon";
      link.rel = "shortcut icon";
      link.href = config.faviconUrl;
      document.getElementsByTagName("head")[0].appendChild(link);
    }
  }, [config]);

  return (
    <ThemeContext.Provider value={{ ...config, refreshTheme }}>
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
