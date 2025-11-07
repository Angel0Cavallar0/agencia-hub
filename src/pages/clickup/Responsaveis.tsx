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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedCliente) {
      fetchResponsaveis();
      setCurrentPage(0);
    }
  }, [selectedCliente]);

  const fetchData = async () => {
    try {
      const [clientesRes, colaboradoresRes] = await Promise.all([
        supabase
          .from("clientes_infos")
          .select("id_cliente, nome_cliente")
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

  const rolesPerPage = 4;
  const totalPages = Math.ceil(roles.length / rolesPerPage);

  const paginatedRoles = roles.slice(
    currentPage * rolesPerPage,
    currentPage * rolesPerPage + rolesPerPage
  );

  return (
    <Layout>
      <div className="space-y-6 w-full max-w-6xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Responsáveis ClickUp</h1>
          <p className="text-muted-foreground">
            Gerencie os responsáveis por cliente no ClickUp
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr,2fr]">
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
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  {paginatedRoles.map((roleItem) => (
                    <div key={roleItem.key} className="space-y-2">
                      <Label>{roleItem.label}</Label>
                      <Select
                        value={responsaveis[roleItem.key] || ""}
                        onValueChange={(value) =>
                          setResponsaveis({ ...responsaveis, [roleItem.key]: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um colaborador" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {colaboradores.map((colab) => (
                            <SelectItem
                              key={colab.id_clickup}
                              value={colab.id_clickup || ""}
                            >
                              {colab.nome} {colab.sobrenome} ({colab.apelido})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <Pagination className="justify-end">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(event) => {
                            event.preventDefault();
                            setCurrentPage((prev) => Math.max(prev - 1, 0));
                          }}
                          className={currentPage === 0 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }).map((_, index) => (
                        <PaginationItem key={index}>
                          <PaginationLink
                            href="#"
                            isActive={currentPage === index}
                            onClick={(event) => {
                              event.preventDefault();
                              setCurrentPage(index);
                            }}
                          >
                            {index + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(event) => {
                            event.preventDefault();
                            setCurrentPage((prev) =>
                              Math.min(prev + 1, totalPages - 1)
                            );
                          }}
                          className={
                            currentPage === totalPages - 1
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}

                <Button onClick={handleSave} className="w-full">
                  Salvar Responsáveis
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
