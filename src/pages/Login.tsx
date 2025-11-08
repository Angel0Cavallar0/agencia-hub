import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import camaleonLogo from "@/assets/camaleon-logo.svg";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showUserNotFoundModal, setShowUserNotFoundModal] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(email, password);
      toast.success("Login realizado com sucesso!");
    } catch (error: any) {
      const message = error?.message || "Erro ao fazer login";
      const normalizedMessage = message.toLowerCase();
      const shouldShowUserNotFoundModal =
        error?.status === 400 ||
        normalizedMessage.includes("invalid login credentials") ||
        normalizedMessage.includes("invalid email or password");

      if (shouldShowUserNotFoundModal) {
        setShowUserNotFoundModal(true);
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center px-4"
      style={{
        background:
          "radial-gradient(circle at center, rgba(13,148,136,0.45) 0%, rgba(12,74,110,0.85) 45%, rgba(2,6,23,0.95) 100%)",
      }}
    >
      <div className="absolute inset-0 bg-black/40" aria-hidden />
      <Card className="relative w-full max-w-md border-white/10 bg-white/10 text-white shadow-xl backdrop-blur-xl">
        <CardHeader className="space-y-5 text-center">
          <div className="flex justify-center">
            <img
              src={camaleonLogo}
              alt="Logo Camaleon"
              className="h-12 w-auto drop-shadow-lg"
            />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-semibold text-white">Bem-vindo</CardTitle>
            <CardDescription className="text-base text-white/70">
              Entre com suas credenciais para acessar o painel
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
                disabled={loading}
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
                disabled={loading}
                className="border-white/20 bg-white/10 text-white placeholder:text-white/60 focus-visible:border-emerald-400 focus-visible:ring-emerald-400 focus-visible:ring-offset-0"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-emerald-600 text-white transition-colors hover:bg-emerald-500"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Dialog open={showUserNotFoundModal} onOpenChange={setShowUserNotFoundModal}>
        <DialogContent className="sm:max-w-lg border-white/10 bg-slate-900 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">Usuário não encontrado</DialogTitle>
            <DialogDescription className="text-white/70">
              Parece que você ainda não possui acesso ao painel. Solicite autorização a um administrador
              para continuar.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button
              type="button"
              onClick={() => setShowUserNotFoundModal(false)}
              className="min-w-[120px] bg-emerald-600 text-white hover:bg-emerald-500"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
