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
        supabase.from("clientes_infos").select("*").order("nome_cliente", { ascending: true }),
        supabase.from("colaborador").select("*").eq("colab_ativo", true).order("nome", { ascending: true }),
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
      .select("*")
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
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Responsáveis ClickUp</h1>
          <p className="text-muted-foreground">
            Gerencie os responsáveis por cliente no ClickUp
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Selecionar Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={selectedCliente} onValueChange={setSelectedCliente}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id_cliente} value={cliente.id_cliente}>
                      {cliente.nome_cliente}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {selectedCliente && (
          <Card>
            <CardHeader>
              <CardTitle>Funções e Responsáveis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {roles.map((role) => (
                <div key={role.key} className="space-y-2">
                  <Label>{role.label}</Label>
                  <Select
                    value={responsaveis[role.key] || ""}
                    onValueChange={(value) =>
                      setResponsaveis({ ...responsaveis, [role.key]: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um colaborador" />
                    </SelectTrigger>
                    <SelectContent>
                      {colaboradores.map((colab) => (
                        <SelectItem key={colab.id_clickup} value={colab.id_clickup || ""}>
                          {colab.nome} {colab.sobrenome} ({colab.apelido})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
              <Button onClick={handleSave} className="w-full">
                Salvar Responsáveis
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
