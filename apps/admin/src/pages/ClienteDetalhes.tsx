import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Mail } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
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
  DialogDescription,
  DialogFooter,
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

type Cliente = Database["public"]["Tables"]["clients"]["Row"];
type CRMContact = Database["public"]["Tables"]["crm_contacts"]["Row"];

export default function ClienteDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [contatos, setContatos] = useState<CRMContact[]>([]);
  const [openContatoDialog, setOpenContatoDialog] = useState(false);
  const [editContato, setEditContato] = useState<CRMContact | null>(null);
  const [deleteContatoId, setDeleteContatoId] = useState<string | null>(null);
  const [sendInvite, setSendInvite] = useState(false);
  const [invitePassword, setInvitePassword] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [contatoFormData, setContatoFormData] = useState<{
    name: string;
    email: string;
    phone: string;
    position: string;
    notes: string;
  }>({
    name: "",
    email: "",
    phone: "",
    position: "",
    notes: "",
  });

  useEffect(() => {
    if (id) {
      fetchCliente();
      fetchContatos();
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

  const fetchContatos = async () => {
    const { data, error } = await supabase
      .from("crm_contacts")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar contatos:", error);
      toast.error("Erro ao carregar contatos");
      return;
    }

    setContatos(data ?? []);
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
      if (!id) {
        throw new Error("Cliente inválido");
      }

      if (!contatoFormData.name || !contatoFormData.email) {
        toast.error("Nome e email são obrigatórios");
        return;
      }

      if (sendInvite && !invitePassword) {
        setInviteError("Informe sua senha para enviar o convite");
        return;
      }

      const dataToSave: Database["public"]["Tables"]["crm_contacts"]["Insert"] = {
        name: contatoFormData.name,
        email: contatoFormData.email,
        phone: contatoFormData.phone || null,
        position: contatoFormData.position || null,
        notes: contatoFormData.notes || null,
        client_id: id,
        created_by: user?.id || null,
      };

      if (editContato) {
        const { error } = await supabase
          .from("crm_contacts")
          .update(dataToSave)
          .eq("id", editContato.id);

        if (error) throw error;
        toast.success("Contato atualizado!");

        if (sendInvite && !editContato.client_user_id) {
          await handleInviteContact(editContato.id);
        }
      } else {
        const { data: newContact, error } = await supabase
          .from("crm_contacts")
          .insert(dataToSave)
          .select()
          .single();

        if (error) throw error;
        toast.success("Contato adicionado!");

        if (sendInvite && newContact) {
          await handleInviteContact(newContact.id);
        }
      }

      setOpenContatoDialog(false);
      setEditContato(null);
      setSendInvite(false);
      setInvitePassword("");
      setInviteError(null);
      setContatoFormData({
        name: "",
        email: "",
        phone: "",
        position: "",
        notes: "",
      });
      fetchContatos();
    } catch (error: any) {
      console.error("Erro ao salvar contato:", error);
      toast.error(error.message || "Erro ao salvar contato");
    }
  };

  const handleInviteContact = async (contactId: string) => {
    if (!invitePassword || !user?.email) {
      setInviteError("Senha é obrigatória para enviar o convite");
      return;
    }

    setIsInviting(true);
    setInviteError(null);

    try {
      const { data, error } = await supabase.functions.invoke('invite-client-contact', {
        body: {
          email: contatoFormData.email,
          contactId: contactId,
          clientId: id,
          password: invitePassword,
        }
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.userId) {
        toast.success('Convite enviado! O contato receberá um email para definir a senha.');
        fetchContatos();
      }
    } catch (error: any) {
      const rawMessage = typeof error?.message === "string" ? error.message : null;
      const isInvalidPassword =
        rawMessage?.toLowerCase().includes("invalid login credentials") ||
        rawMessage === "Senha incorreta";
      const displayMessage = isInvalidPassword
        ? "Senha incorreta. Tente novamente."
        : rawMessage || "Erro ao enviar convite";

      setInviteError(displayMessage);
      toast.error(displayMessage);
    } finally {
      setIsInviting(false);
    }
  };

  const handleEditContato = (contato: CRMContact) => {
    setEditContato(contato);
    setContatoFormData({
      name: contato.name || "",
      email: contato.email || "",
      phone: contato.phone || "",
      position: contato.position || "",
      notes: contato.notes || "",
    });
    setSendInvite(false);
    setInvitePassword("");
    setInviteError(null);
    setOpenContatoDialog(true);
  };

  const handleDeleteContato = async (contatoId: string) => {
    try {
      const { error } = await supabase
        .from("crm_contacts")
        .delete()
        .eq("id", contatoId);

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
                    setContatoFormData({
                      name: "",
                      email: "",
                      phone: "",
                      position: "",
                      notes: "",
                    });
                    setSendInvite(false);
                    setInvitePassword("");
                    setInviteError(null);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Contato
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editContato ? "Editar Contato" : "Novo Contato"}
                  </DialogTitle>
                  <DialogDescription>
                    Preencha os dados do contato. Você pode opcionalmente enviar um convite para o sistema.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome do Contato *</Label>
                    <Input
                      value={contatoFormData.name}
                      onChange={(e) =>
                        setContatoFormData({
                          ...contatoFormData,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={contatoFormData.email}
                      onChange={(e) =>
                        setContatoFormData({ ...contatoFormData, email: e.target.value })
                      }
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
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cargo</Label>
                    <Input
                      value={contatoFormData.position}
                      onChange={(e) =>
                        setContatoFormData({
                          ...contatoFormData,
                          position: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Observações</Label>
                    <Input
                      value={contatoFormData.notes}
                      onChange={(e) =>
                        setContatoFormData({
                          ...contatoFormData,
                          notes: e.target.value,
                        })
                      }
                    />
                  </div>

                  {(!editContato || !editContato.client_user_id) && (
                    <>
                      <div className="flex items-center space-x-2 pt-2">
                        <Checkbox
                          id="sendInvite"
                          checked={sendInvite}
                          onCheckedChange={(checked) => {
                            setSendInvite(checked as boolean);
                            if (!checked) {
                              setInvitePassword("");
                              setInviteError(null);
                            }
                          }}
                        />
                        <Label htmlFor="sendInvite" className="text-sm font-normal cursor-pointer">
                          Enviar convite para acessar o sistema
                        </Label>
                      </div>

                      {sendInvite && (
                        <div className="space-y-2 bg-muted p-4 rounded-md">
                          <Label>Sua senha (para confirmar o envio) *</Label>
                          <Input
                            type="password"
                            placeholder="Digite sua senha"
                            value={invitePassword}
                            onChange={(e) => {
                              setInvitePassword(e.target.value);
                              setInviteError(null);
                            }}
                          />
                          {inviteError && (
                            <p className="text-sm text-destructive">{inviteError}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            O contato receberá um email para criar sua senha de acesso ao portal do cliente.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleSaveContato}
                    className="w-full"
                    disabled={isInviting}
                  >
                    {isInviting ? "Enviando convite..." : "Salvar"}
                  </Button>
                </DialogFooter>
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
                      <TableHead>Telefone</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contatos.map((contato) => (
                      <TableRow key={contato.id}>
                        <TableCell className="font-medium">
                          {contato.name}
                        </TableCell>
                        <TableCell>{contato.email || "-"}</TableCell>
                        <TableCell>{contato.phone || "-"}</TableCell>
                        <TableCell>{contato.position || "-"}</TableCell>
                        <TableCell>
                          {contato.client_user_id ? (
                            <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              <Mail className="h-3 w-3" />
                              Convidado
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Sem acesso</span>
                          )}
                        </TableCell>
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
