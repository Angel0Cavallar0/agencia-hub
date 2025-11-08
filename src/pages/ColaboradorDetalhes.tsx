import { ChangeEvent, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  const [status, setStatus] = useState<"ativo" | "ferias" | "afastado">("ativo");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const statusOptions = [
    {
      value: "ativo" as const,
      label: "Ativo",
      description: "Colaborador trabalhando normalmente.",
    },
    {
      value: "ferias" as const,
      label: "Em Férias",
      description: "Colaborador em período de férias.",
    },
    {
      value: "afastado" as const,
      label: "Afastado",
      description: "Colaborador afastado temporariamente.",
    },
  ];

  const roleOptions = [
    {
      value: "admin" as const,
      label: "Administrador",
      description: "Acesso completo a todas as seções e configurações.",
    },
    {
      value: "supervisor" as const,
      label: "Supervisor",
      description: "Pode acompanhar equipes e clientes designados.",
    },
    {
      value: "user" as const,
      label: "Usuário",
      description: "Acesso restrito às atividades do próprio colaborador.",
    },
  ];

  useEffect(() => {
    if (id) {
      fetchColaborador();
      if (userRole === "admin") {
        fetchPrivateData();
      }
    }
  }, [id, userRole]);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview(null);
      return;
    }

    const previewUrl = URL.createObjectURL(photoFile);
    setPhotoPreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [photoFile]);

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
      setStatus(
        colaboradorData.colab_ferias
          ? "ferias"
          : colaboradorData.colab_afastado
          ? "afastado"
          : "ativo"
      );
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

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setPhotoFile(file);
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

  const collaboratorInitials = `${(colaborador.nome || "").charAt(0)}${(colaborador.sobrenome || "").charAt(0)}`
    .toUpperCase()
    .trim() || (colaborador.nome || "").charAt(0).toUpperCase();

  return (
    <Layout>
      <div className="w-full max-w-6xl space-y-6">
        <form onSubmit={handleUpdateColaborador} className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
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
            <Button type="submit" disabled={loading} className="min-w-[180px]">
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="order-1">
              <CardHeader>
                <CardTitle>Informações Principais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="foto_colaborador">Foto do Colaborador</Label>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-20 w-20 border border-muted bg-muted/40">
                        {photoPreview ? (
                          <AvatarImage src={photoPreview} alt={`Foto de ${colaborador.nome}`} />
                        ) : (
                          <AvatarFallback className="text-sm font-medium uppercase">
                            {collaboratorInitials || "?"}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <Input
                          id="foto_colaborador"
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                        />
                        {photoFile && (
                          <p className="text-sm text-muted-foreground">
                            Arquivo selecionado: {photoFile.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

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

            {userRole === "admin" && privateData ? (
              <Card className="order-2 border-primary/20">
                <CardHeader>
                  <CardTitle>Dados Sensíveis</CardTitle>
                  <CardDescription>Visível apenas para administradores</CardDescription>
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
            ) : (
              <div className="order-2 hidden xl:block" />
            )}

            <Card className="order-3">
              <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
                <CardTitle className="text-lg">Status do Colaborador</CardTitle>
                <Select
                  value={status}
                  onValueChange={(value) => {
                    const selectedStatus = value as "ativo" | "ferias" | "afastado";
                    setStatus(selectedStatus);
                    setColaborador({
                      ...colaborador,
                      colab_ativo: selectedStatus === "ativo",
                      colab_ferias: selectedStatus === "ferias",
                      colab_afastado: selectedStatus === "afastado",
                    });
                  }}
                >
                  <SelectTrigger aria-label="Selecione o status do colaborador" className="w-[220px]">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{option.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {option.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardHeader>
            </Card>

            <Card className="order-4">
              <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
                <CardTitle className="text-lg">Acesso e Permissões</CardTitle>
                <Select
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
                  <SelectTrigger aria-label="Selecione o nível de acesso" className="w-[220px]">
                    <SelectValue placeholder="Selecione um nível de acesso" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{option.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {option.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardHeader>
            </Card>
          </div>
        </form>
      </div>
    </Layout>
  );
}
