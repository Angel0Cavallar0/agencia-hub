import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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

type StatusValue = "ativo" | "ferias" | "afastado";

type ColaboradoresRow = Database["public"]["Tables"]["colaborador"]["Row"];
type ColaboradoresInsert = Database["public"]["Tables"]["colaborador"]["Insert"];

const COLABORADOR_TABLE = "colaborador" satisfies keyof Database["public"]["Tables"];

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
  });

  const [status, setStatus] = useState<StatusValue>("ativo");

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

  const statusOptions: { value: StatusValue; label: string; description: string }[] = [
    {
      value: "ativo",
      label: "Ativo",
      description: "Colaborador trabalhando normalmente.",
    },
    {
      value: "ferias",
      label: "Em Férias",
      description: "Colaborador em período de férias.",
    },
    {
      value: "afastado",
      label: "Afastado",
      description: "Colaborador afastado temporariamente.",
    },
  ];

  const cardSurfaceClasses =
    "rounded-xl border border-black/30 bg-white/90 shadow-md transition-colors dark:border-white/20 dark:bg-slate-900/70";
  const inputSurfaceClasses =
    "rounded-lg border border-black/10 bg-muted dark:border-white/15 dark:bg-slate-900/60";
  const selectTriggerClasses =
    "min-w-[260px] sm:min-w-[300px] h-12 rounded-lg border border-black/20 bg-white/80 text-left dark:border-white/20 dark:bg-slate-900/60";

  const handleStatusChange = (value: StatusValue) => {
    setStatus(value);
    setFormData({
      ...formData,
      colab_ativo: value === "ativo",
      colab_ferias: value === "ferias",
      colab_afastado: value === "afastado",
    });
  };

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
      const payload: ColaboradoresInsert = {
        ...formData,
        admin: false,
        supervisor: false,
      };

      Object.entries(payload).forEach(([key, value]) => {
        if (typeof value === "string") {
          const trimmedValue = value.trim();
          (payload as Record<string, unknown>)[key] = trimmedValue === "" ? null : trimmedValue;
        }
      });

      const { data: colaboradorData, error: colaboradorError } = await supabase
        .from(COLABORADOR_TABLE)
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
              .from(COLABORADOR_TABLE)
              .update({ foto_url: publicUrl })
              .eq("id_colaborador", colaboradorData!.id_colaborador)
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
            ? {
                nome: privateData.contato_emergencia_nome,
                telefone: privateData.contato_emergencia_telefone,
              }
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
      <div className="w-full max-w-6xl space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/colaboradores")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Novo Colaborador</h1>
                <p className="text-muted-foreground">Cadastre um novo membro da equipe</p>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="min-w-[180px]">
              {loading ? "Salvando..." : "Criar Colaborador"}
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
                        onClick={() => document.getElementById("foto_colaborador")?.click()}
                        className="h-8 rounded-full bg-emerald-800 px-4 text-xs font-semibold tracking-wide text-white hover:bg-emerald-900"
                      >
                        CARREGAR FOTO
                      </Button>
                    </div>
                  </div>
                  <div className="grid flex-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                    <Label htmlFor="nome">Nome *</Label>
                      <Input
                        id="nome"
                        required
                        value={formData.nome}
                        className={inputSurfaceClasses}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sobrenome">Sobrenome</Label>
                      <Input
                        id="sobrenome"
                        value={formData.sobrenome}
                        className={inputSurfaceClasses}
                        onChange={(e) => setFormData({ ...formData, sobrenome: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apelido">Apelido</Label>
                      <Input
                        id="apelido"
                        value={formData.apelido}
                        className={inputSurfaceClasses}
                        onChange={(e) => setFormData({ ...formData, apelido: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cargo">Cargo</Label>
                      <Input
                        id="cargo"
                        value={formData.cargo}
                        className={inputSurfaceClasses}
                        onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="email_corporativo">E-mail Corporativo</Label>
                      <Input
                        id="email_corporativo"
                        type="email"
                        value={formData.email_corporativo}
                        className={`md:max-w-xl ${inputSurfaceClasses}`}
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
                        className={inputSurfaceClasses}
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
                        className={inputSurfaceClasses}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            id_slack: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="data_admissao">Data de Contratação</Label>
                      <Input
                        id="data_admissao"
                        type="date"
                        value={formData.data_admissao}
                        className={inputSurfaceClasses}
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

                <Separator className="border-muted-foreground/20" />

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col">
                    <p className="text-base font-semibold text-foreground">Status do Colaborador</p>
                    <p className="text-sm text-muted-foreground">
                      Controle o status atual do colaborador.
                    </p>
                  </div>
                  <Select value={status} onValueChange={(value) => handleStatusChange(value as StatusValue)}>
                    <SelectTrigger
                      id="status_colaborador"
                      className={selectTriggerClasses}
                      aria-label="Selecione o status do colaborador"
                    >
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
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
              </CardContent>
            </Card>

            {userRole === "admin" && (
              <Card className={`order-2 ${cardSurfaceClasses}`}>
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-semibold text-foreground">
                    Dados Sensíveis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="cpf">CPF</Label>
                      <Input
                        id="cpf"
                        value={privateData.cpf}
                        placeholder="000.000.000-00"
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
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endereco">Endereço Residencial</Label>
                    <Input
                      id="endereco"
                      value={privateData.endereco}
                      className={inputSurfaceClasses}
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
                      className={inputSurfaceClasses}
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
                      className={inputSurfaceClasses}
                      onChange={(e) =>
                        setPrivateData({
                          ...privateData,
                          data_aniversario: e.target.value,
                        })
                      }
                    />
                  </div>
                  <Separator className="border-muted-foreground/20" />
                  <div className="space-y-4">
                    <h4 className="text-base font-semibold text-foreground">Contatos de emergência</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="contato_emergencia_nome">Nome</Label>
                        <Input
                          id="contato_emergencia_nome"
                          placeholder="Ex: Marcia"
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
                        <Label htmlFor="contato_emergencia_telefone">Telefone</Label>
                        <PhoneInput
                          value={privateData.contato_emergencia_telefone}
                          className={inputSurfaceClasses}
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
        </form>
      </div>
    </Layout>
  );
}
