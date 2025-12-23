import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type LogLevel = "info" | "warning" | "error" | "success";

interface SystemLog {
  id: string;
  timestamp: string;
  level: LogLevel;
  code: string | null;
  message: string;
  user_id: string | null;
}

export default function Logs() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<LogLevel | "all">("all");
  const [contextCache, setContextCache] = useState<Record<string, unknown>>({});
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});
  const [loadingContextId, setLoadingContextId] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("system_logs")
        .select("id, timestamp, level, code, message, user_id")
        .order("timestamp", { ascending: false })
        .limit(200);

      if (filter !== "all") {
        query = query.eq("level", filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs((data || []) as SystemLog[]);
      setExpandedLogs({});
      setContextCache({});
    } catch (error: any) {
      toast.error("Erro ao carregar logs: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleContext = async (logId: string) => {
    if (expandedLogs[logId]) {
      setExpandedLogs((prev) => ({ ...prev, [logId]: false }));
      return;
    }

    setExpandedLogs((prev) => ({ ...prev, [logId]: true }));

    if (Object.prototype.hasOwnProperty.call(contextCache, logId)) {
      return;
    }

    setLoadingContextId(logId);
    const { data, error } = await supabase
      .from("system_logs")
      .select("context")
      .eq("id", logId)
      .single();
    setLoadingContextId(null);

    if (error) {
      setExpandedLogs((prev) => ({ ...prev, [logId]: false }));
      toast.error("Erro ao carregar contexto do log");
      return;
    }

    setContextCache((prev) => ({ ...prev, [logId]: data?.context ?? null }));
  };

  const getBadgeVariant = (level: LogLevel) => {
    switch (level) {
      case "error":
        return "destructive";
      case "warning":
        return "secondary";
      case "success":
        return "default";
      default:
        return "outline";
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Logs do Sistema</h1>
          <p className="text-muted-foreground">
            Registro completo de ações e erros do sistema
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-md ${
              filter === "all" ? "bg-primary text-primary-foreground" : "bg-muted"
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter("error")}
            className={`px-4 py-2 rounded-md ${
              filter === "error" ? "bg-destructive text-destructive-foreground" : "bg-muted"
            }`}
          >
            Erros
          </button>
          <button
            onClick={() => setFilter("warning")}
            className={`px-4 py-2 rounded-md ${
              filter === "warning" ? "bg-secondary text-secondary-foreground" : "bg-muted"
            }`}
          >
            Avisos
          </button>
          <button
            onClick={() => setFilter("success")}
            className={`px-4 py-2 rounded-md ${
              filter === "success" ? "bg-primary text-primary-foreground" : "bg-muted"
            }`}
          >
            Sucesso
          </button>
          <button
            onClick={() => setFilter("info")}
            className={`px-4 py-2 rounded-md ${
              filter === "info" ? "bg-accent text-accent-foreground" : "bg-muted"
            }`}
          >
            Info
          </button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Últimos 200 registros</CardTitle>
            <CardDescription>Logs ordenados do mais recente ao mais antigo</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Carregando logs...</p>
            ) : logs.length === 0 ? (
              <p className="text-muted-foreground">Nenhum log encontrado.</p>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="border rounded-lg p-4 space-y-2 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={getBadgeVariant(log.level)}>
                            {log.level.toUpperCase()}
                          </Badge>
                          {log.code && (
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {log.code}
                            </code>
                          )}
                        </div>
                        <p className="font-medium">{log.message}</p>
                        <button
                          onClick={() => handleToggleContext(log.id)}
                          className="text-sm text-primary hover:underline"
                          type="button"
                          disabled={loadingContextId === log.id}
                        >
                          {expandedLogs[log.id]
                            ? "Ocultar contexto"
                            : loadingContextId === log.id
                            ? "Carregando contexto..."
                            : "Ver contexto"}
                        </button>
                        {expandedLogs[log.id] && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            {loadingContextId === log.id ? (
                              <p>Carregando contexto...</p>
                            ) : Object.prototype.hasOwnProperty.call(contextCache, log.id) ? (
                              contextCache[log.id] ? (
                                <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto text-left">
                                  {JSON.stringify(contextCache[log.id], null, 2)}
                                </pre>
                              ) : (
                                <p>Nenhum contexto adicional para este log.</p>
                              )
                            ) : null}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(log.timestamp), "dd/MM/yyyy HH:mm:ss", {
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
