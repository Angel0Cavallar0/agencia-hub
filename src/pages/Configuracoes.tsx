import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "@/contexts/ThemeContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { toast } from "sonner";

type AccessLevel = "admin" | "gerente" | "supervisor" | "assistente" | "geral";

const accessLevelOptions: { value: AccessLevel; label: string; description: string }[] = [
  {
    value: "admin",
    label: "Administrador",
    description: "Acesso total ao sistema, incluindo a página de configuração.",
  },
  {
    value: "gerente",
    label: "Gerente",
    description:
      "Acesso amplo, sem a página de configuração. Pode ver dados sensíveis e editar informações críticas controladas.",
  },
  {
    value: "supervisor",
    label: "Supervisor",
    description: "Pode visualizar informações sensíveis dos colaboradores, porém sem permissão de edição.",
  },
  {
    value: "assistente",
    label: "Assistente",
    description:
      "Uso operacional do sistema, WhatsApp e CRM (se liberados), sem acesso a dados sensíveis ou edição de registros.",
  },
  {
    value: "geral",
    label: "Geral",
    description:
      "Acesso restrito às próprias informações e a rotinas essenciais. Ideal para perfis com permissões mais básicas.",
  },
];

const defaultAllowedAccessLevels: AccessLevel[] = ["admin", "supervisor"];

export default function Configuracoes() {
  const DEFAULT_N8N_URL = "https://n8n.camaleon.com.br/";
  const normalizeN8nUrl = (url: string) => {
    if (!url) return DEFAULT_N8N_URL;
    try {
      return new URL(url).toString();
    } catch (error) {
      try {
        return new URL(`https://${url}`).toString();
      } catch {
        return DEFAULT_N8N_URL;
      }
    }
  };

  const {
    darkMode,
    setDarkMode,
    primaryColor, 
    setPrimaryColor, 
    secondaryColor,
    setSecondaryColor,
    logoUrl, 
    setLogoUrl, 
    logoIconUrl,
    setLogoIconUrl,
    faviconUrl,
    setFaviconUrl,
    saveAsGlobal
  } = useTheme();
  const [tempLogoUrl, setTempLogoUrl] = useState(logoUrl);
  const [tempLogoIconUrl, setTempLogoIconUrl] = useState(logoIconUrl);
  const [tempFaviconUrl, setTempFaviconUrl] = useState(faviconUrl);
  const [whatsappWebhook, setWhatsappWebhook] = useState(
    () => localStorage.getItem("whatsapp-webhook-url") || ""
  );
  const [isLoadingWebhook, setIsLoadingWebhook] = useState(true);
  const [isSavingWebhook, setIsSavingWebhook] = useState(false);
  const [n8nUrl, setN8nUrl] = useState(
    () =>
      (typeof window !== "undefined"
        ? normalizeN8nUrl(localStorage.getItem("n8n-url") || DEFAULT_N8N_URL)
        : DEFAULT_N8N_URL)
  );
  const [isLoadingN8nUrl, setIsLoadingN8nUrl] = useState(true);
  const [isSavingN8nUrl, setIsSavingN8nUrl] = useState(false);
  const [allowedAccessLevels, setAllowedAccessLevels] = useState<AccessLevel[]>(
    defaultAllowedAccessLevels
  );
  const [isLoadingAccessLevels, setIsLoadingAccessLevels] = useState(true);
  const [isSavingAccessLevels, setIsSavingAccessLevels] = useState(false);

  const normalizeRole = (role: unknown): AccessLevel | null => {
    if (typeof role !== "string") return null;
    const normalized = role.trim().toLowerCase();
    return accessLevelOptions.find((option) => option.value === normalized)?.value ?? null;
  };

  useEffect(() => {
    const loadWebhook = async () => {
      try {
        const { data, error } = await supabase
          .from("global_settings")
          .select("value")
          .eq("key", "whatsapp_webhook")
          .maybeSingle();

        if (error) throw error;

        const webhookValue = (() => {
          if (typeof data?.value === "string") return data.value;
          if (
            data?.value &&
            typeof data.value === "object" &&
            "url" in data.value &&
            typeof (data.value as { url?: unknown }).url === "string"
          ) {
            return (data.value as { url: string }).url;
          }
          return "";
        })();

        if (webhookValue) {
          setWhatsappWebhook(webhookValue);
          localStorage.setItem("whatsapp-webhook-url", webhookValue);
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;

        await logger.error("Erro ao carregar webhook global", "WHATSAPP_WEBHOOK_LOAD", {
          errorMessage,
          errorStack,
        });
        toast.error("Não foi possível carregar o webhook padrão");
      } finally {
        setIsLoadingWebhook(false);
      }
    };

    loadWebhook();
  }, []);

  useEffect(() => {
    const loadN8nUrl = async () => {
      const storedUrl = localStorage.getItem("n8n-url");
      if (storedUrl) {
        setN8nUrl(storedUrl);
        setIsLoadingN8nUrl(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("global_settings")
          .select("value")
          .eq("key", "n8n_url")
          .maybeSingle();

        if (error) throw error;

        const resolvedUrl =
          typeof data?.value === "string"
            ? normalizeN8nUrl(data.value)
            : data?.value &&
                typeof data.value === "object" &&
                "url" in data.value &&
                typeof (data.value as { url?: unknown }).url === "string"
              ? normalizeN8nUrl((data.value as { url: string }).url)
              : DEFAULT_N8N_URL;

        const sanitizedUrl = normalizeN8nUrl(resolvedUrl);
        setN8nUrl(sanitizedUrl);
        localStorage.setItem("n8n-url", sanitizedUrl);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;

        await logger.error("Erro ao carregar URL do n8n", "N8N_URL_LOAD", {
          errorMessage,
          errorStack,
        });
        toast.error("Não foi possível carregar o link do n8n");
      } finally {
        setIsLoadingN8nUrl(false);
      }
    };

    loadN8nUrl();
  }, []);

  useEffect(() => {
    const parseAccessLevels = (value: unknown): AccessLevel[] => {
      const normalizeArray = (input: unknown): AccessLevel[] => {
        if (!Array.isArray(input)) return [];

        const normalized = input
          .map((item) => normalizeRole(item))
          .filter((item): item is AccessLevel => Boolean(item));

        return Array.from(new Set(normalized));
      };

      const stringValue = typeof value === "string" ? value.trim() : null;

      if (stringValue) {
        try {
          const parsed = JSON.parse(stringValue);
          const parsedArray = normalizeArray(parsed);
          if (parsedArray.length) return parsedArray;
        } catch {
          const splitValues = stringValue
            .split(",")
            .map((item) => normalizeRole(item))
            .filter((item): item is AccessLevel => Boolean(item));

          if (splitValues.length) return Array.from(new Set(splitValues));
        }
      }

      const arrayValues = normalizeArray(value);
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

        const normalizedFromObject = normalizeArray(maybeRoles);
        if (normalizedFromObject.length) return normalizedFromObject;
      }

      return [];
    };

    const loadAllowedAccessLevels = async () => {
      try {
        const { data, error } = await supabase
          .from("global_settings")
          .select("key, value")
          .in("key", ["allowed_access_levels", "min_access_level"]);

        if (error) throw error;

        const allowedSetting = data?.find((item) => item.key === "allowed_access_levels");
        const minSetting = data?.find((item) => item.key === "min_access_level");

        const resolvedLevels =
          (allowedSetting && parseAccessLevels(allowedSetting.value)) ||
          (minSetting && parseAccessLevels(minSetting.value)) ||
          defaultAllowedAccessLevels;

        setAllowedAccessLevels(resolvedLevels);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;

        await logger.error("Erro ao carregar perfis com acesso", "ACCESS_LEVEL_LOAD", {
          errorMessage,
          errorStack,
        });
        toast.error("Não foi possível carregar as permissões de acesso");
        setAllowedAccessLevels(defaultAllowedAccessLevels);
      } finally {
        setIsLoadingAccessLevels(false);
      }
    };

    loadAllowedAccessLevels();
  }, []);

  const handleSaveUrls = () => {
    setLogoUrl(tempLogoUrl);
    setLogoIconUrl(tempLogoIconUrl);
    setFaviconUrl(tempFaviconUrl);
    toast.success("Configurações salvas com sucesso!");
  };

  const hslToHex = (hsl: string): string => {
    const [h, s, l] = hsl.split(" ").map((v) => parseFloat(v));
    const hDecimal = h / 360;
    const sDecimal = s / 100;
    const lDecimal = l / 100;
    
    const c = (1 - Math.abs(2 * lDecimal - 1)) * sDecimal;
    const x = c * (1 - Math.abs(((hDecimal * 6) % 2) - 1));
    const m = lDecimal - c / 2;
    
    let r = 0, g = 0, b = 0;
    if (hDecimal < 1/6) { r = c; g = x; b = 0; }
    else if (hDecimal < 2/6) { r = x; g = c; b = 0; }
    else if (hDecimal < 3/6) { r = 0; g = c; b = x; }
    else if (hDecimal < 4/6) { r = 0; g = x; b = c; }
    else if (hDecimal < 5/6) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    
    const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  const hexToHsl = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">Personalize o sistema conforme as necessidades da sua equipe</p>
        </div>

        <Tabs defaultValue="appearance" className="space-y-6">
          <TabsList>
            <TabsTrigger value="appearance">Aparência</TabsTrigger>
            <TabsTrigger value="organizational">Organização</TabsTrigger>
            <TabsTrigger value="access">Acesso</TabsTrigger>
            <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
            <TabsTrigger value="n8n">n8n</TabsTrigger>
          </TabsList>

          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Aparência</CardTitle>
                <CardDescription>
                  Centralize as definições de identidade visual, cores e tema do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium">Identidade Visual</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure a logo e o favicon exibidos na plataforma
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="logo">URL da Logo</Label>
                      <Input
                        id="logo"
                        placeholder="https://exemplo.com/logo.png"
                        value={tempLogoUrl}
                        onChange={(e) => setTempLogoUrl(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="favicon">URL do Favicon</Label>
                      <Input
                        id="favicon"
                        placeholder="https://exemplo.com/favicon.ico"
                        value={tempFaviconUrl}
                        onChange={(e) => setTempFaviconUrl(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="logo-icon">URL do Ícone da Logo</Label>
                      <Input
                        id="logo-icon"
                        placeholder="https://exemplo.com/icon.png"
                        value={tempLogoIconUrl}
                        onChange={(e) => setTempLogoIconUrl(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleSaveUrls}>Salvar URLs</Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium">Cores do Tema</h3>
                    <p className="text-sm text-muted-foreground">
                      Personalize a paleta primária e secundária utilizada na interface
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Cor Primária</Label>
                      <div className="flex items-center gap-4">
                        <Input
                          type="color"
                          value={hslToHex(primaryColor)}
                          onChange={(e) => setPrimaryColor(hexToHsl(e.target.value))}
                          className="w-20 h-10"
                        />
                        <Input
                          value={hslToHex(primaryColor)}
                          onChange={(e) => {
                            if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                              setPrimaryColor(hexToHsl(e.target.value));
                            }
                          }}
                          placeholder="#096B68"
                          className="w-32"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Cor Secundária</Label>
                      <div className="flex items-center gap-4">
                        <Input
                          type="color"
                          value={hslToHex(secondaryColor)}
                          onChange={(e) => setSecondaryColor(hexToHsl(e.target.value))}
                          className="w-20 h-10"
                        />
                        <Input
                          value={hslToHex(secondaryColor)}
                          onChange={(e) => {
                            if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                              setSecondaryColor(hexToHsl(e.target.value));
                            }
                          }}
                          placeholder="#129990"
                          className="w-32"
                        />
                      </div>
                    </div>
                  </div>
                  <Button onClick={saveAsGlobal} variant="outline">
                    Salvar como padrão para todos os usuários
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium">Tema</h3>
                    <p className="text-sm text-muted-foreground">
                      Escolha entre modo claro ou escuro conforme a preferência
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="dark-mode">Modo Escuro</Label>
                    <Switch
                      id="dark-mode"
                      checked={darkMode}
                      onCheckedChange={setDarkMode}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="organizational">
            <Card>
              <CardHeader>
                <CardTitle>Organização</CardTitle>
                <CardDescription>Defina preferências administrativas e padrões da empresa</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Em breve você poderá configurar preferências organizacionais como nomenclatura de equipes e fluxos de aprovação.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="access">
            <Card>
              <CardHeader>
                <CardTitle>Controle de acesso ao sistema</CardTitle>
                <CardDescription>
                  Escolha quais níveis de acesso podem entrar no sistema. Perfis desmarcados serão bloqueados ao validar
                  <code className="mx-1 rounded bg-muted px-1 py-0.5 text-xs">user_roles.role</code> no login.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Perfis autorizados a acessar o sistema</Label>
                    <p className="text-sm text-muted-foreground">
                      Marque todos os níveis que podem fazer login. Qualquer nível desmarcado terá o acesso negado
                      automaticamente ao comparar com o valor de <code className="mx-1 rounded bg-muted px-1 py-0.5 text-xs">user_roles.role</code>.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isLoadingAccessLevels
                        ? "Carregando permissões salvas..."
                        : `Perfis liberados: ${allowedAccessLevels.length}`}
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {accessLevelOptions.map((option) => {
                      const isSelected = allowedAccessLevels.includes(option.value);

                      return (
                        <label
                          key={option.value}
                          className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition hover:border-primary ${
                            isSelected ? "border-primary bg-primary/5" : ""
                          }`}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() =>
                              setAllowedAccessLevels((current) =>
                                current.includes(option.value)
                                  ? current.filter((value) => value !== option.value)
                                  : [...current, option.value]
                              )
                            }
                            disabled={isLoadingAccessLevels || isSavingAccessLevels}
                          />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold">{option.label}</p>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                  isSelected
                                    ? "bg-primary/10 text-primary"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {isSelected ? "Acesso liberado" : "Sem acesso"}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">{option.description}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                    <p className="text-xs text-muted-foreground">
                      Selecione ao menos um nível antes de salvar.
                    </p>
                    <Button
                      onClick={async () => {
                        if (!allowedAccessLevels.length) {
                          toast.error("Selecione pelo menos um nível para liberar o acesso.");
                          return;
                        }

                        setIsSavingAccessLevels(true);
                        try {
                          const { error } = await supabase.from("global_settings").upsert({
                            key: "allowed_access_levels",
                            value: allowedAccessLevels,
                          });

                          if (error) throw error;

                          await logger.success("Perfis com acesso atualizados", {
                            accessLevels: allowedAccessLevels,
                          });
                          toast.success("Perfis autorizados atualizados para todos os usuários!");
                        } catch (error: unknown) {
                          const errorMessage = error instanceof Error ? error.message : String(error);
                          const errorStack = error instanceof Error ? error.stack : undefined;

                          await logger.error("Erro ao salvar perfis com acesso", "ACCESS_LEVEL_SAVE", {
                            errorMessage,
                            errorStack,
                            accessLevels: allowedAccessLevels,
                          });
                          toast.error("Erro ao salvar as permissões: " + errorMessage);
                        } finally {
                          setIsSavingAccessLevels(false);
                        }
                      }}
                      disabled={isSavingAccessLevels || isLoadingAccessLevels}
                    >
                      {isSavingAccessLevels ? "Salvando..." : "Salvar perfis permitidos"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="whatsapp">
            <Card>
              <CardHeader>
                <CardTitle>Integração com WhatsApp</CardTitle>
                <CardDescription>
                  Configure o webhook usado para receber os dados das mensagens respondidas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="webhook">URL do Webhook</Label>
                  <Input
                    id="webhook"
                    placeholder="https://meuservico.com/webhook"
                    disabled={isLoadingWebhook}
                    value={whatsappWebhook}
                    onChange={(e) => setWhatsappWebhook(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    A URL será chamada com os dados da mensagem original e da resposta enviada.
                  </p>
                </div>
                <Button
                  disabled={isSavingWebhook}
                  onClick={async () => {
                    setIsSavingWebhook(true);
                    try {
                      const { error } = await supabase.from("global_settings").upsert({
                        key: "whatsapp_webhook",
                        value: whatsappWebhook,
                      });

                      if (error) throw error;

                      localStorage.setItem("whatsapp-webhook-url", whatsappWebhook);
                      await logger.success("Webhook global atualizado", { webhook: whatsappWebhook });
                      toast.success("Webhook salvo como padrão para todos os usuários!");
                    } catch (error: unknown) {
                      const errorMessage = error instanceof Error ? error.message : String(error);
                      const errorStack = error instanceof Error ? error.stack : undefined;

                      await logger.error("Erro ao salvar webhook global", "WHATSAPP_WEBHOOK_SAVE", {
                        errorMessage,
                        errorStack,
                        webhook: whatsappWebhook,
                      });
                      toast.error("Erro ao salvar webhook padrão: " + errorMessage);
                    } finally {
                      setIsSavingWebhook(false);
                    }
                  }}
                >
                  {isSavingWebhook ? "Salvando..." : "Salvar webhook padrão"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="n8n">
            <Card>
              <CardHeader>
                <CardTitle>Integração com n8n</CardTitle>
                <CardDescription>Atualize o link carregado no navegador interno.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="n8n-url">URL do n8n</Label>
                  <Input
                    id="n8n-url"
                    placeholder="https://n8n.camaleon.com.br/"
                    disabled={isLoadingN8nUrl}
                    value={n8nUrl}
                    onChange={(e) => setN8nUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Este link será usado para abrir o n8n dentro do painel, preservando o mesmo controle de acesso.
                  </p>
                </div>
                <Button
                  disabled={isSavingN8nUrl}
                  onClick={async () => {
                    const sanitizedUrl = normalizeN8nUrl(n8nUrl);
                    setIsSavingN8nUrl(true);
                    try {
                      const { error } = await supabase.from("global_settings").upsert({
                        key: "n8n_url",
                        value: sanitizedUrl,
                      });

                      if (error) throw error;

                      localStorage.setItem("n8n-url", sanitizedUrl);
                      setN8nUrl(sanitizedUrl);
                      await logger.success("URL do n8n atualizada", { url: sanitizedUrl });
                      toast.success("Link do n8n salvo como padrão!");
                    } catch (error: unknown) {
                      const errorMessage = error instanceof Error ? error.message : String(error);
                      const errorStack = error instanceof Error ? error.stack : undefined;

                      await logger.error("Erro ao salvar URL do n8n", "N8N_URL_SAVE", {
                        errorMessage,
                        errorStack,
                        url: sanitizedUrl,
                      });
                      toast.error(
                        "Erro ao salvar link do n8n: " + errorMessage +
                          (sanitizedUrl !== n8nUrl
                            ? " (ajustado para " + sanitizedUrl + ")"
                            : "")
                      );
                    } finally {
                      setIsSavingN8nUrl(false);
                    }
                  }}
                >
                  {isSavingN8nUrl ? "Salvando..." : "Salvar link"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
