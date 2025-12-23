import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

export default function ClickupResponsaveis() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<string>("");
  const [responsaveis, setResponsaveis] = useState<any>({
    atendimento_id: "",
    design_id: "",
    aprovacao_video_id: "",
    aprovacao_arte_id: "",
    revisao_texto_id: "",
    filmmaker_id: "",
    gestor_trafego_id: "",
    gerente_conta_id: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedCliente) {
      fetchResponsaveis();
    }
  }, [selectedCliente]);

  const fetchData = async () => {
    try {
      const [clientesRes, colaboradoresRes] = await Promise.all([
        supabase
          .from("clientes_infos")
          .select("id_cliente, nome_cliente")
          .eq("cliente_ativo", true)
          .order("nome_cliente", { ascending: true }),
        supabase
          .from("colaborador")
          .select("id_clickup, nome, sobrenome, apelido")
          .eq("colab_ativo", true)
          .order("nome", { ascending: true }),
      ]);

      if (clientesRes.data) setClientes(clientesRes.data);
      if (colaboradoresRes.data) setColaboradores(colaboradoresRes.data);
    } catch (error: any) {
      await logger.error("Erro ao carregar dados", "RESP_FETCH_ERROR", {
        errorMessage: error.message,
      });
      toast.error("Erro ao carregar dados");
    }
  };

  const fetchResponsaveis = async () => {
    const { data, error } = await supabase
      .from("clickup_responsaveis")
      .select(
        "id_cliente, atendimento_id, design_id, aprovacao_video_id, aprovacao_arte_id, revisao_texto_id, filmmaker_id, gestor_trafego_id, gerente_conta_id"
      )
      .eq("id_cliente", selectedCliente)
      .maybeSingle();

    if (data) {
      setResponsaveis(data);
    } else {
      setResponsaveis({
        atendimento_id: "",
        design_id: "",
        aprovacao_video_id: "",
        aprovacao_arte_id: "",
        revisao_texto_id: "",
        filmmaker_id: "",
        gestor_trafego_id: "",
        gerente_conta_id: "",
      });
    }
  };

  const handleSave = async () => {
    if (!selectedCliente) {
      toast.error("Selecione um cliente");
      return;
    }

    try {
      const { error } = await supabase
        .from("clickup_responsaveis")
        .upsert({ id_cliente: selectedCliente, ...responsaveis });

      if (error) throw error;

      await logger.success("Responsáveis do cliente salvos", {
        clienteId: selectedCliente,
      });

      toast.success("Responsáveis salvos com sucesso!");
    } catch (error: any) {
      await logger.error("Erro ao salvar responsáveis do cliente", "CLICKUP_RESP_SAVE_ERROR", {
        errorMessage: error.message,
        errorStack: error.stack,
        clienteId: selectedCliente,
        payload: responsaveis,
      });
      toast.error("Erro ao salvar responsáveis");
    }
  };

  const roles = [
    { key: "atendimento_id", label: "Atendimento" },
    { key: "design_id", label: "Design" },
    { key: "aprovacao_video_id", label: "Aprovação de Vídeo" },
    { key: "aprovacao_arte_id", label: "Aprovação de Arte" },
    { key: "revisao_texto_id", label: "Revisão de Texto" },
    { key: "filmmaker_id", label: "Filmmaker" },
    { key: "gestor_trafego_id", label: "Gestor de Tráfego" },
    { key: "gerente_conta_id", label: "Gerente de Contas" },
  ];

  return (
    <Layout>
      <div className="space-y-6 w-full max-w-5xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Responsáveis ClickUp</h1>
            <p className="text-muted-foreground">
              Gerencie os responsáveis por cliente no ClickUp
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full lg:w-auto lg:flex-row lg:items-center lg:justify-end">
            <div className="flex flex-col gap-2 w-full lg:flex-row lg:items-center lg:gap-3">
              <span className="text-sm font-medium text-muted-foreground lg:text-base">
                Selecione o cliente
              </span>
              <Select value={selectedCliente} onValueChange={setSelectedCliente}>
                <SelectTrigger className="w-full min-w-[220px] bg-background border border-border/80 dark:bg-muted/50">
                  <SelectValue placeholder="Selecionar Cliente" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id_cliente} value={cliente.id_cliente}>
                      {cliente.nome_cliente}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleSave} disabled={!selectedCliente}>
              Salvar Informações
            </Button>
          </div>
        </div>

        <div className="w-full">
          <Card className="w-full max-w-5xl border border-border/60 bg-card/60 backdrop-blur">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">Funções e Responsáveis</CardTitle>
              <p className="text-sm text-muted-foreground">
                Defina os responsáveis por cada etapa
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                {roles.map((roleItem) => (
                  <div key={roleItem.key} className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">
                      {roleItem.label}
                    </Label>
                    <Select
                      value={responsaveis[roleItem.key] || ""}
                      onValueChange={(value) =>
                        setResponsaveis({ ...responsaveis, [roleItem.key]: value })
                      }
                      disabled={!selectedCliente}
                    >
                      <SelectTrigger className="bg-background text-foreground border border-border/70 dark:bg-muted/60 dark:text-foreground">
                        <SelectValue placeholder="Selecione um colaborador" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {colaboradores.map((colab) => (
                          <SelectItem key={colab.id_clickup} value={colab.id_clickup || ""}>
                            {colab.nome} {colab.sobrenome} ({colab.apelido})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
