import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function ClienteNovo() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome_cliente: "",
    cnpj: "",
    segmento: "",
    nome_responsavel: "",
    data_inauguracao: "",
    data_contrato: "",
    cliente_ativo: true,
    gestao_trafego: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("clientes_infos")
        .insert([formData])
        .select()
        .single();

      if (error) throw error;

      toast.success("Cliente criado com sucesso!");
      navigate(`/clientes/${data.id_cliente}`);
    } catch (error: any) {
      console.error("Erro ao criar cliente:", error);
      toast.error(error.message || "Erro ao criar cliente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/clientes")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Novo Cliente</h1>
            <p className="text-muted-foreground">Cadastre um novo cliente na agência</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
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
                    value={formData.nome_cliente}
                    onChange={(e) =>
                      setFormData({ ...formData, nome_cliente: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="segmento">Segmento</Label>
                  <Input
                    id="segmento"
                    value={formData.segmento}
                    onChange={(e) => setFormData({ ...formData, segmento: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nome_responsavel">Nome do Responsável</Label>
                  <Input
                    id="nome_responsavel"
                    value={formData.nome_responsavel}
                    onChange={(e) =>
                      setFormData({ ...formData, nome_responsavel: e.target.value })
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
                    value={formData.data_inauguracao}
                    onChange={(e) =>
                      setFormData({ ...formData, data_inauguracao: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data_contrato">Data do Contrato</Label>
                  <Input
                    id="data_contrato"
                    type="date"
                    value={formData.data_contrato}
                    onChange={(e) =>
                      setFormData({ ...formData, data_contrato: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="cliente_ativo">Cliente Ativo</Label>
                  <Switch
                    id="cliente_ativo"
                    checked={formData.cliente_ativo}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, cliente_ativo: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="gestao_trafego">Gestão de Tráfego</Label>
                  <Switch
                    id="gestao_trafego"
                    checked={formData.gestao_trafego}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, gestao_trafego: checked })
                    }
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Salvando..." : "Criar Cliente"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/clientes")}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </Layout>
  );
}
