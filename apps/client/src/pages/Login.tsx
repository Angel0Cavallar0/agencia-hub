import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigate } from "react-router-dom";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, user } = useAuth();
  const { logoUrl } = useTheme();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signIn(email, password);
    } catch (error) {
      console.error("Erro ao fazer login:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#080D1D] px-4">
      <Card className="relative w-full max-w-md border-white/10 bg-zinc-900/60 text-white shadow-xl backdrop-blur-xl">
        <CardHeader className="space-y-5 text-center">
          <div className="flex justify-center">
            <img
              src={logoUrl}
              alt="Logo Camaleon"
              className="h-12 w-auto drop-shadow-lg"
            />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-semibold text-white">Bem-vindo</CardTitle>
            <CardDescription className="text-base text-white/70">
              Entre com suas credenciais para acessar sua conta
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-white">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="border-white/20 bg-white/10 text-white placeholder:text-white/60 focus-visible:border-emerald-400 focus-visible:ring-emerald-400 focus-visible:ring-offset-0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-white">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="new-password"
                data-lpignore="true"
                className="border-white/20 bg-white/10 text-white placeholder:text-white/60 focus-visible:border-emerald-400 focus-visible:ring-emerald-400 focus-visible:ring-offset-0"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-emerald-600 text-white transition-colors hover:bg-emerald-500"
              disabled={isLoading}
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
