import { supabase } from "@/integrations/supabase/client";

export type LogLevel = "info" | "warning" | "error" | "success";

interface LogContext {
  endpoint?: string;
  payload?: any;
  errorStack?: string;
  userId?: string;
  [key: string]: any;
}

export const logger = {
  async log(
    level: LogLevel,
    message: string,
    code?: string,
    context?: LogContext
  ) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from("system_logs").insert({
        level,
        message,
        code,
        context: context || {},
        user_id: user?.id,
      });

      // Também logar no console em desenvolvimento
      if (import.meta.env.DEV) {
        const logMethod = level === "error" ? "error" : level === "warning" ? "warn" : "log";
        console[logMethod](`[${level.toUpperCase()}] ${message}`, { code, context });
      }
    } catch (error) {
      console.error("Erro ao gravar log:", error);
    }
  },

  info(message: string, context?: LogContext) {
    return this.log("info", message, undefined, context);
  },

  success(message: string, context?: LogContext) {
    return this.log("success", message, undefined, context);
  },

  warning(message: string, code?: string, context?: LogContext) {
    return this.log("warning", message, code, context);
  },

  error(message: string, code: string, context?: LogContext) {
    return this.log("error", message, code, context);
  },
};
