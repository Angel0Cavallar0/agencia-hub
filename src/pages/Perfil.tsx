import { useCallback, useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { logger } from "@/lib/logger";

const emptyColaborador = {
  id_colaborador: null as string | null,
  nome: "",
  sobrenome: "",
  apelido: "",
  cargo: "",
  email_corporativo: "",
  foto_url: null as string | null,
  data_admissao: null as string | null,
  data_aniversario: null as string | null,
  data_desligamento: null as string | null,
  colab_ativo: null as boolean | null,
  colab_ferias: null as boolean | null,
  colab_afastado: null as boolean | null,
  colab_desligado: null as boolean | null,
  admin: null as boolean | null,
  supervisor: null as boolean | null,
};

const emptyPrivateData = {
  email_pessoal: "",
  telefone_pessoal: "",
  cpf: "",
  rg: "",
  data_nascimento: "",
  endereco: "",
  contato_emergencia_nome: "",
  contato_emergencia_telefone: "",
};

type ColaboradorState = typeof emptyColaborador;
type PrivateDataState = typeof emptyPrivateData;

type ColaboradorRow = Database["public"]["Tables"]["colaborador"]["Row"];
type ColaboradorPrivateRow = Database["public"]["Tables"]["colaborador_private"]["Row"];
type UserRoleRow = Database["public"]["Tables"]["user_roles"]["Row"] & {
  wpp_acess?: boolean | null;
  wpp_access?: boolean | null;
  crm_access?: boolean | null;
  crm_acess?: boolean | null;
  crm_access_level?: string[] | string | null;
  crm_level_access?: string[] | string | null;
  crm_level_acess?: string[] | string | null;
};

type EmergencyContact = {
  nome: string;
  telefone: string;
};

function parseEmergencyContact(value: ColaboradorPrivateRow["contato_emergencia"]): EmergencyContact {
  if (!value) {
    return { nome: "", telefone: "" };
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as EmergencyContact;
      return {
        nome: typeof parsed?.nome === "string" ? parsed.nome : "",
        telefone: typeof parsed?.telefone === "string" ? parsed.telefone : "",
      };
    } catch {
      const [nome, telefone] = value.split("|").map((part) => part.trim());
      return { nome: nome ?? value, telefone: telefone ?? "" };
    }
  }

  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const objValue = value as { nome?: unknown; telefone?: unknown };
    return {
      nome: typeof objValue.nome === "string" ? objValue.nome : "",
      telefone: typeof objValue.telefone === "string" ? objValue.telefone : "",
    };
  }

  return { nome: "", telefone: "" };
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Não informado";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const normalized = value.split("T")[0];
    return normalized && normalized.length > 0 ? normalized.split("-").reverse().join("/") : "Não informado";
  }

  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function formatValue(value: string | null | undefined) {
  if (!value) return "Não informado";
  const trimmed = value.toString().trim();
  return trimmed.length > 0 ? trimmed : "Não informado";
}

export default function Perfil() {
  const { user } = useAuth();
  const [colaborador, setColaborador] = useState<ColaboradorState>({ ...emptyColaborador });
  const [privateData, setPrivateData] = useState<PrivateDataState>({ ...emptyPrivateData });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wppAccess, setWppAccess] = useState<boolean | null>(null);
  const [crmAccess, setCrmAccess] = useState<boolean | null>(null);
  const [crmAccessLevels, setCrmAccessLevels] = useState<string[]>([]);

  const displayName = useMemo(() => {
    if (colaborador.apelido) return colaborador.apelido;
    const parts = [colaborador.nome, colaborador.sobrenome].filter(Boolean);
    if (parts.length > 0) return parts.join(" ");
    return user?.email ?? "";
  }, [colaborador.apelido, colaborador.nome, colaborador.sobrenome, user?.email]);

  const initials = useMemo(() => {
    if (!displayName) return "?";
    const [first = "", second = ""] = displayName.trim().split(/\s+/);
    const firstInitial = first.charAt(0);
    const secondInitial = second.charAt(0);
    const combined = `${firstInitial}${secondInitial}`.toUpperCase();
    if (combined.trim().length > 0) return combined;
    if (firstInitial) return firstInitial.toUpperCase();
    return "?";
  }, [displayName]);

  const activeStatusBadges = useMemo(
    () =>
      [
        { label: "Ativo", active: colaborador.colab_ativo === true },
        { label: "Férias", active: colaborador.colab_ferias === true },
        { label: "Afastado", active: colaborador.colab_afastado === true },
        { label: "Desligado", active: colaborador.colab_desligado === true },
      ].filter((badge) => badge.active),
    [colaborador.colab_afastado, colaborador.colab_ativo, colaborador.colab_desligado, colaborador.colab_ferias]
  );

  const activeAccessBadges = useMemo(
    () =>
      [
        { label: "Administrador", active: colaborador.admin === true },
        { label: "Supervisor", active: colaborador.supervisor === true },
      ].filter((badge) => badge.active),
    [colaborador.admin, colaborador.supervisor]
  );

  const loadProfile = useCallback(async () => {
    if (!user?.id) {
      setColaborador({ ...emptyColaborador });
      setPrivateData({ ...emptyPrivateData });
      setError("Usuário não autenticado.");
      setLoading(false);
      setWppAccess(null);
      setCrmAccess(null);
      setCrmAccessLevels([]);
      return;
    }

    setLoading(true);
    setError(null);
    setWppAccess(null);
    setCrmAccess(null);
    setCrmAccessLevels([]);

    try {
      const { data: colaboradorData, error: colaboradorError } = await supabase
        .from("colaborador")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (colaboradorError) {
        throw colaboradorError;
      }

      if (!colaboradorData) {
        setColaborador({ ...emptyColaborador });
        setPrivateData({ ...emptyPrivateData });
        setError("Não encontramos um cadastro de colaborador vinculado a este usuário.");
        setWppAccess(null);
        setCrmAccess(null);
        setCrmAccessLevels([]);
        return;
      }

      const colaboradorRow = colaboradorData as ColaboradorRow;

      setColaborador({
        id_colaborador: colaboradorRow.id_colaborador ?? null,
        nome: colaboradorRow.nome ?? "",
        sobrenome: colaboradorRow.sobrenome ?? "",
        apelido: colaboradorRow.apelido ?? "",
        cargo: colaboradorRow.cargo ?? "",
        email_corporativo: colaboradorRow.email_corporativo ?? "",
        foto_url: colaboradorRow.foto_url ?? null,
        data_admissao: colaboradorRow.data_admissao ?? null,
        data_aniversario: colaboradorRow.data_aniversario ?? null,
        data_desligamento: colaboradorRow.data_desligamento ?? null,
        colab_ativo: colaboradorRow.colab_ativo ?? null,
        colab_ferias: colaboradorRow.colab_ferias ?? null,
        colab_afastado: colaboradorRow.colab_afastado ?? null,
        colab_desligado: colaboradorRow.colab_desligado ?? null,
        admin: colaboradorRow.admin ?? null,
        supervisor: colaboradorRow.supervisor ?? null,
      });

      const { data: userRolesRow, error: userRolesError } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (userRolesError) {
        await logger.warning("Erro ao buscar dados de permissões", "PROFILE_ROLE_PERMISSION_ERROR", {
          errorMessage: userRolesError.message,
        });
      } else {
        const roleRow = userRolesRow as UserRoleRow | null;
        const resolvedWppAccess =
          typeof roleRow?.wpp_acess === "boolean"
            ? roleRow.wpp_acess
            : typeof roleRow?.wpp_access === "boolean"
            ? roleRow.wpp_access
            : null;
        setWppAccess(resolvedWppAccess);

        const resolvedCrmAccess =
          typeof roleRow?.crm_access === "boolean"
            ? roleRow.crm_access
            : typeof roleRow?.crm_acess === "boolean"
            ? roleRow.crm_acess
            : null;
        setCrmAccess(resolvedCrmAccess);

        const normalizedCrmLevels = (() => {
          const rawLevels =
            roleRow?.crm_access_level ?? roleRow?.crm_level_access ?? roleRow?.crm_level_acess;

          if (!rawLevels) {
            return [];
          }

          if (Array.isArray(rawLevels)) {
            return rawLevels.filter((value): value is string => typeof value === "string" && value.trim().length > 0);
          }

          if (typeof rawLevels === "string") {
            try {
              const parsed = JSON.parse(rawLevels);
              if (Array.isArray(parsed)) {
                return parsed.filter((value): value is string => typeof value === "string" && value.trim().length > 0);
              }
            } catch {
              return rawLevels
                .split(/[,|]/)
                .map((value) => value.trim())
                .filter((value) => value.length > 0);
            }

            return rawLevels.trim().length > 0 ? [rawLevels.trim()] : [];
          }

          return [];
        })();

        setCrmAccessLevels(normalizedCrmLevels);
      }

      if (colaboradorRow.id_colaborador) {
        const { data: privateRow, error: privateError } = await supabase
          .from("colaborador_private")
          .select("*")
          .eq("id_colaborador", colaboradorRow.id_colaborador)
          .maybeSingle();

        if (privateError) {
          throw privateError;
        }

        if (privateRow) {
          const privateDataRow = privateRow as ColaboradorPrivateRow;
          const emergency = parseEmergencyContact(privateDataRow.contato_emergencia);

          setPrivateData({
            email_pessoal: privateDataRow.email_pessoal ?? "",
            telefone_pessoal: privateDataRow.telefone_pessoal ?? "",
            cpf: privateDataRow.cpf ?? "",
            rg: privateDataRow.rg ?? "",
            data_nascimento: privateDataRow.data_aniversario ?? "",
            endereco: privateDataRow.endereco ?? "",
            contato_emergencia_nome: emergency.nome,
            contato_emergencia_telefone: emergency.telefone,
          });
        } else {
          setPrivateData({ ...emptyPrivateData });
        }
      } else {
        setPrivateData({ ...emptyPrivateData });
      }
    } catch (loadError) {
      console.error(loadError);
      await logger.error("Erro ao carregar dados do perfil", "PROFILE_LOAD_ERROR", {
        errorMessage: loadError instanceof Error ? loadError.message : String(loadError),
      });
      setError("Não foi possível carregar suas informações. Tente novamente mais tarde.");
      setWppAccess(null);
      setCrmAccess(null);
      setCrmAccessLevels([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const fullName = useMemo(() => {
    const parts = [colaborador.nome, colaborador.sobrenome].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : "Não informado";
  }, [colaborador.nome, colaborador.sobrenome]);

  const formattedAdmission = useMemo(() => formatDate(colaborador.data_admissao), [colaborador.data_admissao]);
  const formattedPersonalBirthday = useMemo(() => formatDate(privateData.data_nascimento), [privateData.data_nascimento]);

  const statusAndAccessBadges = useMemo(() => {
    const badges = [...activeStatusBadges];

    if (wppAccess) {
      badges.push({ label: "Permissão WhatsApp", active: true });
    }

    if (crmAccess) {
      badges.push({ label: "Acesso CRM", active: true });
    }

    if (crmAccessLevels.length > 0) {
      crmAccessLevels.forEach((level) => {
        badges.push({ label: `CRM ${level}`, active: true });
      });
    }

    if (activeAccessBadges.length > 0) {
      activeAccessBadges.forEach((badge) => {
        badges.push({ label: badge.label, active: true });
      });
    } else {
      badges.push({ label: "Colaborador", active: true });
    }

    return badges;
  }, [activeAccessBadges, activeStatusBadges, crmAccess, crmAccessLevels, wppAccess]);

  return (
    <Layout>
      <div className="flex w-full flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
          <p className="text-muted-foreground">
            Consulte suas informações cadastradas, o status atual e os níveis de acesso que você possui na Leon.
          </p>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Carregando informações do perfil...
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={loadProfile}>Tentar novamente</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-6">
            <Card>
              <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    {colaborador.foto_url ? (
                      <AvatarImage src={colaborador.foto_url} alt={displayName || "Foto do perfil"} />
                    ) : (
                      <AvatarFallback>{initials}</AvatarFallback>
                    )}
                  </Avatar>
                  <div className="space-y-1">
                    <p className="text-lg font-semibold text-foreground">{displayName || "Usuário"}</p>
                    <p className="text-sm text-muted-foreground">{formatValue(colaborador.cargo)}</p>
                    <p className="text-sm text-muted-foreground">
                      ID do colaborador: {formatValue(colaborador.id_colaborador)}
                    </p>
                  </div>
                </div>
                <div className="flex w-full flex-col gap-4 md:w-auto md:items-end">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status e acessos</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {statusAndAccessBadges.length > 0 ? (
                        statusAndAccessBadges.map((badge) => <Badge key={badge.label}>{badge.label}</Badge>)
                      ) : (
                        <span className="text-sm text-muted-foreground">Nenhum status ativo registrado</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informações profissionais</CardTitle>
                <CardDescription>Dados cadastrados para uso interno e relacionamento com clientes.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <dl className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <dt className="text-sm font-medium text-muted-foreground">Nome completo</dt>
                    <dd className="text-sm font-semibold text-foreground">{fullName}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-sm font-medium text-muted-foreground">Apelido</dt>
                    <dd className="text-sm font-semibold text-foreground">{formatValue(colaborador.apelido)}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-sm font-medium text-muted-foreground">Cargo</dt>
                    <dd className="text-sm font-semibold text-foreground">{formatValue(colaborador.cargo)}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-sm font-medium text-muted-foreground">E-mail corporativo</dt>
                    <dd className="text-sm font-semibold text-foreground">
                      {formatValue(colaborador.email_corporativo || user?.email)}
                    </dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-sm font-medium text-muted-foreground">Data de admissão</dt>
                    <dd className="text-sm font-semibold text-foreground">{formattedAdmission}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informações pessoais</CardTitle>
                <CardDescription>Esses dados são privados e visíveis apenas para você.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <dl className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <dt className="text-sm font-medium text-muted-foreground">E-mail pessoal</dt>
                    <dd className="text-sm font-semibold text-foreground">{formatValue(privateData.email_pessoal)}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-sm font-medium text-muted-foreground">Telefone pessoal</dt>
                    <dd className="text-sm font-semibold text-foreground">{formatValue(privateData.telefone_pessoal)}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-sm font-medium text-muted-foreground">CPF</dt>
                    <dd className="text-sm font-semibold text-foreground">{formatValue(privateData.cpf)}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-sm font-medium text-muted-foreground">RG</dt>
                    <dd className="text-sm font-semibold text-foreground">{formatValue(privateData.rg)}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-sm font-medium text-muted-foreground">Data de nascimento</dt>
                    <dd className="text-sm font-semibold text-foreground">{formattedPersonalBirthday}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-sm font-medium text-muted-foreground">Contato de emergência</dt>
                    <dd className="text-sm font-semibold text-foreground">
                      {formatValue(privateData.contato_emergencia_nome)}
                    </dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-sm font-medium text-muted-foreground">Telefone do contato</dt>
                    <dd className="text-sm font-semibold text-foreground">
                      {formatValue(privateData.contato_emergencia_telefone)}
                    </dd>
                  </div>
                </dl>
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-muted-foreground">Endereço residencial</h3>
                  <p className="text-sm font-semibold text-foreground whitespace-pre-line">
                    {formatValue(privateData.endereco)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
