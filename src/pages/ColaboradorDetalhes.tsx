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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PhoneInput } from "@/components/PhoneInput";
import { formatPhoneDisplay } from "@/lib/phoneUtils";
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
    | "colab_desligado"
    | "admin"
    | "supervisor"
    | "foto_url"
  >;
  type PrivateSupabaseData = Partial<ColaboradorPrivate> & {
    contato_emergencia?: string | Record<string, string> | null;
    telefone_pessoal?: string | null;
  };

  type PrivateData = {
    cpf: string;
    rg: string;
    data_nascimento: string;
    endereco_residencial: string;
    telefone_pessoal: string;
    email_pessoal: string;
    contato_emergencia_nome: string;
    contato_emergencia_grau: string;
    contato_emergencia_telefone: string;
  };

  const [colaborador, setColaborador] = useState<EditableColaborador | null>(null);
  const [privateData, setPrivateData] = useState<PrivateData | null>(null);
  const [role, setRole] = useState<"user" | "supervisor" | "admin">("user");
  const [status, setStatus] = useState<"ativo" | "ferias" | "afastado" | "desligado">("ativo");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [sensitiveVisible, setSensitiveVisible] = useState(true);
  const [availablePrivateFields, setAvailablePrivateFields] = useState<string[]>([]);
  const [showDesligadoDialog, setShowDesligadoDialog] = useState(false);

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
    {
      value: "desligado" as const,
      label: "Desligado",
      description: "Colaborador desligado da empresa.",
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

  const cardSurfaceClasses =
    "rounded-xl border border-black/30 bg-white/90 shadow-md transition-colors dark:border-white/20 dark:bg-slate-900/70";
  const inputSurfaceClasses =
    "rounded-lg border border-black/10 bg-muted dark:border-white/15 dark:bg-slate-900/60";
  const selectTriggerClasses =
    "min-w-[260px] sm:min-w-[300px] h-12 rounded-lg border border-black/20 bg-white/80 text-left dark:border-white/20 dark:bg-slate-900/60";

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
      .select("*")
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
        colaboradorData.colab_desligado
          ? "desligado"
          : colaboradorData.colab_ferias
          ? "ferias"
          : colaboradorData.colab_afastado
          ? "afastado"
          : "ativo"
      );
      if (colaboradorData.foto_url) {
        setPhotoPreview(colaboradorData.foto_url);
      }
    }
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

    const supabaseData = (data || {}) as PrivateSupabaseData;
    setAvailablePrivateFields(Object.keys(supabaseData || {}));

    const emergencyValue = supabaseData.contato_emergencia;
    let emergencyName = "";
    let emergencyGrau = "";
    let emergencyPhone = "";

    if (typeof emergencyValue === "string" && emergencyValue) {
      try {
        const parsed = JSON.parse(emergencyValue) as
          | { nome?: string; grau?: string; telefone?: string }
          | undefined;
        if (parsed) {
          emergencyName = parsed.nome?.toString() || "";
          emergencyGrau = parsed.grau?.toString() || "";
          emergencyPhone = parsed.telefone?.toString() || "";
        }
      } catch (error) {
        const [namePart, phonePart] = emergencyValue.split("|").map((part) => part.trim());
        emergencyName = namePart || emergencyValue;
        emergencyPhone = phonePart || "";
      }
    } else if (emergencyValue && typeof emergencyValue === "object") {
      const parsed = emergencyValue as { nome?: string; grau?: string; telefone?: string };
      emergencyName = parsed.nome?.toString() || "";
      emergencyGrau = parsed.grau?.toString() || "";
      emergencyPhone = parsed.telefone?.toString() || "";
    }

    setPrivateData({
      cpf: supabaseData.cpf || "",
      rg: supabaseData.rg || "",
      data_nascimento: supabaseData.data_aniversario || "",
      endereco_residencial: supabaseData.endereco || "",
      telefone_pessoal: supabaseData.telefone_pessoal || "",
      email_pessoal: supabaseData.email_pessoal || "",
      contato_emergencia_nome: emergencyName,
      contato_emergencia_grau: emergencyGrau,
      contato_emergencia_telefone: emergencyPhone,
    });
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
        "colab_desligado",
        "foto_url",
      ] as const;

      const payload = allowedFields.reduce((acc, key) => {
        (acc as any)[key] = colaborador[key] ?? null;
        return acc;
      }, {} as Database["public"]["Tables"]["colaborador"]["Update"]);

      // Se está marcando como desligado, adiciona data
      if (status === "desligado" && !colaborador.colab_desligado) {
        payload.data_desligamento = new Date().toISOString();
      }

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
        const emergencyPayload =
          privateData.contato_emergencia_nome || privateData.contato_emergencia_grau || privateData.contato_emergencia_telefone
            ? JSON.stringify({
                nome: privateData.contato_emergencia_nome,
                grau: privateData.contato_emergencia_grau,
                telefone: privateData.contato_emergencia_telefone,
              })
            : null;

        const privatePayload: Record<string, string | null> & {
          contato_emergencia?: string | null;
        } = {
          id_colaborador: id,
          email_pessoal: privateData.email_pessoal || null,
          telefone_pessoal: privateData.telefone_pessoal || null,
          data_aniversario: privateData.data_nascimento || null,
        };

        if (availablePrivateFields.includes("contato_emergencia")) {
          privatePayload.contato_emergencia = emergencyPayload;
        }

        if (availablePrivateFields.includes("cpf")) {
          privatePayload.cpf = privateData.cpf || null;
        }
        if (availablePrivateFields.includes("rg")) {
          privatePayload.rg = privateData.rg || null;
        }
        if (availablePrivateFields.includes("endereco")) {
          privatePayload.endereco = privateData.endereco_residencial || null;
        }

        const { error: privateError } = await supabase
          .from("colaborador_private")
          .upsert(privatePayload as Database["public"]["Tables"]["colaborador_private"]["Insert"] & {
            contato_emergencia?: string | null;
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
            <Card className={`order-1 ${cardSurfaceClasses}`}>
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-foreground">
                  Informações Principais
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-6 lg:flex-row">
                <div className="flex w-full max-w-[180px] flex-col items-center gap-4">
                  <div
                    className="flex h-36 w-36 items-center justify-center rounded-full bg-emerald-800 text-lg font-semibold uppercase tracking-wide text-white"
                    style={
                      photoPreview
                        ? {
                            backgroundImage: `url(${photoPreview})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }
                        : undefined
                    }
                  >
                    {!photoPreview && "foto"}
                  </div>
                  <div>
                    <input
                      id="foto_colaborador"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      onClick={() =>
                        document.getElementById("foto_colaborador")?.click()
                      }
                      className="h-8 rounded-full bg-emerald-800 px-4 text-xs font-semibold tracking-wide text-white hover:bg-emerald-900"
                    >
                      ALTERAR FOTO
                    </Button>
                    {photoFile && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {photoFile.name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid flex-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome *</Label>
                    <Input
                      id="nome"
                      required
                      value={colaborador.nome || ""}
                      className={inputSurfaceClasses}
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
                      className={inputSurfaceClasses}
                      onChange={(e) =>
                        setColaborador({
                          ...colaborador,
                          sobrenome: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apelido">Apelido</Label>
                    <Input
                      id="apelido"
                      value={colaborador.apelido || ""}
                      className={inputSurfaceClasses}
                      onChange={(e) =>
                        setColaborador({ ...colaborador, apelido: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="id_colaborador">ID Colaborador</Label>
                    <Input
                      id="id_colaborador"
                      value={colaborador.id_colaborador || ""}
                      className={inputSurfaceClasses}
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cargo">Cargo</Label>
                    <Input
                      id="cargo"
                      value={colaborador.cargo || ""}
                      className={inputSurfaceClasses}
                      onChange={(e) =>
                        setColaborador({ ...colaborador, cargo: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data_admissao">Data de Contratação</Label>
                    <Input
                      id="data_admissao"
                      type="date"
                      value={colaborador.data_admissao || ""}
                      className={inputSurfaceClasses}
                      onChange={(e) =>
                        setColaborador({
                          ...colaborador,
                          data_admissao: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="email_corporativo">E-mail Corporativo</Label>
                    <Input
                      id="email_corporativo"
                      type="email"
                      value={colaborador.email_corporativo || ""}
                      className={`md:max-w-xl ${inputSurfaceClasses}`}
                      onChange={(e) =>
                        setColaborador({
                          ...colaborador,
                          email_corporativo: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="id_clickup">ID ClickUp</Label>
                    <Input
                      id="id_clickup"
                      value={colaborador.id_clickup || ""}
                      className={inputSurfaceClasses}
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
                      className={inputSurfaceClasses}
                      onChange={(e) =>
                        setColaborador({ ...colaborador, id_slack: e.target.value })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {userRole === "admin" && privateData ? (
              <Card className={`order-2 ${cardSurfaceClasses}`}>
                <CardHeader className="flex items-start justify-between gap-4 pb-4">
                  <div>
                    <CardTitle className="text-xl font-semibold text-foreground">
                      Dados Sensíveis
                    </CardTitle>
                  </div>
                  <Button
                    type="button"
                    onClick={() => setSensitiveVisible((prev) => !prev)}
                    className={`h-8 rounded-full px-4 text-xs font-semibold tracking-wide ${
                      sensitiveVisible
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {sensitiveVisible ? "visível" : "oculto"}
                  </Button>
                </CardHeader>
                <CardContent>
                  {sensitiveVisible ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="cpf">CPF</Label>
                        <Input
                          id="cpf"
                          value={privateData.cpf}
                          className={inputSurfaceClasses}
                          onChange={(e) =>
                            setPrivateData({
                              ...privateData,
                              cpf: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rg">RG</Label>
                        <Input
                          id="rg"
                          value={privateData.rg}
                          className={inputSurfaceClasses}
                          onChange={(e) =>
                            setPrivateData({
                              ...privateData,
                              rg: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                        <Input
                          id="data_nascimento"
                          type="date"
                          value={privateData.data_nascimento}
                          className={inputSurfaceClasses}
                          onChange={(e) =>
                            setPrivateData({
                              ...privateData,
                              data_nascimento: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="endereco_residencial">Endereço Residencial</Label>
                        <Input
                          id="endereco_residencial"
                          value={privateData.endereco_residencial}
                          className={inputSurfaceClasses}
                          onChange={(e) =>
                            setPrivateData({
                              ...privateData,
                              endereco_residencial: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="telefone_pessoal">Telefone Pessoal</Label>
                        <PhoneInput
                          value={privateData.telefone_pessoal}
                          onChange={(value) =>
                            setPrivateData({
                              ...privateData,
                              telefone_pessoal: value,
                            })
                          }
                          className={inputSurfaceClasses}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email_pessoal">E-mail Pessoal</Label>
                        <Input
                          id="email_pessoal"
                          type="email"
                          value={privateData.email_pessoal}
                          className={inputSurfaceClasses}
                          onChange={(e) =>
                            setPrivateData({
                              ...privateData,
                              email_pessoal: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="grid gap-4 md:col-span-2 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="contato_emergencia_nome">Nome do Contato de Emergência</Label>
                          <Input
                            id="contato_emergencia_nome"
                            value={privateData.contato_emergencia_nome}
                            placeholder="Ex: Marcia"
                            className={inputSurfaceClasses}
                            onChange={(e) =>
                              setPrivateData({
                                ...privateData,
                                contato_emergencia_nome: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contato_emergencia_grau">Grau de Parentesco</Label>
                          <Input
                            id="contato_emergencia_grau"
                            value={privateData.contato_emergencia_grau}
                            placeholder="Ex: Mãe"
                            className={inputSurfaceClasses}
                            onChange={(e) =>
                              setPrivateData({
                                ...privateData,
                                contato_emergencia_grau: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contato_emergencia_telefone">Telefone</Label>
                          <PhoneInput
                            value={privateData.contato_emergencia_telefone}
                            onChange={(value) =>
                              setPrivateData({
                                ...privateData,
                                contato_emergencia_telefone: value,
                              })
                            }
                            className={inputSurfaceClasses}
                          />
                        </div>
                        {privateData.contato_emergencia_nome && privateData.contato_emergencia_grau && (
                          <div className="md:col-span-3">
                            <p className="text-sm text-muted-foreground">
                              Exibição: {privateData.contato_emergencia_nome} - {privateData.contato_emergencia_grau}
                              {privateData.contato_emergencia_telefone && ` • ${formatPhoneDisplay(privateData.contato_emergencia_telefone)}`}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-muted-foreground/40 bg-white/70 p-6 text-center text-sm text-muted-foreground dark:bg-slate-900/60">
                      Os dados sensíveis estão ocultos. Clique em "visível" para exibir novamente.
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="order-2 hidden xl:block" />
            )}

            <Card className={`order-3 ${cardSurfaceClasses}`}>
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:space-y-0">
                <div className="flex flex-col">
                  <CardTitle className="text-lg">Status do Colaborador</CardTitle>
                  <CardDescription>Controle o status atual do colaborador.</CardDescription>
                </div>
                <Select
                  value={status}
                  onValueChange={(value) => {
                    const selectedStatus = value as "ativo" | "ferias" | "afastado" | "desligado";
                    
                    // Se está marcando como desligado, mostra diálogo de confirmação
                    if (selectedStatus === "desligado") {
                      setShowDesligadoDialog(true);
                      return;
                    }
                    
                    setStatus(selectedStatus);
                    setColaborador({
                      ...colaborador,
                      colab_ativo: selectedStatus === "ativo",
                      colab_ferias: selectedStatus === "ferias",
                      colab_afastado: selectedStatus === "afastado",
                      colab_desligado: false,
                    });
                  }}
                >
                  <SelectTrigger
                    aria-label="Selecione o status do colaborador"
                    className={selectTriggerClasses}
                  >
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

            <Card className={`order-4 ${cardSurfaceClasses}`}>
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:space-y-0">
                <div className="flex flex-col">
                  <CardTitle className="text-lg">Permissões e Acessos</CardTitle>
                  <CardDescription>Defina o nível de acesso do colaborador.</CardDescription>
                </div>
                <Select
                  value={role}
                  onValueChange={(value) => {
                    const selectedRole = value as "admin" | "supervisor" | "user";
                    setRole(selectedRole);
                  }}
                >
                  <SelectTrigger className={selectTriggerClasses} aria-label="Selecione o nível de acesso">
                    <SelectValue placeholder="Selecione o nível" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{option.label}</span>
                          <span className="text-xs text-muted-foreground">{option.description}</span>
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

      {/* Dialog de confirmação para status "Desligado" */}
      <AlertDialog open={showDesligadoDialog} onOpenChange={setShowDesligadoDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja desligar este colaborador?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p className="font-semibold text-destructive">
                ⚠️ ATENÇÃO: Esta ação é crítica!
              </p>
              <p>
                Após marcar como desligado, você terá <strong>10 minutos</strong> para reverter essa decisão
                mudando o status de volta para "Ativo".
              </p>
              <p>
                Após esse período, <strong>todas as contas e acessos do colaborador serão desativadas permanentemente</strong>.
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                Para cancelar a ação dentro do prazo de 10 minutos, basta alterar o status do colaborador para "Ativo" novamente.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setStatus("desligado");
                setColaborador({
                  ...colaborador,
                  colab_ativo: false,
                  colab_ferias: false,
                  colab_afastado: false,
                  colab_desligado: true,
                });
                setShowDesligadoDialog(false);
                toast.warning("Colaborador marcado como desligado. Salve as alterações para confirmar.");
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmar Desligamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
