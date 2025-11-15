import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PhoneInput } from "@/components/PhoneInput";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from "@/lib/logger";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];
type AccessLevel = Exclude<AppRole, "user">;
type CrmAccessLevel = Database["public"]["Enums"]["crm_access_level_enum"];
type BinaryAccess = "sim" | "nao";

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
    role: "geral" as AccessLevel,
  });

  const [crmAccess, setCrmAccess] = useState<BinaryAccess>("nao");
  const [crmLevel, setCrmLevel] = useState<CrmAccessLevel>("negado");
  const [wppAccess, setWppAccess] = useState<BinaryAccess>("nao");

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [privateData, setPrivateData] = useState({
    cpf: "",
    rg: "",
    endereco: "",
    email_pessoal: "",
    telefone_pessoal: "",
    data_aniversario: "",
    contato_emergencia_nome: "",
    contato_emergencia_telefone: "",
  });

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview(null);
      return;
    }

    const previewUrl = URL.createObjectURL(photoFile);
    setPhotoPreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [photoFile]);

  const roleOptions: { value: AccessLevel; label: string; description: string }[] = [
    {
      value: "admin",
      label: "Administrador",
      description: "Acesso completo a todas as seções e configurações.",
    },
    {
      value: "gerente",
      label: "Gerente",
      description: "Gerencia equipes, aprova processos e acompanha indicadores.",
    },
    {
      value: "supervisor",
      label: "Supervisor",
      description: "Acompanha o desempenho da equipe e distribui atividades.",
    },
    {
      value: "assistente",
      label: "Assistente",
      description: "Atua no suporte operacional com acessos controlados.",
    },
    {
      value: "geral",
      label: "Básico",
      description: "Acesso básico apenas ao necessário para o trabalho diário.",
    },
  ];

  const crmRoleOptions = roleOptions.map((option) =>
    option.value === "geral"
      ? ({
          ...option,
          value: "negado",
          label: "Negado",
        } as { value: CrmAccessLevel; label: string; description: string })
      : (option as { value: CrmAccessLevel; label: string; description: string })
  );

  const binaryOptions: { value: BinaryAccess; label: string }[] = [
    { value: "sim", label: "Sim" },
    { value: "nao", label: "Não" },
  ];

  const binaryToBoolean = (value: BinaryAccess) => value === "sim";

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhotoFile(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { role, ...rest } = formData;

      const payload = {
        ...rest,
        admin: role === "admin",
        supervisor: role === "supervisor",
      };

      const { data: colaboradorData, error: colaboradorError } = await supabase
        .from("colaborador")
        .insert([payload])
        .select()
        .single();

      if (colaboradorError) throw colaboradorError;

      let finalColaboradorData = colaboradorData;

      if (photoFile) {
        const fileExtension = photoFile.name.split(".").pop() || "jpg";
        const uniqueFileName = `${colaboradorData.id_colaborador}-${Date.now()}.${fileExtension}`;
        const filePath = `fotos_colaboradores/${uniqueFileName}`;

        const { error: uploadError } = await supabase.storage
          .from("imagens")
          .upload(filePath, photoFile, {
            cacheControl: "3600",
            upsert: true,
            contentType: photoFile.type || "image/jpeg",
          });

        if (uploadError) {
          await logger.warning("Erro ao enviar foto do colaborador", "COLAB_PHOTO_UPLOAD_ERROR", {
            errorMessage: uploadError.message,
            colaboradorId: colaboradorData.id_colaborador,
          });
          toast.error("Colaborador criado, mas houve erro ao enviar a foto");
        } else {
          const { data: publicUrlData } = supabase.storage
            .from("imagens")
            .getPublicUrl(filePath);

          const publicUrl = publicUrlData?.publicUrl;

          if (!publicUrl) {
            await logger.warning(
              "Foto do colaborador enviada, mas sem URL pública",
              "COLAB_PHOTO_URL_ERROR",
              {
                colaboradorId: colaboradorData.id_colaborador,
                filePath,
              },
            );
            toast.error("Foto enviada, mas não foi possível gerar a URL pública");
          } else {
            const { data: updatedColaborador, error: updateError } = await supabase
              .from("colaborador")
              .update({ foto_url: publicUrl })
              .eq("id_colaborador", colaboradorData.id_colaborador)
              .select()
              .maybeSingle();

            if (updateError) {
              await logger.warning(
                "Erro ao salvar URL da foto do colaborador",
                "COLAB_PHOTO_UPDATE_ERROR",
                {
                  errorMessage: updateError.message,
                  colaboradorId: colaboradorData.id_colaborador,
                },
              );
              toast.error("Colaborador criado, mas houve erro ao salvar a foto");
            } else if (updatedColaborador) {
              finalColaboradorData = updatedColaborador as typeof colaboradorData;
            }
          }
        }
      }

      if (finalColaboradorData.user_id) {
        const finalCrmLevel: CrmAccessLevel = crmAccess === "sim" ? crmLevel : "negado";

        const userRolesPayload: Database["public"]["Tables"]["user_roles"]["Insert"] = {
          user_id: finalColaboradorData.user_id,
          role,
          wpp_acess: binaryToBoolean(wppAccess),
          crm_access: binaryToBoolean(crmAccess),
          crm_access_level: finalCrmLevel,
        };

        const { error: userRolesError } = await supabase
          .from("user_roles")
          .upsert(userRolesPayload, { onConflict: "user_id" });

        if (userRolesError) {
          await logger.warning("Erro ao salvar permissões do colaborador", "COLAB_USER_ROLE_CREATE_ERROR", {
            errorMessage: userRolesError.message,
            colaboradorId: finalColaboradorData.id_colaborador,
            userId: finalColaboradorData.user_id,
          });
          toast.error("Colaborador criado, mas houve erro ao salvar permissões");
        }
      }

      if (
        userRole === "admin" &&
        (privateData.email_pessoal ||
          privateData.telefone_pessoal ||
          privateData.data_aniversario ||
          privateData.cpf ||
          privateData.rg ||
          privateData.endereco ||
          privateData.contato_emergencia_nome ||
          privateData.contato_emergencia_telefone)
      ) {
        const emergencyContact =
          privateData.contato_emergencia_nome || privateData.contato_emergencia_telefone
            ? JSON.stringify({
                nome: privateData.contato_emergencia_nome,
                telefone: privateData.contato_emergencia_telefone,
              })
            : null;

        const { error: privateError } = await supabase
          .from("colaborador_private")
          .insert({
            id_colaborador: finalColaboradorData.id_colaborador,
            email_pessoal: privateData.email_pessoal || null,
            telefone_pessoal: privateData.telefone_pessoal || null,
            data_aniversario: privateData.data_aniversario || null,
            cpf: privateData.cpf || null,
            rg: privateData.rg || null,
            endereco: privateData.endereco || null,
            contato_emergencia: emergencyContact,
          });

        if (privateError) {
          await logger.warning("Erro ao salvar dados privados do colaborador", "COLAB_PRIVATE_ERROR", {
            errorMessage: privateError.message,
            colaboradorId: finalColaboradorData.id_colaborador,
          });
          toast.error("Colaborador criado, mas houve erro ao salvar dados privados");
        }
      }

      await logger.success("Colaborador criado com sucesso", {
        colaboradorId: finalColaboradorData.id_colaborador,
        nome: finalColaboradorData.nome,
      });

      toast.success("Colaborador criado com sucesso!");
      navigate(`/colaboradores/${finalColaboradorData.id_colaborador}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao criar colaborador";
      const stack = error instanceof Error ? error.stack : undefined;

      await logger.error("Erro ao criar colaborador", "COLAB_CREATE_ERROR", {
        errorMessage: message,
        errorStack: stack,
        formData,
      });
      toast.error(message || "Erro ao criar colaborador");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6 w-full max-w-6xl mx-auto text-left">
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
          <div className="grid gap-6 xl:grid-cols-[2fr,1fr] items-start">
            <div className="space-y-6">
              <Card>
                <CardHeader className="space-y-1 text-left">
                  <CardTitle>Informações Principais</CardTitle>
                  <CardDescription>
                    Preencha os dados básicos para o cadastro do colaborador.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col gap-6 lg:flex-row">
                    <div className="flex w-full max-w-[200px] flex-col items-start gap-4">
                      <div
                        className="flex h-36 w-36 items-center justify-center rounded-full bg-emerald-800 text-sm font-semibold uppercase tracking-wide text-white"
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
                      <div className="space-y-2 text-left">
                        <input
                          id="foto_colaborador"
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-full"
                          onClick={() =>
                            document.getElementById("foto_colaborador")?.click()
                          }
                        >
                          Carregar foto
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          Utilize uma imagem quadrada para melhor resultado.
                        </p>
                      </div>
                    </div>
                    <div className="grid flex-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="nome">Nome *</Label>
                        <Input
                          id="nome"
                          required
                          value={formData.nome}
                          onChange={(e) =>
                            setFormData({ ...formData, nome: e.target.value })
                          }
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
                      <div className="space-y-2">
                        <Label htmlFor="apelido">Apelido</Label>
                        <Input
                          id="apelido"
                          value={formData.apelido}
                          onChange={(e) =>
                            setFormData({ ...formData, apelido: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cargo">Cargo</Label>
                        <Input
                          id="cargo"
                          value={formData.cargo}
                          onChange={(e) =>
                            setFormData({ ...formData, cargo: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="email_corporativo">Email Corporativo</Label>
                        <Input
                          id="email_corporativo"
                          type="email"
                          value={formData.email_corporativo}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              email_corporativo: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="id_clickup">ID ClickUp</Label>
                        <Input
                          id="id_clickup"
                          value={formData.id_clickup}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              id_clickup: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="id_slack">ID Slack</Label>
                        <Input
                          id="id_slack"
                          value={formData.id_slack}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              id_slack: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="data_admissao">Data de Admissão</Label>
                        <Input
                          id="data_admissao"
                          type="date"
                          value={formData.data_admissao}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              data_admissao: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="space-y-1 text-left">
                  <CardTitle>Status do Colaborador</CardTitle>
                  <CardDescription>
                    Defina a situação atual do colaborador na empresa.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-4">
                    <Label htmlFor="colab_ativo">Colaborador Ativo</Label>
                    <Switch
                      id="colab_ativo"
                      checked={formData.colab_ativo}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, colab_ativo: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <Label htmlFor="colab_ferias">Em Férias</Label>
                    <Switch
                      id="colab_ferias"
                      checked={formData.colab_ferias}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, colab_ferias: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <Label htmlFor="colab_afastado">Afastado</Label>
                    <Switch
                      id="colab_afastado"
                      checked={formData.colab_afastado}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, colab_afastado: checked })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader className="space-y-1 text-left">
                  <CardTitle>Acesso e Permissões</CardTitle>
                  <CardDescription>
                    Configure o nível de acesso inicial e os privilégios principais.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nivel_acesso">Nível de Acesso</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          role: value as AccessLevel,
                        })
                      }
                    >
                      <SelectTrigger id="nivel_acesso">
                        <SelectValue placeholder="Selecione o nível" />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex flex-col text-left">
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

                  <div className="space-y-2">
                    <Label htmlFor="wpp_acess">Acesso WhatsApp</Label>
                    <Select
                      value={wppAccess}
                      onValueChange={(value) => setWppAccess(value as BinaryAccess)}
                    >
                      <SelectTrigger id="wpp_acess">
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
                          setCrmLevel("negado");
                        }
                      }}
                    >
                      <SelectTrigger id="crm_access">
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
                    <Label htmlFor="crm_level">Nível do CRM</Label>
                    <Select
                      value={crmLevel}
                      onValueChange={(value) => setCrmLevel(value as CrmAccessLevel)}
                      disabled={crmAccess === "nao"}
                    >
                      <SelectTrigger id="crm_level">
                        <SelectValue placeholder="Selecione o nível do CRM" />
                      </SelectTrigger>
                      <SelectContent>
                        {crmRoleOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {userRole === "admin" && (
                <Card className="border-primary/20">
                  <CardHeader className="space-y-1 text-left">
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
                          setPrivateData({
                            ...privateData,
                            email_pessoal: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="cpf">CPF</Label>
                        <Input
                          id="cpf"
                          value={privateData.cpf}
                          placeholder="000.000.000-00"
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
                          onChange={(e) =>
                            setPrivateData({
                              ...privateData,
                              rg: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endereco">Endereço Residencial</Label>
                      <Input
                        id="endereco"
                        value={privateData.endereco}
                        onChange={(e) =>
                          setPrivateData({
                            ...privateData,
                            endereco: e.target.value,
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
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="data_aniversario">Data de Aniversário</Label>
                      <Input
                        id="data_aniversario"
                        type="date"
                        value={privateData.data_aniversario}
                        onChange={(e) =>
                          setPrivateData({
                            ...privateData,
                            data_aniversario: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="border-t pt-4 mt-4">
                      <h4 className="mb-4 font-semibold">Contatos de emergência</h4>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="contato_emergencia_nome">Nome</Label>
                          <Input
                            id="contato_emergencia_nome"
                            placeholder="Ex: Marcia"
                            value={privateData.contato_emergencia_nome}
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
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-start">
            <Button type="submit" disabled={loading}>
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
