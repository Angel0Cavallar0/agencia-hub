import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const EnvWarning = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl border-destructive">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <CardTitle className="text-destructive">Variáveis de Ambiente Não Configuradas</CardTitle>
          </div>
          <CardDescription>
            A aplicação não pode funcionar sem as credenciais do Supabase
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Para que a aplicação funcione corretamente, você precisa configurar as seguintes variáveis de ambiente:
          </p>

          <div className="rounded-md bg-muted p-4 font-mono text-sm">
            <div>VITE_SUPABASE_URL</div>
            <div>VITE_SUPABASE_ANON_KEY</div>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-sm">Se você está usando Vercel:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Acesse o painel do projeto no Vercel</li>
              <li>Vá em Settings → Environment Variables</li>
              <li>Adicione as variáveis acima com os valores do seu projeto Supabase</li>
              <li>Faça um novo deploy ou aguarde o redeploy automático</li>
            </ol>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-sm">Para desenvolvimento local:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Copie o arquivo <code className="bg-muted px-1 rounded">.env.example</code> para <code className="bg-muted px-1 rounded">.env</code></li>
              <li>Preencha os valores com as credenciais do seu projeto Supabase</li>
              <li>Reinicie o servidor de desenvolvimento</li>
            </ol>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Você pode encontrar essas credenciais no painel do Supabase em:
              <br />
              <span className="font-mono">Project Settings → API</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
