import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Whatsapp() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">WhatsApp</h1>
          <p className="text-muted-foreground">Gestão de comunicação via WhatsApp</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>WhatsApp em desenvolvimento</CardTitle>
            <CardDescription>
              Esta página está sendo preparada para futuras funcionalidades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              O módulo de WhatsApp permitirá gerenciar comunicações com clientes,
              automações de mensagens e muito mais.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
