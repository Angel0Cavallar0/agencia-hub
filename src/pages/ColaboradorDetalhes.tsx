import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";
import { logger } from "@/lib/logger";

const buildErrorContext = (
  error: unknown,
  extra: Record<string, unknown> = {}
) => {
  const context: Record<string, unknown> = { ...extra };

  if (error && typeof error === "object") {
    const err = error as Record<string, unknown>;

    if (typeof err.message === "string") {
      context.errorMessage = err.message;
    }
    if (typeof err.details === "string") {
      context.errorDetails = err.details;
    }
    if (typeof err.hint === "string") {
      context.errorHint = err.hint;
    }
    if (typeof err.code === "string") {
      context.errorCode = err.code;
    }
    if (typeof err.status === "number" || typeof err.status === "string") {
      context.errorStatus = err.status;
    }
    if (typeof err.stack === "string") {
      context.errorStack = err.stack;
    }
  } else if (error !== undefined && error !== null) {
    context.errorMessage = String(error);
  }

  if (!context.errorMessage) {
    context.errorMessage = "Erro desconhecido";
  }

  return context;
};

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
    | "user_id"
  >;
  type PrivateSupabaseData = Partial<ColaboradorPrivate> & {
    contato_emergencia?: string | Record<string, string> | null;
    telefone_pessoal?: string | null;
  };

  type UserRoleRow = Database["public"]["Tables"]["user_roles"]["Row"] & {
    wpp_acess?: boolean | null;
    crm_acess?: boolean | null;
    crm_level_acess?: string[] | string | null;
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
  const [role, setRole] = useState<"user" | "supervisor" | "admin">("user");
  const [status, setStatus] = useState<"ativo" | "ferias" | "afastado" | "desligado">("ativo");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [sensitiveVisible, setSensitiveVisible] = useState(false);
  const [availablePrivateFields, setAvailablePrivateFields] = useState<string[]>([]);
  const [showDesligadoDialog, setShowDesligadoDialog] = useState(false);
  const [userRolesRecordId, setUserRolesRecordId] = useState<string | null>(null);
  type CRMLevel = "admin" | "gerente" | "supervisor" | "assistente" | "negado";

  const crmLevelOptions: { value: CRMLevel; label: string }[] = [
    { value: "admin", label: "Admin" },
    { value: "gerente", label: "Gerente" },
    { value: "supervisor", label: "Supervisor" },
    { value: "assistente", label: "Assistente" },
    { value: "negado", label: "Negado" },
  ];

  const [wppAccess, setWppAccess] = useState<boolean>(false);
  const [crmAccess, setCrmAccess] = useState<boolean>(false);
  const [crmAccessLevel, setCrmAccessLevel] = useState<CRMLevel>("negado");

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

  const resetUserRoleStates = () => {
    setUserRolesRecordId(null);
    setWppAccess(false);
    setCrmAccess(false);
    setCrmAccessLevel("negado");
  };

  const normalizeCrmLevel = (
    value: string[] | string | null | undefined,
    fallback: CRMLevel = "negado"
  ): CRMLevel => {
    const allowedLevels: CRMLevel[] = ["admin", "gerente", "supervisor", "assistente", "negado"];

    if (!value) {
      return fallback;
    }

    if (Array.isArray(value)) {
      for (const level of value) {
        const normalized = typeof level === "string" ? level.trim().toLowerCase() : "";
        if (allowedLevels.includes(normalized as CRMLevel)) {
          return normalized as CRMLevel;
        }
      }
      return fallback;
    }

    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return normalizeCrmLevel(parsed, fallback);
        }
      } catch {
        const normalizedValue = value.trim().toLowerCase();
        if (allowedLevels.includes(normalizedValue as CRMLevel)) {
          return normalizedValue as CRMLevel;
        }
        return fallback;
      }

      const normalizedValue = value.trim().toLowerCase();
      return allowedLevels.includes(normalizedValue as CRMLevel)
        ? (normalizedValue as CRMLevel)
        : fallback;
    }

    return fallback;
  };

  const fetchUserRolePermissions = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("id, role, wpp_acess, crm_acess, crm_level_acess")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      await logger.warning(
        "Erro ao buscar permissões de acesso do colaborador",
        "COLAB_PERMISSIONS_FETCH_ERROR",
        buildErrorContext(error, {
          colaboradorId: id,
          userId,
        })
      );
      resetUserRoleStates();
      return;
    }

    if (!data) {
      resetUserRoleStates();
      return;
    }

    const roleRow = data as UserRoleRow;
    setUserRolesRecordId(roleRow.id ?? null);
    if (roleRow.role) {
      setRole(roleRow.role as "admin" | "supervisor" | "user");
      setColaborador((current) =>
        current
          ? {
              ...current,
              admin: roleRow.role === "admin",
              supervisor: roleRow.role === "supervisor",
            }
          : current
      );
    }

    const normalizedWppAccess =
      typeof roleRow.wpp_acess === "boolean" ? roleRow.wpp_acess : false;
    const normalizedCrmAccess =
      typeof roleRow.crm_acess === "boolean" ? roleRow.crm_acess : false;

    setWppAccess(normalizedWppAccess);
    setCrmAccess(normalizedCrmAccess);

    const normalizedLevel = normalizeCrmLevel(roleRow.crm_level_acess);
    setCrmAccessLevel(normalizedCrmAccess ? normalizedLevel : "negado");
  };

  useEffect(() => {
    if (id) {
      fetchColaborador();
      if (userRole === "admin") {
        fetchPrivateData();
      }
    }
  }, [id, userRole]);

  useEffect(() => {
    if (!photoFile) return;

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
      await logger.error("Erro ao buscar colaborador", "COLAB_FETCH_ERROR", buildErrorContext(error, {
        colaboradorId: id,
      }));
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
      if (colaboradorData.user_id) {
        await fetchUserRolePermissions(colaboradorData.user_id);
      } else {
        resetUserRoleStates();
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
      await logger.error(
        "Erro ao buscar dados privados do colaborador",
        "COLAB_PRIVATE_FETCH_ERROR",
        buildErrorContext(error, {
          colaboradorId: id,
        })
      );
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
          | { nome?: string; grau?: string; telefone?: string }
          | undefined;
        if (parsed) {
          emergencyName = parsed.nome?.toString() || "";
          emergencyPhone = parsed.telefone?.toString() || "";
        }
      } catch (error) {
        await logger.error(
          "Erro ao interpretar dados de contato de emergência do colaborador",
          "COLAB_PRIVATE_EMERGENCY_PARSE_ERROR",
          buildErrorContext(error, {
            colaboradorId: id,
            rawEmergencyValue: emergencyValue,
          })
        );
        const [namePart, phonePart] = emergencyValue.split("|").map((part) => part.trim());
        emergencyName = namePart || emergencyValue;
        emergencyPhone = phonePart || "";
      }
    } else if (emergencyValue && typeof emergencyValue === "object") {
      const parsed = emergencyValue as { nome?: string; grau?: string; telefone?: string };
      emergencyName = parsed.nome?.toString() || "";
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
      contato_emergencia_telefone: emergencyPhone,
    });
  };

  const handleUpdateColaborador = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!colaborador || !id) {
        throw new Error("Colaborador não encontrado");
      }

      let updatedFotoUrl = colaborador.foto_url ?? null;

      if (photoFile) {
        const fileExtension = photoFile.name.split(".").pop() || "jpg";
        const uniqueFileName = `${colaborador.id_colaborador || id}-${Date.now()}.${fileExtension}`;
        const filePath = `fotos_colaboradores/${uniqueFileName}`;

        const { error: uploadError } = await supabase.storage
          .from("imagens")
          .upload(filePath, photoFile, {
            cacheControl: "3600",
            upsert: true,
            contentType: photoFile.type,
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data: publicUrlData } = supabase.storage
          .from("imagens")
          .getPublicUrl(filePath);

        if (!publicUrlData?.publicUrl) {
          throw new Error("Não foi possível gerar a URL pública da foto do colaborador");
        }

        updatedFotoUrl = publicUrlData.publicUrl;
      }

      const updatedColaborador: EditableColaborador = {
        ...colaborador,
        foto_url: updatedFotoUrl,
      };

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
        (acc as any)[key] = updatedColaborador[key] ?? null;
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

      if (photoFile) {
        setColaborador(updatedColaborador);
        setPhotoFile(null);
        setPhotoPreview(updatedFotoUrl);
      }

      if (userRole === "admin" && privateData) {
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
          await logger.error(
            "Erro ao atualizar dados privados do colaborador",
            "COLAB_PRIVATE_UPDATE_ERROR",
            buildErrorContext(privateError, {
              colaboradorId: id,
              privatePayload,
            })
          );
          toast.error("Colaborador atualizado, mas houve erro nos dados privados");
        }
      }

      if (colaborador.user_id) {
        const permissionsPayload: Partial<UserRoleRow> & {
          user_id: string;
          role: "admin" | "supervisor" | "user";
        } = {
          user_id: colaborador.user_id,
          role,
          wpp_acess: wppAccess,
          crm_acess: crmAccess,
          crm_level_acess: crmAccess ? [crmAccessLevel] : ["negado"],
        };

        if (userRolesRecordId) {
          permissionsPayload.id = userRolesRecordId;
        }

        const { data: userRolesData, error: userRolesError } = await supabase
          .from("user_roles")
          .upsert(
            {
              ...permissionsPayload,
            } as any,
            {
              onConflict: "user_id",
            }
          )
          .select("id")
          .maybeSingle();

        if (userRolesError) {
          throw userRolesError;
        }

        if (userRolesData?.id) {
          setUserRolesRecordId(userRolesData.id);
        }
      } else {
        await logger.warning(
          "Colaborador sem vínculo de usuário ao atualizar permissões",
          "COLAB_PERMISSIONS_UPDATE_SKIPPED",
          {
            colaboradorId: id,
          }
        );
      }

      toast.success("Colaborador atualizado com sucesso!");
    } catch (error: any) {
      await logger.error(
        "Erro ao atualizar colaborador",
        "COLAB_UPDATE_ERROR",
        buildErrorContext(error, {
          colaboradorId: id,
          role,
          status,
          currentColaborador: colaborador,
          whatsappAccess: wppAccess,
          crmAccess,
          crmAccessLevel,
        })
      );
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
        <div className="flex h-full items-center justify-center">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex h-full flex-col overflow-hidden">
        <div className="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-1 flex-col overflow-y-auto pr-1 sm:pr-2 lg:pr-4">
          <form onSubmit={handleUpdateColaborador} className="space-y-6 pb-10">
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
                    </div>
                  </div>
                  <div className="flex-1 space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
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
                    <Separator />
                    <div className="space-y-2">
                      <Label htmlFor="status_colaborador">Status do Colaborador</Label>
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
                          id="status_colaborador"
                          aria-label="Selecione o status do colaborador"
                          className={`${selectTriggerClasses} w-full max-w-sm`}
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
                      {sensitiveVisible ? "visivel" : "visivel"}
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
                        <div className="md:col-span-2 space-y-3">
                          <p className="text-sm font-semibold text-muted-foreground">Contatos de emergência</p>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="contato_emergencia_nome">Nome</Label>
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
                          </div>
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

              <Card className={`order-3 xl:col-span-2 ${cardSurfaceClasses}`}>
                <CardHeader className="pb-4">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">Permissões e Acessos</CardTitle>
                    <CardDescription>Defina os níveis de acesso e canais liberados para o colaborador.</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="nivel_acesso_sistema">Nível de acesso ao sistema</Label>
                      <Select
                        value={role}
                        onValueChange={(value) => {
                          const selectedRole = value as "admin" | "supervisor" | "user";
                          setRole(selectedRole);
                          setColaborador((current) =>
                            current
                              ? {
                                  ...current,
                                  admin: selectedRole === "admin",
                                  supervisor: selectedRole === "supervisor",
                                }
                              : current
                          );
                        }}
                      >
                        <SelectTrigger
                          id="nivel_acesso_sistema"
                          className={`${selectTriggerClasses} w-full min-w-0`}
                          aria-label="Selecione o nível de acesso ao sistema"
                        >
                          <SelectValue />
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
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="acesso_whatsapp">Acesso ao WhatsApp</Label>
                      <Select
                        value={wppAccess ? "sim" : "nao"}
                        onValueChange={(value) => {
                          setWppAccess(value === "sim");
                        }}
                      >
                        <SelectTrigger
                          id="acesso_whatsapp"
                          className={`${selectTriggerClasses} w-full min-w-0`}
                          aria-label="Defina se o colaborador tem acesso ao WhatsApp"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sim">Sim</SelectItem>
                          <SelectItem value="nao">Não</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="acesso_crm">Acesso ao CRM</Label>
                      <Select
                        value={crmAccess ? "sim" : "nao"}
                        onValueChange={(value) => {
                          const hasAccess = value === "sim";
                          setCrmAccess(hasAccess);
                          if (!hasAccess) {
                            setCrmAccessLevel("negado");
                          }
                        }}
                      >
                        <SelectTrigger
                          id="acesso_crm"
                          className={`${selectTriggerClasses} w-full min-w-0`}
                          aria-label="Defina se o colaborador tem acesso ao CRM"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sim">Sim</SelectItem>
                          <SelectItem value="nao">Não</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nivel_acesso_crm">Nível de acesso CRM</Label>
                      <Select
                        value={crmAccessLevel}
                        onValueChange={(value) => setCrmAccessLevel(value as CRMLevel)}
                        disabled={!crmAccess}
                      >
                        <SelectTrigger
                          id="nivel_acesso_crm"
                          className={`${selectTriggerClasses} w-full min-w-0`}
                          aria-label="Defina o nível de acesso ao CRM"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {crmLevelOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </form>
        </div>
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
