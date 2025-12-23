import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

const DEFAULT_N8N_URL = "https://n8n.camaleon.com.br/";
const STORAGE_KEY = "n8n-url";

const normalizeUrl = (url: string) => {
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

export default function N8N() {
  const [n8nUrl, setN8nUrl] = useState(DEFAULT_N8N_URL);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);

  const sanitizedUrl = useMemo(() => normalizeUrl(n8nUrl), [n8nUrl]);

  useEffect(() => {
    const loadUrl = async () => {
      const storedUrl = localStorage.getItem(STORAGE_KEY);
      if (storedUrl) {
        setN8nUrl(normalizeUrl(storedUrl));
        setIsLoading(false);
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
            ? normalizeUrl(data.value)
            : typeof (data?.value as { url?: string })?.url === "string"
              ? normalizeUrl((data?.value as { url?: string }).url)
              : DEFAULT_N8N_URL;

        setN8nUrl(resolvedUrl || DEFAULT_N8N_URL);
        localStorage.setItem(STORAGE_KEY, resolvedUrl || DEFAULT_N8N_URL);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;

        await logger.error("Erro ao carregar URL do n8n", "N8N_URL_LOAD", {
          errorMessage,
          errorStack,
        });
        toast.error("Não foi possível carregar o link do n8n. Usando o padrão.");
        setN8nUrl(DEFAULT_N8N_URL);
      } finally {
        setIsLoading(false);
      }
    };

    loadUrl();
  }, []);

  return (
    <Layout noPadding>
      <div className="relative flex h-full flex-col bg-background">
        <iframe
          key={sanitizedUrl}
          title="n8n"
          src={sanitizedUrl}
          className="h-full w-full border-0"
          allow="clipboard-write; encrypted-media; fullscreen; display-capture"
          allowFullScreen
          onLoad={() => setHasLoadError(false)}
          onError={() => {
            setHasLoadError(true);
            toast.error("Não foi possível carregar o n8n. Verifique se o link está correto.");
          }}
        />

        {!isLoading && hasLoadError && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/70">
            <div className="rounded-lg bg-muted/80 px-6 py-4 text-center shadow-lg">
              <p className="text-lg font-semibold">Falha ao abrir o n8n</p>
              <p className="text-sm text-muted-foreground">
                Confirme o endereço em Configurações &gt; n8n ou tente novamente mais tarde.
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
