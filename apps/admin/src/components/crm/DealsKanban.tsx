import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, User, DollarSign } from "lucide-react";
import { Deal, Stage, useUpdateDeal, useIsCRMAdmin } from "@/hooks/useCRM";
import { cn } from "@/lib/utils";

interface DealsKanbanProps {
  stages: Stage[];
  deals: Deal[];
  onDealClick: (deal: Deal) => void;
}

export function DealsKanban({ stages, deals, onDealClick }: DealsKanbanProps) {
  const updateDeal = useUpdateDeal();
  const isCRMAdmin = useIsCRMAdmin();

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const dealId = result.draggableId;
    const newStageId = result.destination.droppableId;

    if (result.source.droppableId === newStageId) return;

    const newStage = stages.find((s) => s.id === newStageId);
    
    updateDeal.mutate({
      id: dealId,
      stage_id: newStageId,
      status: newStage?.is_won ? "won" : newStage?.is_lost ? "lost" : "open",
    });
  };

  const getDealsByStage = (stageId: string) => {
    return deals.filter((deal) => deal.stage_id === stageId);
  };

  const getStageTotal = (stageId: string) => {
    return getDealsByStage(stageId).reduce((sum, deal) => sum + (deal.value || 0), 0);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageDeals = getDealsByStage(stage.id);
          const stageTotal = getStageTotal(stage.id);

          return (
            <div key={stage.id} className="flex-shrink-0 w-[300px]">
              <div
                className="rounded-t-lg px-4 py-3"
                style={{ backgroundColor: stage.color + "20" }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    <h3 className="font-medium text-sm">{stage.name}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {stageDeals.length}
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(stageTotal)}
                </p>
              </div>

              <Droppable droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "min-h-[200px] bg-muted/30 rounded-b-lg p-2 space-y-2",
                      snapshot.isDraggingOver && "bg-muted/50"
                    )}
                  >
                    {stageDeals.map((deal, index) => (
                      <Draggable key={deal.id} draggableId={deal.id} index={index}>
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={cn(
                              "cursor-pointer hover:shadow-md transition-shadow",
                              snapshot.isDragging && "shadow-lg rotate-2"
                            )}
                            onClick={() => onDealClick(deal)}
                          >
                            <CardContent className="p-3 space-y-2">
                              <h4 className="font-medium text-sm line-clamp-2">
                                {deal.title}
                              </h4>

                              {deal.company && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Building2 className="h-3 w-3" />
                                  <span className="truncate">{deal.company.name}</span>
                                </div>
                              )}

                              {deal.contact && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <User className="h-3 w-3" />
                                  <span className="truncate">{deal.contact.name}</span>
                                </div>
                              )}

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1 text-sm font-medium text-primary">
                                  <DollarSign className="h-3 w-3" />
                                  {formatCurrency(deal.value || 0)}
                                </div>

                                {isCRMAdmin && deal.owner && (
                                  <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                                    {deal.owner.nome}
                                  </span>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
