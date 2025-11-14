import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
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

export default function Colaboradores() {
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchColaboradores();
  }, []);

  const fetchColaboradores = async () => {
    const { data, error } = await supabase
      .from("colaborador")
      .select(
        "id_colaborador, nome, sobrenome, apelido, cargo, email_corporativo, colab_ferias, colab_afastado, colab_ativo, id_clickup"
      )
      .order("nome", { ascending: true });

    if (error) {
      await logger.error("Erro ao buscar colaboradores", "COLAB_LIST_FETCH_ERROR", {
        errorMessage: error.message,
        errorDetails: error.details,
        errorHint: error.hint,
        errorCode: error.code,
      });
      return;
    }
    setColaboradores(data || []);
  };

  const filteredColaboradores = colaboradores.filter((colab) => {
    const nomeCompleto = `${colab.nome} ${colab.sobrenome}`.toLowerCase();
    return nomeCompleto.includes(searchTerm.toLowerCase());
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Colaboradores</h1>
            <p className="text-muted-foreground">Gerencie a equipe da agência</p>
          </div>
          <Button onClick={() => navigate("/colaboradores/novo")}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Colaborador
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Apelido</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Email Corporativo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>ID ClickUp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredColaboradores.map((colab) => (
                <TableRow
                  key={colab.id_colaborador}
                  className="cursor-pointer"
                  onClick={() => navigate(`/colaboradores/${colab.id_colaborador}`)}
                >
                  <TableCell className="font-medium">
                    {colab.nome} {colab.sobrenome}
                  </TableCell>
                  <TableCell>{colab.apelido}</TableCell>
                  <TableCell>{colab.cargo}</TableCell>
                  <TableCell>{colab.email_corporativo}</TableCell>
                  <TableCell>
                    {colab.colab_ferias ? (
                      <Badge variant="secondary">Férias</Badge>
                    ) : colab.colab_afastado ? (
                      <Badge variant="destructive">Afastado</Badge>
                    ) : colab.colab_ativo ? (
                      <Badge>Ativo</Badge>
                    ) : (
                      <Badge variant="outline">Inativo</Badge>
                    )}
                  </TableCell>
                  <TableCell>{colab.id_clickup || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
}
