import { ChangeEvent, useEffect, useState } from "react";
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

  type AccessLevel = "admin" | "gerente" | "supervisor" | "assistente" | "geral";
  type BinaryAccess = "sim" | "nao";

  const [colaborador, setColaborador] = useState<EditableColaborador | null>(null);
  const [privateData, setPrivateData] = useState<PrivateData | null>(null);
  const [role, setRole] = useState<AccessLevel>("geral");
  const [status, setStatus] = useState<"ativo" | "ferias" | "afastado" | "desligado">("ativo");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [sensitiveVisible, setSensitiveVisible] = useState(false);
  const [availablePrivateFields, setAvailablePrivateFields] = useState<string[]>([]);
  const [showDesligadoDialog, setShowDesligadoDialog] = useState(false);
  const [userRoleRowId, setUserRoleRowId] = useState<string | null>(null);
  const [wppAccess, setWppAccess] = useState<BinaryAccess>("nao");
  const [crmAccess, setCrmAccess] = useState<BinaryAccess>("nao");
  const [crmLevel, setCrmLevel] = useState<AccessLevel>("geral");

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
      value: "gerente" as const,
      label: "Gerente",
      description: "Gerencia equipes, aprova processos e acompanha indicadores.",
    },
    {
      value: "supervisor" as const,
      label: "Supervisor",
      description: "Acompanha o desempenho da equipe e distribui atividades.",
    },
    {
      value: "assistente" as const,
      label: "Assistente",
      description: "Atua no suporte operacional com acessos controlados.",
    },
    {
      value: "geral" as const,
      label: "Geral",
      description: "Acesso básico apenas ao necessário para o trabalho diário.",
    },
  ];

  const binaryOptions: { value: BinaryAccess; label: string }[] = [
    { value: "sim", label: "Sim" },
    { value: "nao", label: "Não" },
  ];

  const normalizeRole = (value: string | null | undefined): AccessLevel => {
    switch (value) {
      case "admin":
      case "gerente":
      case "supervisor":
      case "assistente":
      case "geral":
        return value;
      case "user":
        return "geral";
      default:
        return "geral";
    }
  };

  const normalizeBinary = (value: boolean | null | undefined): BinaryAccess => (value ? "sim" : "nao");

  const binaryToBoolean = (value: BinaryAccess) => value === "sim";

  const resetUserRoleData = (fallbackRole: AccessLevel = "geral") => {
    setUserRoleRowId(null);
    setRole(fallbackRole);
    setWppAccess("nao");
    setCrmAccess("nao");
    setCrmLevel("geral");
  };

  const fetchUserRoleData = async (userId: string, fallbackRole: AccessLevel) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      await logger.error(
        "Erro ao buscar permissões do colaborador",
        "COLAB_USER_ROLE_FETCH_ERROR",
        buildErrorContext(error, {
          colaboradorId: id,
          userId,
        })
      );
      resetUserRoleData(fallbackRole);
      return;
    }

    if (!data) {
      resetUserRoleData(fallbackRole);
      return;
    }

    const roleData = data as {
      id?: string | null;
      role?: string | null;
      wpp_acess?: boolean | null;
      wpp_access?: boolean | null;
      crm_access?: boolean | null;
      crm_acess?: boolean | null;
      crm_access_level?: string | null;
      crm_level_access?: string | null;
      crm_level_acess?: string | null;
    };

    setUserRoleRowId(roleData.id ?? null);
    setRole(normalizeRole(roleData.role));
    const resolvedWppAccess =
      typeof roleData.wpp_acess === "boolean"
        ? roleData.wpp_acess
        : typeof roleData.wpp_access === "boolean"
        ? roleData.wpp_access
        : null;
    setWppAccess(normalizeBinary(resolvedWppAccess));

    const resolvedCrmAccess =
      typeof roleData.crm_access === "boolean"
        ? roleData.crm_access
        : typeof roleData.crm_acess === "boolean"
        ? roleData.crm_acess
        : null;
    setCrmAccess(normalizeBinary(resolvedCrmAccess));

    const levelValue =
      typeof roleData.crm_access_level === "string" && roleData.crm_access_level.length > 0
        ? roleData.crm_access_level
        : typeof roleData.crm_level_access === "string" && roleData.crm_level_access.length > 0
        ? roleData.crm_level_access
        : typeof roleData.crm_level_acess === "string" && roleData.crm_level_acess.length > 0
        ? roleData.crm_level_acess
        : null;
    setCrmLevel(normalizeRole(levelValue));
  };

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

      const fallbackRole = normalizeRole(
        colaboradorData.admin ? "admin" : colaboradorData.supervisor ? "supervisor" : "geral"
      );
      setRole(fallbackRole);
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
        void fetchUserRoleData(colaboradorData.user_id, fallbackRole);
      } else {
        resetUserRoleData(fallbackRole);
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

  const handleUpdateColaborador = async (e: React.FormEvent) => {
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

      if (colaborador.user_id) {
        const userRolesPayload: Database["public"]["Tables"]["user_roles"]["Insert"] = {
          user_id: colaborador.user_id,
          role,
          crm_access: binaryToBoolean(crmAccess),
          crm_access_level: crmLevel,
          wpp_acess: binaryToBoolean(wppAccess),
        };

        if (userRoleRowId) {
          userRolesPayload.id = userRoleRowId;
        }

        const {
          data: userRoleData,
          error: userRolesError,
        } = await supabase
          .from("user_roles")
          .upsert(userRolesPayload, { onConflict: "user_id" })
          .select("*")
          .maybeSingle();

        if (userRolesError) {
          throw userRolesError;
        }

        if (userRoleData) {
          const updatedRoleData = userRoleData as {
            id?: string | null;
            role?: string | null;
            wpp_acess?: boolean | null;
            wpp_access?: boolean | null;
            crm_access?: boolean | null;
            crm_acess?: boolean | null;
            crm_access_level?: string | null;
            crm_level_access?: string | null;
            crm_level_acess?: string | null;
          };

          setUserRoleRowId(updatedRoleData.id ?? null);
          setRole(normalizeRole(updatedRoleData.role));
          const updatedWppAccess =
            typeof updatedRoleData.wpp_acess === "boolean"
              ? updatedRoleData.wpp_acess
              : typeof updatedRoleData.wpp_access === "boolean"
              ? updatedRoleData.wpp_access
              : null;
          setWppAccess(normalizeBinary(updatedWppAccess));

          const updatedCrmAccess =
            typeof updatedRoleData.crm_access === "boolean"
              ? updatedRoleData.crm_access
              : typeof updatedRoleData.crm_acess === "boolean"
              ? updatedRoleData.crm_acess
              : null;
          setCrmAccess(normalizeBinary(updatedCrmAccess));

          const updatedLevel =
            typeof updatedRoleData.crm_access_level === "string" &&
            updatedRoleData.crm_access_level.length > 0
              ? updatedRoleData.crm_access_level
              : typeof updatedRoleData.crm_level_access === "string" &&
                updatedRoleData.crm_level_access.length > 0
              ? updatedRoleData.crm_level_access
              : typeof updatedRoleData.crm_level_acess === "string" &&
                updatedRoleData.crm_level_acess.length > 0
              ? updatedRoleData.crm_level_acess
              : null;
          setCrmLevel(normalizeRole(updatedLevel));
        }
      } else {
        await logger.warning(
          "Colaborador sem vínculo de usuário ao tentar atualizar permissões",
          "COLAB_USER_ROLE_MISSING_USER",
          { colaboradorId: id }
        );
      }

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

      toast.success("Colaborador atualizado com sucesso!");
    } catch (error: any) {
      await logger.error(
        "Erro ao atualizar colaborador",
        "COLAB_UPDATE_ERROR",
        buildErrorContext(error, {
          colaboradorId: id,
          role,
          status,
          wppAccess,
          crmAccess,
          crmLevel,
          currentColaborador: colaborador,
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
              <CardContent className="flex flex-col gap-6">
                <div className="flex flex-col gap-6 lg:flex-row">
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
                </div>
                <Separator className="border-muted-foreground/20" />
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col">
                    <p className="text-base font-semibold text-foreground">
                      Status do Colaborador
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Controle o status atual do colaborador.
                    </p>
                  </div>
                  <Select
                    value={status}
                    onValueChange={(value) => {
                      const selectedStatus = value as "ativo" | "ferias" | "afastado" | "desligado";

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
              <CardHeader className="space-y-1">
                <CardTitle className="text-lg">Permissões e Acessos</CardTitle>
                <CardDescription>Defina como o colaborador acessa os sistemas e canais.</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nivel_acesso">Nível de acesso</Label>
                    <Select
                      value={role}
                      onValueChange={(value) => setRole(value as AccessLevel)}
                    >
                      <SelectTrigger
                        id="nivel_acesso"
                        className={`${selectTriggerClasses} w-full`}
                        aria-label="Selecione o nível de acesso"
                      >
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wpp_acess">Acesso WhatsApp</Label>
                    <Select
                      value={wppAccess}
                      onValueChange={(value) => setWppAccess(value as BinaryAccess)}
                    >
                      <SelectTrigger
                        id="wpp_acess"
                        className={`${selectTriggerClasses} w-full`}
                        aria-label="Defina se o colaborador acessa o WhatsApp"
                      >
                        <SelectValue placeholder="Selecione uma opção" />
                      </SelectTrigger>
                      <SelectContent>
                        {binaryOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="crm_access">Acesso CRM</Label>
                    <Select
                      value={crmAccess}
                      onValueChange={(value) => {
                        const nextValue = value as BinaryAccess;
                        setCrmAccess(nextValue);
                        if (nextValue === "nao") {
                          setCrmLevel("geral");
                        }
                      }}
                    >
                      <SelectTrigger
                        id="crm_access"
                        className={`${selectTriggerClasses} w-full`}
                        aria-label="Defina se o colaborador acessa o CRM"
                      >
                        <SelectValue placeholder="Selecione uma opção" />
                      </SelectTrigger>
                      <SelectContent>
                        {binaryOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="crm_level">CRM Nível</Label>
                    <Select
                      value={crmLevel}
                      onValueChange={(value) => setCrmLevel(value as AccessLevel)}
                      disabled={crmAccess === "nao"}
                    >
                      <SelectTrigger
                        id="crm_level"
                        className={`${selectTriggerClasses} w-full`}
                        aria-label="Defina o nível de acesso ao CRM"
                      >
                        <SelectValue placeholder="Selecione o nível do CRM" />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((option) => (
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
