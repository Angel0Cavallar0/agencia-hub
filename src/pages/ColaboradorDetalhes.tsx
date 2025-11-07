import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function ColaboradorDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [colaborador, setColaborador] = useState<any>(null);
  const [privateData, setPrivateData] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchColaborador();
      if (userRole === "admin") {
        fetchPrivateData();
      }
    }
  }, [id, userRole]);

  const fetchColaborador = async () => {
    const { data, error } = await supabase
      .from("colaborador")
      .select("*")
      .eq("id_colaborador", id)
      .single();

    if (error) {
      console.error("Erro ao buscar colaborador:", error);
      toast.error("Erro ao carregar colaborador");
      return;
    }

    setColaborador(data);
  };

  const fetchPrivateData = async () => {
    const { data, error } = await supabase
      .from("colaborador_private")
      .select("*")
      .eq("id_colaborador", id)
      .maybeSingle();

    if (error) {
      console.error("Erro ao buscar dados privados:", error);
      return;
    }

    setPrivateData(data || {
      email_pessoal: "",
      whatsapp: "",
      data_aniversario: "",
    });
  };

  const handleUpdateColaborador = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error: colaboradorError } = await supabase
        .from("colaborador")
        .update(colaborador)
        .eq("id_colaborador", id);

      if (colaboradorError) throw colaboradorError;

      if (userRole === "admin" && privateData) {
        const { error: privateError } = await supabase
          .from("colaborador_private")
          .upsert({
            id_colaborador: id,
            ...privateData,
          });

        if (privateError) {
          console.error("Erro ao atualizar dados privados:", privateError);
          toast.error("Colaborador atualizado, mas houve erro nos dados privados");
        }
      }

      toast.success("Colaborador atualizado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao atualizar colaborador:", error);
      toast.error(error.message || "Erro ao atualizar colaborador");
    } finally {
      setLoading(false);
    }
  };

  if (!colaborador) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <form onSubmit={handleUpdateColaborador} className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => navigate("/colaboradores")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {colaborador.nome} {colaborador.sobrenome}
              </h1>
              <p className="text-muted-foreground">
                {colaborador.cargo || "Sem cargo definido"}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end lg:items-start">
            <Button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </div>

        <div
          className={`grid gap-6 ${
            userRole === "admin" && privateData
              ? "lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
              : ""
          }`}
        >
          <Card className="h-fit">
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
                    value={colaborador.nome || ""}
                    onChange={(e) =>
                      setColaborador({ ...colaborador, nome: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sobrenome">Sobrenome</Label>
                  <Input
                    id="sobrenome"
                    value={colaborador.sobrenome || ""}
                    onChange={(e) =>
                      setColaborador({ ...colaborador, sobrenome: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="apelido">Apelido</Label>
                  <Input
                    id="apelido"
                    value={colaborador.apelido || ""}
                    onChange={(e) =>
                      setColaborador({ ...colaborador, apelido: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cargo">Cargo</Label>
                  <Input
                    id="cargo"
                    value={colaborador.cargo || ""}
                    onChange={(e) =>
                      setColaborador({ ...colaborador, cargo: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email_corporativo">Email Corporativo</Label>
                <Input
                  id="email_corporativo"
                  type="email"
                  value={colaborador.email_corporativo || ""}
                  onChange={(e) =>
                    setColaborador({ ...colaborador, email_corporativo: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="id_clickup">ID ClickUp</Label>
                  <Input
                    id="id_clickup"
                    value={colaborador.id_clickup || ""}
                    onChange={(e) =>
                      setColaborador({ ...colaborador, id_clickup: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="id_slack">ID Slack</Label>
                  <Input
                    id="id_slack"
                    value={colaborador.id_slack || ""}
                    onChange={(e) =>
                      setColaborador({ ...colaborador, id_slack: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_admissao">Data de Admissão</Label>
                <Input
                  id="data_admissao"
                  type="date"
                  value={colaborador.data_admissao || ""}
                  onChange={(e) =>
                    setColaborador({ ...colaborador, data_admissao: e.target.value })
                  }
                />
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="colab_ativo">Colaborador Ativo</Label>
                  <Switch
                    id="colab_ativo"
                    checked={colaborador.colab_ativo}
                    onCheckedChange={(checked) =>
                      setColaborador({ ...colaborador, colab_ativo: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="colab_ferias">Em Férias</Label>
                  <Switch
                    id="colab_ferias"
                    checked={colaborador.colab_ferias}
                    onCheckedChange={(checked) =>
                      setColaborador({ ...colaborador, colab_ferias: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="colab_afastado">Afastado</Label>
                  <Switch
                    id="colab_afastado"
                    checked={colaborador.colab_afastado}
                    onCheckedChange={(checked) =>
                      setColaborador({ ...colaborador, colab_afastado: checked })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {userRole === "admin" && privateData && (
            <Card className="h-fit border-primary/20">
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
                    value={privateData.email_pessoal || ""}
                    onChange={(e) =>
                      setPrivateData({ ...privateData, email_pessoal: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    value={privateData.whatsapp || ""}
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
                    value={privateData.data_aniversario || ""}
                    onChange={(e) =>
                      setPrivateData({ ...privateData, data_aniversario: e.target.value })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </form>
    </Layout>
  );
}
