import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, CheckSquare, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function Dashboard() {
  const [stats, setStats] = useState({
    activeClients: 0,
    activeEmployees: 0,
    ongoingTasks: 0,
    overdueTasks: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];

      const [clientsRes, employeesRes, ongoingTasksRes, overdueTasksRes] = await Promise.all([
        supabase
          .from("clientes_infos")
          .select("id_cliente", { count: "exact", head: true })
          .eq("cliente_ativo", true),
        supabase
          .from("colaborador")
          .select("id_colaborador", { count: "exact", head: true })
          .eq("colab_ativo", true),
        supabase
          .from("informacoes_tasks_clickup")
          .select("id_subtask", { count: "exact", head: true })
          .neq("status", "Concluído"),
        supabase
          .from("informacoes_tasks_clickup")
          .select("id_subtask", { count: "exact", head: true })
          .neq("status", "Concluído")
          .not("data_entrega", "is", null)
          .lt("data_entrega", today),
      ]);

      setStats({
        activeClients: clientsRes.count || 0,
        activeEmployees: employeesRes.count || 0,
        ongoingTasks: ongoingTasksRes.count || 0,
        overdueTasks: overdueTasksRes.count || 0,
      });
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
    }
  };

  const cards = [
    {
      title: "Clientes Ativos",
      value: stats.activeClients,
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Colaboradores Ativos",
      value: stats.activeEmployees,
      icon: UserCheck,
      color: "text-success",
    },
    {
      title: "Tarefas em Andamento",
      value: stats.ongoingTasks,
      icon: CheckSquare,
      color: "text-accent",
    },
    {
      title: "Tarefas Atrasadas",
      value: stats.overdueTasks,
      icon: AlertCircle,
      color: "text-destructive",
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do desempenho da agência</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
