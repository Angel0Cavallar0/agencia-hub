import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

export default function Clientes() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAtivo, setFilterAtivo] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    let query = supabase
      .from("clientes_infos")
      .select("id_cliente, nome_cliente, cnpj, segmento, cliente_ativo, gestao_trafego, data_contrato")
      .order("nome_cliente", { ascending: true });

    if (filterAtivo !== null) {
      query = query.eq("cliente_ativo", filterAtivo);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Erro ao buscar clientes:", error);
      return;
    }

    setClientes(data || []);
  };

  useEffect(() => {
    fetchClientes();
  }, [filterAtivo]);

  const filteredClientes = clientes.filter((cliente) =>
    cliente.nome_cliente?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
            <p className="text-muted-foreground">Gerencie os clientes da agência</p>
          </div>
          <Button onClick={() => navigate("/clientes/novo")}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterAtivo === null ? "default" : "outline"}
              onClick={() => setFilterAtivo(null)}
            >
              Todos
            </Button>
            <Button
              variant={filterAtivo === true ? "default" : "outline"}
              onClick={() => setFilterAtivo(true)}
            >
              Ativos
            </Button>
            <Button
              variant={filterAtivo === false ? "default" : "outline"}
              onClick={() => setFilterAtivo(false)}
            >
              Inativos
            </Button>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Segmento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Gestão de Tráfego</TableHead>
                <TableHead>Data Contrato</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClientes.map((cliente) => (
                <TableRow
                  key={cliente.id_cliente}
                  className="cursor-pointer"
                  onClick={() => navigate(`/clientes/${cliente.id_cliente}`)}
                >
                  <TableCell className="font-medium">{cliente.nome_cliente}</TableCell>
                  <TableCell>{cliente.cnpj}</TableCell>
                  <TableCell>{cliente.segmento}</TableCell>
                  <TableCell>
                    <Badge variant={cliente.cliente_ativo ? "default" : "secondary"}>
                      {cliente.cliente_ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {cliente.gestao_trafego ? (
                      <Badge>Sim</Badge>
                    ) : (
                      <Badge variant="outline">Não</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {cliente.data_contrato
                      ? new Date(cliente.data_contrato).toLocaleDateString("pt-BR")
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
}
