import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import type { Database } from "@/integrations/supabase/types";

type Cliente = Database["public"]["Tables"]["clientes_infos"]["Row"];
type Contato = Database["public"]["Tables"]["cliente_contato"]["Row"];

export default function ClienteDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [openContatoDialog, setOpenContatoDialog] = useState(false);
  const [editContato, setEditContato] = useState<Contato | null>(null);
  const [deleteContatoId, setDeleteContatoId] = useState<string | null>(null);
  const [contatoFormData, setContatoFormData] = useState<
    Pick<Contato, "nome_contato" | "email" | "numero_whatsapp" | "id_grupo_whatsapp">
  >({
    nome_contato: "",
    email: "",
    numero_whatsapp: "",
    id_grupo_whatsapp: "",
  });

  useEffect(() => {
    if (id) {
      fetchCliente();
      fetchContatos();
    }
  }, [id]);

  const fetchCliente = async () => {
    const { data, error } = await supabase
      .from("clientes_infos")
      .select("*")
      .eq("id_cliente", id)
      .single();

    if (error) {
      console.error("Erro ao buscar cliente:", error);
      toast.error("Erro ao carregar cliente");
      return;
    }

    setCliente(data);
  };

  const fetchContatos = async () => {
    const { data, error } = await supabase
      .from("cliente_contato")
      .select("id_contato, nome_contato, email, numero_whatsapp, id_grupo_whatsapp")
      .eq("id_cliente", id);

    if (error) {
      console.error("Erro ao buscar contatos:", error);
      return;
    }

    setContatos((data ?? []) as Contato[]);
  };

  const handleUpdateCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!cliente) {
        throw new Error("Cliente não encontrado");
      }

      const allowedFields = [
        "nome_cliente",
        "cnpj",
        "segmento",
        "nome_responsavel",
        "data_inauguracao",
        "data_contrato",
        "cliente_ativo",
        "gestao_trafego",
      ] as const;

      const payload = allowedFields.reduce((acc, key) => {
        (acc as any)[key] = cliente[key] ?? null;
        return acc;
      }, {} as Database["public"]["Tables"]["clientes_infos"]["Update"]);

      const { error } = await supabase
        .from("clientes_infos")
        .update(payload)
        .eq("id_cliente", id);

      if (error) throw error;

      toast.success("Cliente atualizado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao atualizar cliente:", error);
      toast.error(error.message || "Erro ao atualizar cliente");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContato = async () => {
    try {
      if (!id) {
        throw new Error("Cliente inválido");
      }

      const dataToSave: Database["public"]["Tables"]["cliente_contato"]["Insert"] = {
        ...contatoFormData,
        id_cliente: id,
        nome_cliente: cliente?.nome_cliente ?? null,
      };

      if (editContato) {
        const { error } = await supabase
          .from("cliente_contato")
          .update(dataToSave)
          .eq("id_contato", editContato.id_contato);

        if (error) throw error;
        toast.success("Contato atualizado!");
      } else {
        const { error } = await supabase.from("cliente_contato").insert(dataToSave);

        if (error) throw error;
        toast.success("Contato adicionado!");
      }

      setOpenContatoDialog(false);
      setEditContato(null);
      setContatoFormData({
        nome_contato: "",
        email: "",
        numero_whatsapp: "",
        id_grupo_whatsapp: "",
      });
      fetchContatos();
    } catch (error: any) {
      console.error("Erro ao salvar contato:", error);
      toast.error(error.message || "Erro ao salvar contato");
    }
  };

  const handleEditContato = (contato: Contato) => {
    setEditContato(contato);
    setContatoFormData({
      nome_contato: contato.nome_contato || "",
      email: contato.email || "",
      numero_whatsapp: contato.numero_whatsapp || "",
      id_grupo_whatsapp: contato.id_grupo_whatsapp || "",
    });
    setOpenContatoDialog(true);
  };

  const handleDeleteContato = async (contatoId: string) => {
    try {
      const { error } = await supabase
        .from("cliente_contato")
        .delete()
        .eq("id_contato", contatoId);

      if (error) throw error;

      toast.success("Contato removido!");
      fetchContatos();
    } catch (error: any) {
      console.error("Erro ao remover contato:", error);
      toast.error(error.message || "Erro ao remover contato");
    }
    setDeleteContatoId(null);
  };

  if (!cliente) {
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
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/clientes")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{cliente.nome_cliente}</h1>
            <p className="text-muted-foreground">Detalhes e contatos do cliente</p>
          </div>
        </div>

        <form onSubmit={handleUpdateCliente}>
          <Card>
            <CardHeader>
              <CardTitle>Informações do Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nome_cliente">Nome do Cliente *</Label>
                  <Input
                    id="nome_cliente"
                    required
                    value={cliente.nome_cliente || ""}
                    onChange={(e) =>
                      setCliente({ ...cliente, nome_cliente: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={cliente.cnpj || ""}
                    onChange={(e) => setCliente({ ...cliente, cnpj: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="segmento">Segmento</Label>
                  <Input
                    id="segmento"
                    value={cliente.segmento || ""}
                    onChange={(e) => setCliente({ ...cliente, segmento: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nome_responsavel">Nome do Responsável</Label>
                  <Input
                    id="nome_responsavel"
                    value={cliente.nome_responsavel || ""}
                    onChange={(e) =>
                      setCliente({ ...cliente, nome_responsavel: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="data_inauguracao">Data de Inauguração</Label>
                  <Input
                    id="data_inauguracao"
                    type="date"
                    value={cliente.data_inauguracao || ""}
                    onChange={(e) =>
                      setCliente({ ...cliente, data_inauguracao: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data_contrato">Data do Contrato</Label>
                  <Input
                    id="data_contrato"
                    type="date"
                    value={cliente.data_contrato || ""}
                    onChange={(e) =>
                      setCliente({ ...cliente, data_contrato: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="cliente_ativo">Cliente Ativo</Label>
                  <Switch
                    id="cliente_ativo"
                    checked={cliente.cliente_ativo}
                    onCheckedChange={(checked) =>
                      setCliente({ ...cliente, cliente_ativo: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="gestao_trafego">Gestão de Tráfego</Label>
                  <Switch
                    id="gestao_trafego"
                    checked={cliente.gestao_trafego}
                    onCheckedChange={(checked) =>
                      setCliente({ ...cliente, gestao_trafego: checked })
                    }
                  />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </CardContent>
          </Card>
        </form>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Contatos do Cliente</CardTitle>
            <Dialog open={openContatoDialog} onOpenChange={setOpenContatoDialog}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditContato(null);
                    setContatoFormData({
                      nome_contato: "",
                      email: "",
                      numero_whatsapp: "",
                      id_grupo_whatsapp: "",
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Contato
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editContato ? "Editar Contato" : "Novo Contato"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome do Contato *</Label>
                    <Input
                      value={contatoFormData.nome_contato}
                      onChange={(e) =>
                        setContatoFormData({
                          ...contatoFormData,
                          nome_contato: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={contatoFormData.email}
                      onChange={(e) =>
                        setContatoFormData({ ...contatoFormData, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>WhatsApp</Label>
                    <Input
                      value={contatoFormData.numero_whatsapp}
                      onChange={(e) =>
                        setContatoFormData({
                          ...contatoFormData,
                          numero_whatsapp: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>ID Grupo WhatsApp</Label>
                    <Input
                      value={contatoFormData.id_grupo_whatsapp}
                      onChange={(e) =>
                        setContatoFormData({
                          ...contatoFormData,
                          id_grupo_whatsapp: e.target.value,
                        })
                      }
                    />
                  </div>
                  <Button onClick={handleSaveContato} className="w-full">
                    Salvar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {contatos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum contato cadastrado
              </p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>WhatsApp</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contatos.map((contato) => (
                      <TableRow key={contato.id_contato}>
                        <TableCell className="font-medium">
                          {contato.nome_contato}
                        </TableCell>
                        <TableCell>{contato.email || "-"}</TableCell>
                        <TableCell>{contato.numero_whatsapp || "-"}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditContato(contato)}
                            >
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeleteContatoId(contato.id_contato)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <AlertDialog
          open={!!deleteContatoId}
          onOpenChange={(open) => !open && setDeleteContatoId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover este contato? Esta ação não pode ser
                desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteContatoId && handleDeleteContato(deleteContatoId)}
              >
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
