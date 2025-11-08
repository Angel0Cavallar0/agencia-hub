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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from "@/lib/logger";
import { maskIdentifier, revealIdentifier } from "@/lib/urlMask";
import type { Database } from "@/integrations/supabase/types";

type Colaborador = Database["public"]["Tables"]["colaborador"]["Row"];
type ColaboradorPrivate = Database["public"]["Tables"]["colaborador_private"]["Row"];

export default function ColaboradorDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userRole, user } = useAuth();
  const collaboratorId = id ? revealIdentifier(id) || id : "";
  const canAccessSensitive = userRole === "admin" || userRole === "supervisor";
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
  type PrivateSupabaseData =
    Pick<ColaboradorPrivate, "email_pessoal" | "whatsapp" | "data_aniversario"> &
    Partial<ColaboradorPrivate> & {
      contato_emergencia?: string | Record<string, string> | null;
    };

  type PrivateData = {
    cpf: string;
    rg: string;
    data_nascimento: string;
    endereco_residencial: string;
    telefone_pessoal: string;
    email_pessoal: string;
    contato_emergencia_nome: string;
    contato_emergencia_telefone: string;
  };

  const [colaborador, setColaborador] = useState<EditableColaborador | null>(null);
  const [privateData, setPrivateData] = useState<PrivateData | null>(null);
  type StatusValue = "ativo" | "ferias" | "afastado" | "desligado";

  const [role, setRole] = useState<"user" | "supervisor" | "admin">("user");
  const [status, setStatus] = useState<StatusValue>("ativo");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [sensitiveVisible, setSensitiveVisible] = useState(canAccessSensitive);
  const [availablePrivateFields, setAvailablePrivateFields] = useState<string[]>([]);
  const [privateLoading, setPrivateLoading] = useState(false);
  const [isDesligadoDialogOpen, setIsDesligadoDialogOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<StatusValue | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [pendingRole, setPendingRole] = useState<"user" | "supervisor" | "admin" | null>(null);
  const [rolePassword, setRolePassword] = useState("");
  const [isConfirmingRole, setIsConfirmingRole] = useState(false);

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
      description:
        "Após 10 minutos todas as contas serão desativadas. Reative em até 10 minutos para cancelar.",
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

  const applyStatusChange = (selectedStatus: StatusValue) => {
    setStatus(selectedStatus);
    setColaborador((previous) => {
      if (!previous) return previous;
      return {
        ...previous,
        colab_ativo: selectedStatus === "ativo",
        colab_ferias: selectedStatus === "ferias",
        colab_afastado: selectedStatus === "afastado",
      };
    });
  };

  const handleStatusSelection = (value: StatusValue) => {
    if (value === "desligado") {
      setPendingStatus(value);
      setIsDesligadoDialogOpen(true);
      return;
    }

    setPendingStatus(null);
    applyStatusChange(value);
  };

  const closeDesligadoDialog = () => {
    setIsDesligadoDialogOpen(false);
    setPendingStatus(null);
  };

  const confirmDesligadoStatus = () => {
    if (pendingStatus === "desligado") {
      applyStatusChange("desligado");
    }
    closeDesligadoDialog();
  };

  const handleRoleSelection = (value: "user" | "supervisor" | "admin") => {
    if (value === role) {
      return;
    }

    setPendingRole(value);
    setRolePassword("");
    setIsRoleDialogOpen(true);
    void logger.warning(
      "Tentativa de alterar o nível de acesso do colaborador",
      "SECURITY_ACCESS_CHANGE_ATTEMPT",
      {
        collaboratorId,
        requestedRole: value,
        currentRole: role,
        actorId: user?.id,
      }
    );
  };

  const closeRoleDialog = () => {
    setIsRoleDialogOpen(false);
    setPendingRole(null);
    setRolePassword("");
  };

  const confirmRoleChange = async () => {
    if (!pendingRole) {
      return;
    }

    if (!user?.email) {
      toast.error("Não foi possível validar suas credenciais.");
      void logger.error(
        "Falha ao validar credenciais para alterar nível de acesso",
        "SECURITY_ACCESS_CHANGE_FAILURE",
        {
          collaboratorId,
          requestedRole: pendingRole,
          actorId: user?.id,
          reason: "missing_user_email",
        }
      );
      return;
    }

    if (!rolePassword) {
      toast.error("Informe sua senha para confirmar.");
      void logger.warning(
        "Senha não fornecida na confirmação de alteração de acesso",
        "SECURITY_ACCESS_CHANGE_INCOMPLETE",
        {
          collaboratorId,
          requestedRole: pendingRole,
          actorId: user?.id,
        }
      );
      return;
    }

    setIsConfirmingRole(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: rolePassword,
      });

      if (error) {
        throw error;
      }

      setRole(pendingRole);
      setColaborador((previous) => {
        if (!previous) return previous;
        return {
          ...previous,
          admin: pendingRole === "admin",
          supervisor: pendingRole === "supervisor",
        };
      });

      await logger.success("Nível de acesso atualizado", {
        collaboratorId,
        requestedRole: pendingRole,
        actorId: user?.id,
      });

      toast.success("Nível de acesso atualizado.");
      closeRoleDialog();
    } catch (error) {
      console.error("Erro ao confirmar nível de acesso:", error);
      await logger.error("Senha incorreta ao tentar alterar nível de acesso", "SECURITY_ACCESS_CHANGE_FAILURE", {
        collaboratorId,
        requestedRole: pendingRole,
        actorId: user?.id,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      toast.error("Senha incorreta. Tente novamente.");
    } finally {
      setIsConfirmingRole(false);
    }
  };

  useEffect(() => {
    if (collaboratorId && id && id === collaboratorId) {
      const masked = maskIdentifier(collaboratorId);
      if (masked !== id) {
        navigate(`/colaboradores/${masked}`, { replace: true });
      }
    }
  }, [collaboratorId, id, navigate]);

  useEffect(() => {
    if (!collaboratorId) {
      if (id) {
        toast.error("Identificador do colaborador inválido.");
        navigate("/colaboradores");
      }
      return;
    }

    void fetchColaborador();

    if (canAccessSensitive) {
      void fetchPrivateData();
    } else {
      setPrivateData(null);
      setAvailablePrivateFields([]);
      setPrivateLoading(false);
    }
  }, [collaboratorId, canAccessSensitive, id, navigate]);

  useEffect(() => {
    if (!canAccessSensitive) {
      setSensitiveVisible(false);
    } else if (privateData === null) {
      setSensitiveVisible(true);
    }
  }, [canAccessSensitive, privateData]);

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
      .eq("id_colaborador", collaboratorId)
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
          : colaboradorData.colab_ativo
          ? "ativo"
          : "desligado"
      );
    }
  };

  const fetchPrivateData = async () => {
    setPrivateLoading(true);
    const { data, error } = await supabase
      .from("colaborador_private")
      .select("*")
      .eq("id_colaborador", collaboratorId)
      .maybeSingle();

    if (error) {
      console.error("Erro ao buscar dados privados:", error);
      setPrivateLoading(false);
      return;
    }

    const supabaseData = (data || {}) as PrivateSupabaseData;
    setAvailablePrivateFields(Object.keys(supabaseData || {}));

    const emergencyValue = supabaseData.contato_emergencia;
    let emergencyName = "";
    let emergencyPhone = "";

    if (typeof emergencyValue === "string" && emergencyValue) {
      try {
        const parsed = JSON.parse(emergencyValue) as
          | { nome?: string; telefone?: string }
          | undefined;
        if (parsed) {
          emergencyName = parsed.nome?.toString() || "";
          emergencyPhone = parsed.telefone?.toString() || "";
        }
      } catch (error) {
        const [namePart, phonePart] = emergencyValue.split("|").map((part) => part.trim());
        emergencyName = namePart || emergencyValue;
        emergencyPhone = phonePart || "";
      }
    } else if (emergencyValue && typeof emergencyValue === "object") {
      const parsed = emergencyValue as { nome?: string; telefone?: string };
      emergencyName = parsed.nome?.toString() || "";
      emergencyPhone = parsed.telefone?.toString() || "";
    }

    setPrivateData({
      cpf: (supabaseData.cpf as string) || "",
      rg: (supabaseData.rg as string) || "",
      data_nascimento: supabaseData.data_aniversario || "",
      endereco_residencial: (supabaseData.endereco as string) || "",
      telefone_pessoal: supabaseData.whatsapp || "",
      email_pessoal: supabaseData.email_pessoal || "",
      contato_emergencia_nome: emergencyName,
      contato_emergencia_telefone: emergencyPhone,
    });
    setPrivateLoading(false);
  };

  const handleUpdateColaborador = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!colaborador || !collaboratorId) {
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
        .eq("id_colaborador", collaboratorId);

      if (colaboradorError) throw colaboradorError;

      if (canAccessSensitive && privateData) {
        const emergencyPayload =
          privateData.contato_emergencia_nome || privateData.contato_emergencia_telefone
            ? JSON.stringify({
                nome: privateData.contato_emergencia_nome,
                telefone: privateData.contato_emergencia_telefone,
              })
            : null;

        const privatePayload: Record<string, string | null> & {
          contato_emergencia?: string | null;
        } = {
          id_colaborador: collaboratorId,
          email_pessoal: privateData.email_pessoal || null,
          whatsapp: privateData.telefone_pessoal || null,
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

  const handleSensitiveToggle = () => {
    if (!canAccessSensitive) {
      void logger.warning(
        "Tentativa de visualizar dados sensíveis sem permissão",
        "SECURITY_SENSITIVE_VIEW_DENIED",
        {
          collaboratorId,
          actorId: user?.id,
        }
      );
      toast.error("Sem Permissão");
      return;
    }

    setSensitiveVisible((prev) => !prev);
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

            <Card className={`order-2 ${cardSurfaceClasses}`}>
              <CardHeader className="flex items-start justify-between gap-4 pb-4">
                <div>
                  <CardTitle className="text-xl font-semibold text-foreground">
                    Dados Sensíveis
                  </CardTitle>
                </div>
                <Button
                  type="button"
                  onClick={handleSensitiveToggle}
                  aria-disabled={!canAccessSensitive}
                  className={`h-8 rounded-full px-4 text-xs font-semibold tracking-wide transition-colors ${
                    canAccessSensitive
                      ? sensitiveVisible
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                      : "bg-muted text-muted-foreground opacity-90"
                  }`}
                >
                  {canAccessSensitive && sensitiveVisible ? "visível" : "oculto"}
                </Button>
              </CardHeader>
              <CardContent>
                {canAccessSensitive ? (
                  privateLoading ? (
                    <div className="rounded-lg border border-dashed border-muted-foreground/40 bg-white/70 p-6 text-center text-sm text-muted-foreground dark:bg-slate-900/60">
                      Carregando dados sensíveis...
                    </div>
                  ) : sensitiveVisible ? (
                    privateData ? (
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
                          <Input
                            id="telefone_pessoal"
                            value={privateData.telefone_pessoal}
                            className={inputSurfaceClasses}
                            onChange={(e) =>
                              setPrivateData({
                                ...privateData,
                                telefone_pessoal: e.target.value,
                              })
                            }
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
                        <div className="grid gap-4 md:col-span-2 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="contato_emergencia_nome">Nome do Contato de Emergência</Label>
                            <Input
                              id="contato_emergencia_nome"
                              value={privateData.contato_emergencia_nome}
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
                            <Label htmlFor="contato_emergencia_telefone">Telefone do Contato de Emergência</Label>
                            <Input
                              id="contato_emergencia_telefone"
                              value={privateData.contato_emergencia_telefone}
                              className={inputSurfaceClasses}
                              onChange={(e) =>
                                setPrivateData({
                                  ...privateData,
                                  contato_emergencia_telefone: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-muted-foreground/40 bg-white/70 p-6 text-center text-sm text-muted-foreground dark:bg-slate-900/60">
                        Nenhum dado sensível disponível para este colaborador.
                      </div>
                    )
                  ) : (
                    <div className="rounded-lg border border-dashed border-muted-foreground/40 bg-white/70 p-6 text-center text-sm text-muted-foreground dark:bg-slate-900/60">
                      Os dados sensíveis estão ocultos. Clique em "visível" para exibir novamente.
                    </div>
                  )
                ) : (
                  <div className="rounded-lg border border-dashed border-muted-foreground/40 bg-white/70 p-6 text-center text-sm text-muted-foreground dark:bg-slate-900/60">
                    Você não tem permissão para visualizar esses dados.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className={`order-3 ${cardSurfaceClasses}`}>
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:space-y-0">
                <div className="flex flex-col">
                  <CardTitle className="text-lg">Status do Colaborador</CardTitle>
                  <CardDescription>Controle o status atual do colaborador.</CardDescription>
                </div>
                <Select
                  value={status}
                  onValueChange={(value) =>
                    handleStatusSelection(value as StatusValue)
                  }
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
            <AlertDialog
              open={isDesligadoDialogOpen}
              onOpenChange={(open) => {
                if (!open) {
                  closeDesligadoDialog();
                } else {
                  setIsDesligadoDialogOpen(true);
                }
              }}
            >
              <AlertDialogContent className={cardSurfaceClasses}>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar desligamento</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza de que deseja marcar este colaborador como desligado?
                    Após 10 minutos todas as contas dele serão desativadas
                    permanentemente. Para cancelar a ação, altere o status de volta
                    para ativo dentro desse período.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={closeDesligadoDialog}>
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={confirmDesligadoStatus}
                  >
                    Confirmar desligamento
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Card className={`order-4 ${cardSurfaceClasses}`}>
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:space-y-0">
                <div className="flex flex-col">
                  <CardTitle className="text-lg">Acesso e Permissões</CardTitle>
                  <CardDescription>Defina os níveis de acesso disponíveis.</CardDescription>
                </div>
                <Select
                  value={role}
                  onValueChange={(value) =>
                    handleRoleSelection(value as "user" | "supervisor" | "admin")
                  }
                >
                  <SelectTrigger
                    aria-label="Selecione o nível de acesso"
                    className={selectTriggerClasses}
                  >
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
            <AlertDialog
              open={isRoleDialogOpen}
              onOpenChange={(open) => {
                if (!open) {
                  closeRoleDialog();
                } else {
                  setIsRoleDialogOpen(true);
                }
              }}
            >
              <AlertDialogContent className={cardSurfaceClasses}>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar alteração de acesso</AlertDialogTitle>
                  <AlertDialogDescription>
                    Para alterar o nível de acesso do colaborador, confirme sua senha abaixo.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-2">
                  <Label htmlFor="confirmacao-senha">Senha</Label>
                  <Input
                    id="confirmacao-senha"
                    type="password"
                    value={rolePassword}
                    onChange={(event) => setRolePassword(event.target.value)}
                    className={inputSurfaceClasses}
                    autoFocus
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={closeRoleDialog} disabled={isConfirmingRole}>
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={confirmRoleChange}
                    disabled={isConfirmingRole}
                    className="bg-emerald-700 text-white hover:bg-emerald-800"
                  >
                    {isConfirmingRole ? "Validando..." : "Confirmar"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </form>
      </div>
    </Layout>
  );
}
