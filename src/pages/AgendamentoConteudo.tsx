import { Layout } from "@/components/Layout";
import { Calendar } from "lucide-react";

export default function AgendamentoConteudo() {
  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Calendar className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Agendamento de Conteúdo</h1>
            <p className="text-muted-foreground">
              Gerencie o calendário de publicações dos seus clientes
            </p>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 bg-muted/5 p-12">
          <div className="text-center space-y-3">
            <Calendar className="h-16 w-16 mx-auto text-muted-foreground/50" />
            <h2 className="text-xl font-semibold text-foreground">
              Página em Desenvolvimento
            </h2>
            <p className="text-muted-foreground max-w-md">
              Estamos trabalhando nesta funcionalidade. Em breve você poderá agendar e gerenciar todo o conteúdo dos seus clientes em um só lugar.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
