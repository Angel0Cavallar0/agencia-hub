import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Building2, User, Calendar, DollarSign, Send } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Deal,
  Stage,
  useDealNotes,
  useCreateDealNote,
  useUpdateDeal,
  useOwners,
  useIsCRMAdmin,
} from "@/hooks/useCRM";

interface DealDrawerProps {
  deal: Deal | null;
  stages: Stage[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DealDrawer({ deal, stages, open, onOpenChange }: DealDrawerProps) {
  const [newNote, setNewNote] = useState("");
  const { data: notes, isLoading: loadingNotes } = useDealNotes(deal?.id);
  const createNote = useCreateDealNote();
  const updateDeal = useUpdateDeal();
  const { data: owners } = useOwners();
  const isCRMAdmin = useIsCRMAdmin();

  if (!deal) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getStatusBadge = () => {
    if (deal.status === "won") {
      return <Badge className="bg-green-500">Ganho</Badge>;
    }
    if (deal.status === "lost") {
      return <Badge variant="destructive">Perdido</Badge>;
    }
    return <Badge variant="secondary">Aberto</Badge>;
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    createNote.mutate({ deal_id: deal.id, content: newNote });
    setNewNote("");
  };

  const handleStageChange = (stageId: string) => {
    const newStage = stages.find((s) => s.id === stageId);
    updateDeal.mutate({
      id: deal.id,
      stage_id: stageId,
      status: newStage?.is_won ? "won" : newStage?.is_lost ? "lost" : "open",
    });
  };

  const handleOwnerChange = (ownerId: string) => {
    updateDeal.mutate({ id: deal.id, owner_id: ownerId });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="text-xl">{deal.title}</SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-4">
          <div className="space-y-6 pr-4">
            {/* Status and Value */}
            <div className="flex items-center justify-between">
              {getStatusBadge()}
              <div className="flex items-center gap-1 text-xl font-bold text-primary">
                <DollarSign className="h-5 w-5" />
                {formatCurrency(deal.value || 0)}
              </div>
            </div>

            {/* Stage Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Etapa</label>
              <Select value={deal.stage_id} onValueChange={handleStageChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: stage.color }}
                        />
                        {stage.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Owner Selection (Admin/Manager only) */}
            {isCRMAdmin && owners && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Dono do negócio</label>
                <Select value={deal.owner_id} onValueChange={handleOwnerChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {owners.map((owner) => (
                      <SelectItem key={owner.user_id} value={owner.user_id}>
                        {owner.nome} {owner.sobrenome || ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Separator />

            {/* Company */}
            {deal.company && (
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Empresa
                </label>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium">{deal.company.name}</p>
                  {deal.company.phone && (
                    <p className="text-sm text-muted-foreground">{deal.company.phone}</p>
                  )}
                  {deal.company.email && (
                    <p className="text-sm text-muted-foreground">{deal.company.email}</p>
                  )}
                </div>
              </div>
            )}

            {/* Contact */}
            {deal.contact && (
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Contato principal
                </label>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium">{deal.contact.name}</p>
                  {deal.contact.position && (
                    <p className="text-sm text-muted-foreground">{deal.contact.position}</p>
                  )}
                  {deal.contact.phone && (
                    <p className="text-sm text-muted-foreground">{deal.contact.phone}</p>
                  )}
                  {deal.contact.email && (
                    <p className="text-sm text-muted-foreground">{deal.contact.email}</p>
                  )}
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Datas
              </label>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Criado em</p>
                  <p className="font-medium">
                    {format(new Date(deal.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
                {deal.expected_close_date && (
                  <div>
                    <p className="text-muted-foreground">Previsão de fechamento</p>
                    <p className="font-medium">
                      {format(new Date(deal.expected_close_date), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                )}
                {deal.closed_at && (
                  <div>
                    <p className="text-muted-foreground">Fechado em</p>
                    <p className="font-medium">
                      {format(new Date(deal.closed_at), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Notes */}
            <div className="space-y-4">
              <label className="text-sm font-medium">Timeline / Notas</label>
              
              <div className="flex gap-2">
                <Textarea
                  placeholder="Adicionar uma nota..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="min-h-[80px]"
                />
                <Button
                  size="icon"
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || createNote.isPending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3">
                {loadingNotes ? (
                  <p className="text-sm text-muted-foreground">Carregando notas...</p>
                ) : notes?.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma nota ainda</p>
                ) : (
                  notes?.map((note) => (
                    <div key={note.id} className="p-3 bg-muted/30 rounded-lg space-y-1">
                      <p className="text-sm">{note.content}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{note.creator?.nome || "Usuário"}</span>
                        <span>
                          {format(new Date(note.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
