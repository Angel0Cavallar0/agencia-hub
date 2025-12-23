import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function ClickupPastas() {
  const [pastas, setPastas] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editPasta, setEditPasta] = useState<any>(null);
  const [formData, setFormData] = useState({
    id_cliente: "",
    nome_pasta: "",
    id_pasta: "",
    nome_espaco: "",
    id_espaco: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [pastasRes, clientesRes] = await Promise.all([
      supabase
        .from("clientes_pastas_clickup")
        .select("id, id_cliente, nome_cliente, nome_pasta, id_pasta, nome_espaco, id_espaco, data_criacao")
        .order("nome_pasta", { ascending: true }),
      supabase
        .from("clientes_infos")
        .select("id_cliente, nome_cliente")
        .order("nome_cliente", { ascending: true }),
    ]);

    if (pastasRes.data) setPastas(pastasRes.data);
    if (clientesRes.data) setClientes(clientesRes.data);
  };

  const handleSave = async () => {
    if (!formData.id_cliente || !formData.nome_pasta || !formData.id_pasta) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const cliente = clientes.find((c) => c.id_cliente === formData.id_cliente);
    const dataToSave = {
      ...formData,
      nome_cliente: cliente?.nome_cliente,
    };

    if (editPasta) {
      const { error } = await supabase
        .from("clientes_pastas_clickup")
        .update(dataToSave)
        .eq("id", editPasta.id);

      if (error) {
        toast.error("Erro ao atualizar pasta");
        console.error(error);
        return;
      }
      toast.success("Pasta atualizada!");
    } else {
      const { error } = await supabase.from("clientes_pastas_clickup").insert(dataToSave);

      if (error) {
        toast.error("Erro ao criar pasta");
        console.error(error);
        return;
      }
      toast.success("Pasta criada!");
    }

    setOpen(false);
    setEditPasta(null);
    setFormData({
      id_cliente: "",
      nome_pasta: "",
      id_pasta: "",
      nome_espaco: "",
      id_espaco: "",
    });
    fetchData();
  };

  const handleEdit = (pasta: any) => {
    setEditPasta(pasta);
    setFormData({
      id_cliente: pasta.id_cliente || "",
      nome_pasta: pasta.nome_pasta || "",
      id_pasta: pasta.id_pasta || "",
      nome_espaco: pasta.nome_espaco || "",
      id_espaco: pasta.id_espaco || "",
    });
    setOpen(true);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pastas ClickUp</h1>
            <p className="text-muted-foreground">Gerencie as pastas do ClickUp</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditPasta(null); setFormData({ id_cliente: "", nome_pasta: "", id_pasta: "", nome_espaco: "", id_espaco: "" }); }}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Pasta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editPasta ? "Editar Pasta" : "Nova Pasta"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Cliente *</Label>
                  <Select value={formData.id_cliente} onValueChange={(v) => setFormData({ ...formData, id_cliente: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((c) => (
                        <SelectItem key={c.id_cliente} value={c.id_cliente}>
                          {c.nome_cliente}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Nome da Pasta *</Label>
                  <Input value={formData.nome_pasta} onChange={(e) => setFormData({ ...formData, nome_pasta: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>ID da Pasta *</Label>
                  <Input value={formData.id_pasta} onChange={(e) => setFormData({ ...formData, id_pasta: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Nome do Espaço</Label>
                  <Input value={formData.nome_espaco} onChange={(e) => setFormData({ ...formData, nome_espaco: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>ID do Espaço</Label>
                  <Input value={formData.id_espaco} onChange={(e) => setFormData({ ...formData, id_espaco: e.target.value })} />
                </div>
                <Button onClick={handleSave} className="w-full">
                  Salvar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Nome Pasta</TableHead>
                <TableHead>ID Pasta</TableHead>
                <TableHead>Espaço</TableHead>
                <TableHead>ID Espaço</TableHead>
                <TableHead>Data Criação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pastas.map((pasta) => (
                <TableRow key={pasta.id} className="cursor-pointer" onClick={() => handleEdit(pasta)}>
                  <TableCell>{pasta.nome_cliente}</TableCell>
                  <TableCell className="font-medium">{pasta.nome_pasta}</TableCell>
                  <TableCell>{pasta.id_pasta}</TableCell>
                  <TableCell>{pasta.nome_espaco}</TableCell>
                  <TableCell>{pasta.id_espaco}</TableCell>
                  <TableCell>
                    {pasta.data_criacao
                      ? new Date(pasta.data_criacao).toLocaleDateString("pt-BR")
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
