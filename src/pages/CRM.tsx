import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CRM() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CRM</h1>
          <p className="text-muted-foreground">Gestão de relacionamento com clientes</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>CRM em desenvolvimento</CardTitle>
            <CardDescription>
              Esta página está sendo preparada para futuras funcionalidades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              O módulo de CRM permitirá gerenciar relacionamentos com clientes, 
              acompanhar oportunidades de negócio e muito mais.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
