import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type Colaborador = Database["public"]["Tables"]["colaborador"]["Row"];
type ColaboradorPrivate = Database["public"]["Tables"]["colaborador_private"]["Row"];

export default function ColaboradorDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const [loading, setLoading] = useState(false);
  type EditableColaborador = Pick<
    Colaborador,
    | "id_colaborador"
    | "nome"
    | "sobrenome"
    | "apelido"
    | "cargo"
    | "email_corporativo"
    | "id_clickup"
    | "id_slack"
    | "data_admissao"
    | "colab_ativo"
    | "colab_ferias"
    | "colab_afastado"
    | "admin"
    | "supervisor"
  >;
  type PrivateData = Pick<ColaboradorPrivate, "email_pessoal" | "whatsapp" | "data_aniversario">;

  const [colaborador, setColaborador] = useState<EditableColaborador | null>(null);
  const [privateData, setPrivateData] = useState<PrivateData | null>(null);
  const [role, setRole] = useState<"user" | "supervisor" | "admin">("user");

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
      .select(
        "id_colaborador, nome, sobrenome, apelido, cargo, email_corporativo, id_clickup, id_slack, data_admissao, colab_ativo, colab_ferias, colab_afastado, admin, supervisor"
      )
      .eq("id_colaborador", id)
      .single();

    if (error) {
      console.error("Erro ao buscar colaborador:", error);
      toast.error("Erro ao carregar colaborador");
      return;
    }

    if (data) {
      const colaboradorData = data as EditableColaborador;
      setColaborador(colaboradorData);
      setRole(colaboradorData.admin ? "admin" : colaboradorData.supervisor ? "supervisor" : "user");
    }
  };

  const fetchPrivateData = async () => {
    const { data, error } = await supabase
      .from("colaborador_private")
      .select("email_pessoal, whatsapp, data_aniversario")
      .eq("id_colaborador", id)
      .maybeSingle();

    if (error) {
      console.error("Erro ao buscar dados privados:", error);
      return;
    }

    setPrivateData(
      data || {
        email_pessoal: "",
        whatsapp: "",
        data_aniversario: "",
      }
    );
  };

  const handleUpdateColaborador = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!colaborador || !id) {
        throw new Error("Colaborador não encontrado");
      }

      const allowedFields = [
        "nome",
        "sobrenome",
        "apelido",
        "cargo",
        "email_corporativo",
        "id_clickup",
        "id_slack",
        "data_admissao",
        "colab_ativo",
        "colab_ferias",
        "colab_afastado",
      ] as const;

      const payload = allowedFields.reduce((acc, key) => {
        acc[key] = colaborador[key] ?? null;
        return acc;
      }, {} as Database["public"]["Tables"]["colaborador"]["Update"]);

      const { error: colaboradorError } = await supabase
        .from("colaborador")
        .update({
          ...payload,
          admin: role === "admin",
          supervisor: role === "supervisor",
        })
        .eq("id_colaborador", id);

      if (colaboradorError) throw colaboradorError;

      if (userRole === "admin" && privateData) {
        const { error: privateError } = await supabase
          .from("colaborador_private")
          .upsert({
            id_colaborador: id,
            email_pessoal: privateData.email_pessoal ?? null,
            whatsapp: privateData.whatsapp ?? null,
            data_aniversario: privateData.data_aniversario ?? null,
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
      <div className="space-y-6 w-full max-w-6xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/colaboradores")}>
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

        <form onSubmit={handleUpdateColaborador} className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
            <div className="space-y-6">
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
                          setColaborador({
                            ...colaborador,
                            sobrenome: e.target.value,
                          })
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
                        setColaborador({
                          ...colaborador,
                          email_corporativo: e.target.value,
                        })
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
                        setColaborador({
                          ...colaborador,
                          data_admissao: e.target.value,
                        })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Status do Colaborador</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
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
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Acesso e Permissões</CardTitle>
                  <CardDescription>
                    Defina o nível de acesso do colaborador
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <RadioGroup
                    value={role}
                    onValueChange={(value) => {
                      setRole(value as "user" | "supervisor" | "admin");
                      setColaborador({
                        ...colaborador,
                        admin: value === "admin",
                        supervisor: value === "supervisor",
                      });
                    }}
                  >
                    <div className="flex items-center space-x-3 rounded-lg border p-3">
                      <RadioGroupItem value="admin" id="admin" />
                      <div>
                        <Label htmlFor="admin" className="cursor-pointer">
                          Administrador
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Acesso completo a todas as seções e configurações.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 rounded-lg border p-3">
                      <RadioGroupItem value="supervisor" id="supervisor" />
                      <div>
                        <Label htmlFor="supervisor" className="cursor-pointer">
                          Supervisor
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Pode acompanhar equipes e clientes designados.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 rounded-lg border p-3">
                      <RadioGroupItem value="user" id="user" />
                      <div>
                        <Label htmlFor="user" className="cursor-pointer">
                          Usuário
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Acesso restrito às atividades do próprio colaborador.
                        </p>
                      </div>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {userRole === "admin" && privateData && (
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
                        value={privateData.email_pessoal || ""}
                        onChange={(e) =>
                          setPrivateData({
                            ...privateData,
                            email_pessoal: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">WhatsApp</Label>
                      <Input
                        id="whatsapp"
                        value={privateData.whatsapp || ""}
                        onChange={(e) =>
                          setPrivateData({
                            ...privateData,
                            whatsapp: e.target.value,
                          })
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
                          setPrivateData({
                            ...privateData,
                            data_aniversario: e.target.value,
                          })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </form>
      </div>
    </Layout>
  );
}
