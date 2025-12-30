import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Mail, BadgeCheck } from "lucide-react";
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
import {
  useClientContacts,
  useCreateClientContact,
  useUpdateClientContact,
  useDeleteClientContact,
  useInviteClientUser,
  type Contact,
} from "@/hooks/useCRM";
import type { Database } from "@/integrations/supabase/types";

type Cliente = Database["public"]["Tables"]["clients"]["Row"];

export default function ClienteDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [openContatoDialog, setOpenContatoDialog] = useState(false);
  const [editContato, setEditContato] = useState<Contact | null>(null);
  const [deleteContatoId, setDeleteContatoId] = useState<string | null>(null);
  const [shouldInviteUser, setShouldInviteUser] = useState(false);
  const [contatoFormData, setContatoFormData] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
    notes: "",
  });

  const { data: contatos, refetch: refetchContatos } = useClientContacts(cliente?.company_id || undefined);
  const createContact = useCreateClientContact();
  const updateContact = useUpdateClientContact();
  const deleteContact = useDeleteClientContact();
  const inviteUser = useInviteClientUser();

  useEffect(() => {
    if (id) {
      fetchCliente();
    }
  }, [id]);

  const fetchCliente = async () => {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Erro ao buscar cliente:", error);
      toast.error("Erro ao carregar cliente");
      return;
    }

    setCliente(data);
  };

  const handleUpdateCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!cliente) {
        throw new Error("Cliente não encontrado");
      }

      const allowedFields = [
        "nome_fantasia",
        "razao_social",
        "cnpj",
        "segmento",
        "nome_responsavel",
        "email",
        "phone",
        "data_contrato",
        "cliente_ativo",
      ] as const;

      const payload = allowedFields.reduce((acc, key) => {
        (acc as any)[key] = cliente[key] ?? null;
        return acc;
      }, {} as Database["public"]["Tables"]["clients"]["Update"]);

      const { error } = await supabase
        .from("clients")
        .update(payload)
        .eq("id", id);

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
      if (!cliente?.company_id) {
        throw new Error("Cliente não possui empresa vinculada");
      }

      if (!contatoFormData.name.trim()) {
        throw new Error("Nome do contato é obrigatório");
      }

      if (shouldInviteUser && !contatoFormData.email?.trim()) {
        throw new Error("Email é obrigatório para enviar convite");
      }

      if (editContato) {
        // Update existing contact
        await updateContact.mutateAsync({
          id: editContato.id,
          company_id: cliente.company_id,
          ...contatoFormData,
        });
      } else {
        // Create new contact
        const newContact = await createContact.mutateAsync({
          ...contatoFormData,
          company_id: cliente.company_id,
        });

        // Send invite if requested
        if (shouldInviteUser && contatoFormData.email && newContact) {
          await inviteUser.mutateAsync({
            email: contatoFormData.email,
            contactId: newContact.id,
            companyId: cliente.company_id,
          });
        }
      }

      setOpenContatoDialog(false);
      setEditContato(null);
      setShouldInviteUser(false);
      setContatoFormData({
        name: "",
        email: "",
        phone: "",
        position: "",
        notes: "",
      });
      refetchContatos();
    } catch (error: any) {
      console.error("Erro ao salvar contato:", error);
      toast.error(error.message || "Erro ao salvar contato");
    }
  };

  const handleEditContato = (contato: Contact) => {
    setEditContato(contato);
    setContatoFormData({
      name: contato.name || "",
      email: contato.email || "",
      phone: contato.phone || "",
      position: contato.position || "",
      notes: contato.notes || "",
    });
    setShouldInviteUser(false);
    setOpenContatoDialog(true);
  };

  const handleDeleteContato = async (contatoId: string) => {
    if (!cliente?.company_id) return;

    await deleteContact.mutateAsync({
      id: contatoId,
      company_id: cliente.company_id,
    });

    setDeleteContatoId(null);
    refetchContatos();
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
            <h1 className="text-3xl font-bold tracking-tight">{cliente.nome_fantasia || cliente.razao_social}</h1>
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
                  <Label htmlFor="nome_fantasia">Nome Fantasia *</Label>
                  <Input
                    id="nome_fantasia"
                    required
                    value={cliente.nome_fantasia || ""}
                    onChange={(e) =>
                      setCliente({ ...cliente, nome_fantasia: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="razao_social">Razão Social</Label>
                  <Input
                    id="razao_social"
                    value={cliente.razao_social || ""}
                    onChange={(e) =>
                      setCliente({ ...cliente, razao_social: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={cliente.cnpj || ""}
                    onChange={(e) => setCliente({ ...cliente, cnpj: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="segmento">Segmento</Label>
                  <Input
                    id="segmento"
                    value={cliente.segmento || ""}
                    onChange={(e) => setCliente({ ...cliente, segmento: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
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
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={cliente.email || ""}
                    onChange={(e) =>
                      setCliente({ ...cliente, email: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={cliente.phone || ""}
                    onChange={(e) =>
                      setCliente({ ...cliente, phone: e.target.value })
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

              <div className="flex items-center justify-between">
                <Label htmlFor="cliente_ativo">Cliente Ativo</Label>
                <Switch
                  id="cliente_ativo"
                  checked={cliente.cliente_ativo || false}
                  onCheckedChange={(checked) =>
                    setCliente({ ...cliente, cliente_ativo: checked })
                  }
                />
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
                    setShouldInviteUser(false);
                    setContatoFormData({
                      name: "",
                      email: "",
                      phone: "",
                      position: "",
                      notes: "",
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Contato
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editContato ? "Editar Contato" : "Novo Contato"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome *</Label>
                    <Input
                      value={contatoFormData.name}
                      onChange={(e) =>
                        setContatoFormData({
                          ...contatoFormData,
                          name: e.target.value,
                        })
                      }
                      placeholder="Nome do contato"
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
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input
                      value={contatoFormData.phone}
                      onChange={(e) =>
                        setContatoFormData({
                          ...contatoFormData,
                          phone: e.target.value,
                        })
                      }
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cargo/Posição</Label>
                    <Input
                      value={contatoFormData.position}
                      onChange={(e) =>
                        setContatoFormData({
                          ...contatoFormData,
                          position: e.target.value,
                        })
                      }
                      placeholder="Ex: Gerente, Diretor"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Observações</Label>
                    <Textarea
                      value={contatoFormData.notes}
                      onChange={(e) =>
                        setContatoFormData({
                          ...contatoFormData,
                          notes: e.target.value,
                        })
                      }
                      placeholder="Informações adicionais sobre o contato"
                      rows={3}
                    />
                  </div>
                  {!editContato && (
                    <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
                      <Checkbox
                        id="invite"
                        checked={shouldInviteUser}
                        onCheckedChange={(checked) => setShouldInviteUser(checked as boolean)}
                      />
                      <div className="flex-1">
                        <Label htmlFor="invite" className="flex items-center gap-2 cursor-pointer">
                          <Mail className="h-4 w-4" />
                          <span className="font-medium">Convidar para o sistema</span>
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Enviar email de convite para o contato criar senha e acessar o portal do cliente
                        </p>
                      </div>
                    </div>
                  )}
                  <Button onClick={handleSaveContato} className="w-full">
                    {editContato ? "Atualizar" : "Salvar"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {!contatos || contatos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum contato cadastrado
              </p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contatos.map((contato) => (
                      <TableRow key={contato.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {contato.name}
                            {contato.client_user_id && (
                              <BadgeCheck className="h-4 w-4 text-primary" title="Tem acesso ao sistema" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{contato.position || "-"}</TableCell>
                        <TableCell>{contato.email || "-"}</TableCell>
                        <TableCell>{contato.phone || "-"}</TableCell>
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
                              onClick={() => setDeleteContatoId(contato.id)}
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
