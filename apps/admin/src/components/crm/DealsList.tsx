import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Deal, useIsCRMAdmin } from "@/hooks/useCRM";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DealsListProps {
  deals: Deal[];
  onDealClick: (deal: Deal) => void;
}

export function DealsList({ deals, onDealClick }: DealsListProps) {
  const isCRMAdmin = useIsCRMAdmin();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getStatusBadge = (status: string, stage?: { is_won?: boolean; is_lost?: boolean }) => {
    if (stage?.is_won || status === "won") {
      return <Badge className="bg-green-500">Ganho</Badge>;
    }
    if (stage?.is_lost || status === "lost") {
      return <Badge variant="destructive">Perdido</Badge>;
    }
    return <Badge variant="secondary">Aberto</Badge>;
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Título</TableHead>
            <TableHead>Empresa</TableHead>
            <TableHead>Contato</TableHead>
            <TableHead>Funil</TableHead>
            <TableHead>Etapa</TableHead>
            <TableHead>Valor</TableHead>
            {isCRMAdmin && <TableHead>Dono</TableHead>}
            <TableHead>Criado em</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deals.length === 0 ? (
            <TableRow>
              <TableCell colSpan={isCRMAdmin ? 9 : 8} className="text-center py-8 text-muted-foreground">
                Nenhum negócio encontrado
              </TableCell>
            </TableRow>
          ) : (
            deals.map((deal) => (
              <TableRow
                key={deal.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onDealClick(deal)}
              >
                <TableCell className="font-medium">{deal.title}</TableCell>
                <TableCell>{deal.company?.name || "-"}</TableCell>
                <TableCell>{deal.contact?.name || "-"}</TableCell>
                <TableCell>{deal.pipeline?.name || "-"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: deal.stage?.color }}
                    />
                    {deal.stage?.name || "-"}
                  </div>
                </TableCell>
                <TableCell className="font-medium text-primary">
                  {formatCurrency(deal.value || 0)}
                </TableCell>
                {isCRMAdmin && (
                  <TableCell>{deal.owner?.nome || "-"}</TableCell>
                )}
                <TableCell>
                  {format(new Date(deal.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </TableCell>
                <TableCell>{getStatusBadge(deal.status, deal.stage)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
