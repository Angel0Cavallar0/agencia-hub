import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from "@/lib/logger";

export default function ColaboradorNovo() {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    sobrenome: "",
    apelido: "",
    cargo: "",
    email_corporativo: "",
    id_clickup: "",
    id_slack: "",
    data_admissao: "",
    colab_ativo: true,
    colab_ferias: false,
    colab_afastado: false,
    admin: false,
    supervisor: false,
  });

  const [privateData, setPrivateData] = useState({
    email_pessoal: "",
    whatsapp: "",
    data_aniversario: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: colaboradorData, error: colaboradorError } = await supabase
        .from("colaborador")
        .insert([formData])
        .select()
        .single();

      if (colaboradorError) throw colaboradorError;

      if (userRole === "admin" && (privateData.email_pessoal || privateData.whatsapp || privateData.data_aniversario)) {
        const { error: privateError } = await supabase
          .from("colaborador_private")
          .insert([{
            id_colaborador: colaboradorData.id_colaborador,
            ...privateData,
          }]);

       if (privateError) {
          await logger.warning("Erro ao salvar dados privados do colaborador", "COLAB_PRIVATE_ERROR", {
            errorMessage: privateError.message,
            colaboradorId: colaboradorData.id_colaborador,
          });
          toast.error("Colaborador criado, mas houve erro ao salvar dados privados");
        }
      }

      await logger.success("Colaborador criado com sucesso", {
        colaboradorId: colaboradorData.id_colaborador,
        nome: colaboradorData.nome,
      });

      toast.success("Colaborador criado com sucesso!");
      navigate(`/colaboradores/${colaboradorData.id_colaborador}`);
    } catch (error: any) {
      await logger.error("Erro ao criar colaborador", "COLAB_CREATE_ERROR", {
        errorMessage: error.message,
        errorStack: error.stack,
        formData,
      });
      toast.error(error.message || "Erro ao criar colaborador");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/colaboradores")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Novo Colaborador</h1>
            <p className="text-muted-foreground">Cadastre um novo membro da equipe</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Principais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sobrenome">Sobrenome</Label>
                  <Input
                    id="sobrenome"
                    value={formData.sobrenome}
                    onChange={(e) =>
                      setFormData({ ...formData, sobrenome: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="apelido">Apelido</Label>
                  <Input
                    id="apelido"
                    value={formData.apelido}
                    onChange={(e) => setFormData({ ...formData, apelido: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cargo">Cargo</Label>
                  <Input
                    id="cargo"
                    value={formData.cargo}
                    onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email_corporativo">Email Corporativo</Label>
                <Input
                  id="email_corporativo"
                  type="email"
                  value={formData.email_corporativo}
                  onChange={(e) =>
                    setFormData({ ...formData, email_corporativo: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="id_clickup">ID ClickUp</Label>
                  <Input
                    id="id_clickup"
                    value={formData.id_clickup}
                    onChange={(e) =>
                      setFormData({ ...formData, id_clickup: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="id_slack">ID Slack</Label>
                  <Input
                    id="id_slack"
                    value={formData.id_slack}
                    onChange={(e) => setFormData({ ...formData, id_slack: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_admissao">Data de Admissão</Label>
                <Input
                  id="data_admissao"
                  type="date"
                  value={formData.data_admissao}
                  onChange={(e) =>
                    setFormData({ ...formData, data_admissao: e.target.value })
                  }
                />
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="colab_ativo">Colaborador Ativo</Label>
                  <Switch
                    id="colab_ativo"
                    checked={formData.colab_ativo}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, colab_ativo: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="colab_ferias">Em Férias</Label>
                  <Switch
                    id="colab_ferias"
                    checked={formData.colab_ferias}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, colab_ferias: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="colab_afastado">Afastado</Label>
                  <Switch
                    id="colab_afastado"
                    checked={formData.colab_afastado}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, colab_afastado: checked })
                    }
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4 pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="admin"
                    checked={formData.admin}
                    onCheckedChange={(checked) => setFormData({ ...formData, admin: checked as boolean })}
                  />
                  <Label htmlFor="admin" className="cursor-pointer">
                    Administrador
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="supervisor"
                    checked={formData.supervisor}
                    onCheckedChange={(checked) => setFormData({ ...formData, supervisor: checked as boolean })}
                  />
                  <Label htmlFor="supervisor" className="cursor-pointer">
                    Supervisor
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {userRole === "admin" && (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle>Dados Sensíveis</CardTitle>
                <CardDescription>
                  Visível apenas para administradores
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email_pessoal">Email Pessoal</Label>
                  <Input
                    id="email_pessoal"
                    type="email"
                    value={privateData.email_pessoal}
                    onChange={(e) =>
                      setPrivateData({ ...privateData, email_pessoal: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    value={privateData.whatsapp}
                    onChange={(e) =>
                      setPrivateData({ ...privateData, whatsapp: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data_aniversario">Data de Aniversário</Label>
                  <Input
                    id="data_aniversario"
                    type="date"
                    value={privateData.data_aniversario}
                    onChange={(e) =>
                      setPrivateData({ ...privateData, data_aniversario: e.target.value })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Salvando..." : "Criar Colaborador"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/colaboradores")}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
