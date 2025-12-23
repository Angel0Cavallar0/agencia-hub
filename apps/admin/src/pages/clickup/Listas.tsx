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

export default function ClickupListas() {
  const [listas, setListas] = useState<any[]>([]);
  const [pastas, setPastas] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editLista, setEditLista] = useState<any>(null);
  const [formData, setFormData] = useState({
    id_pasta: "",
    nome_lista: "",
    id_lista: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [listasRes, pastasRes] = await Promise.all([
      supabase
        .from("clientes_listas_clickup")
        .select("id, id_lista, id_pasta, nome_lista, nome_pasta, data_criacao")
        .order("nome_lista", { ascending: true }),
      supabase
        .from("clientes_pastas_clickup")
        .select("id_pasta, nome_pasta, nome_cliente")
        .order("nome_pasta", { ascending: true }),
    ]);

    if (listasRes.data) setListas(listasRes.data);
    if (pastasRes.data) setPastas(pastasRes.data);
  };

  const handleSave = async () => {
    if (!formData.id_pasta || !formData.nome_lista || !formData.id_lista) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const pasta = pastas.find((p) => p.id_pasta === formData.id_pasta);
    const dataToSave = {
      ...formData,
      nome_pasta: pasta?.nome_pasta,
    };

    if (editLista) {
      const { error } = await supabase
        .from("clientes_listas_clickup")
        .update(dataToSave)
        .eq("id", editLista.id);

      if (error) {
        toast.error("Erro ao atualizar lista");
        console.error(error);
        return;
      }
      toast.success("Lista atualizada!");
    } else {
      const { error } = await supabase.from("clientes_listas_clickup").insert(dataToSave);

      if (error) {
        toast.error("Erro ao criar lista");
        console.error(error);
        return;
      }
      toast.success("Lista criada!");
    }

    setOpen(false);
    setEditLista(null);
    setFormData({
      id_pasta: "",
      nome_lista: "",
      id_lista: "",
    });
    fetchData();
  };

  const handleEdit = (lista: any) => {
    setEditLista(lista);
    setFormData({
      id_pasta: lista.id_pasta || "",
      nome_lista: lista.nome_lista || "",
      id_lista: lista.id_lista || "",
    });
    setOpen(true);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Listas ClickUp</h1>
            <p className="text-muted-foreground">Gerencie as listas do ClickUp</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditLista(null); setFormData({ id_pasta: "", nome_lista: "", id_lista: "" }); }}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Lista
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editLista ? "Editar Lista" : "Nova Lista"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Pasta *</Label>
                  <Select value={formData.id_pasta} onValueChange={(v) => setFormData({ ...formData, id_pasta: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {pastas.map((p) => (
                        <SelectItem key={p.id_pasta} value={p.id_pasta}>
                          {p.nome_pasta}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Nome da Lista *</Label>
                  <Input value={formData.nome_lista} onChange={(e) => setFormData({ ...formData, nome_lista: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>ID da Lista *</Label>
                  <Input value={formData.id_lista} onChange={(e) => setFormData({ ...formData, id_lista: e.target.value })} />
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
                <TableHead>Nome Lista</TableHead>
                <TableHead>Pasta</TableHead>
                <TableHead>ID Lista</TableHead>
                <TableHead>Data Criação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listas.map((lista) => (
                <TableRow key={lista.id} className="cursor-pointer" onClick={() => handleEdit(lista)}>
                  <TableCell className="font-medium">{lista.nome_lista}</TableCell>
                  <TableCell>{lista.nome_pasta}</TableCell>
                  <TableCell>{lista.id_lista}</TableCell>
                  <TableCell>
                    {lista.data_criacao
                      ? new Date(lista.data_criacao).toLocaleDateString("pt-BR")
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
