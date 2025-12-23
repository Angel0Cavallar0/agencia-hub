import { Search, LayoutGrid, List, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { Pipeline, Stage, useIsCRMAdmin, useOwners } from "@/hooks/useCRM";

interface DealsFiltersProps {
  pipelines: Pipeline[];
  stages: Stage[];
  selectedPipeline: string;
  selectedStage: string;
  selectedOwner: string;
  search: string;
  viewMode: "kanban" | "list";
  onPipelineChange: (value: string) => void;
  onStageChange: (value: string) => void;
  onOwnerChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onViewModeChange: (mode: "kanban" | "list") => void;
  onNewDeal: () => void;
}

export function DealsFilters({
  pipelines,
  stages,
  selectedPipeline,
  selectedStage,
  selectedOwner,
  search,
  viewMode,
  onPipelineChange,
  onStageChange,
  onOwnerChange,
  onSearchChange,
  onViewModeChange,
  onNewDeal,
}: DealsFiltersProps) {
  const isCRMAdmin = useIsCRMAdmin();
  const { data: owners } = useOwners();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={selectedPipeline} onValueChange={onPipelineChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Selecione o funil" />
        </SelectTrigger>
        <SelectContent>
          {pipelines.map((pipeline) => (
            <SelectItem key={pipeline.id} value={pipeline.id}>
              {pipeline.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedStage} onValueChange={onStageChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Todas as etapas" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as etapas</SelectItem>
          {stages.map((stage) => (
            <SelectItem key={stage.id} value={stage.id}>
              {stage.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isCRMAdmin && owners && (
        <Select value={selectedOwner} onValueChange={onOwnerChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todos os donos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os donos</SelectItem>
            {owners.map((owner) => (
              <SelectItem key={owner.user_id} value={owner.user_id}>
                {owner.nome} {owner.sobrenome || ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar negócios..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="flex items-center gap-1 border rounded-md p-1">
        <Toggle
          pressed={viewMode === "kanban"}
          onPressedChange={() => onViewModeChange("kanban")}
          size="sm"
          aria-label="Visualização Kanban"
        >
          <LayoutGrid className="h-4 w-4" />
        </Toggle>
        <Toggle
          pressed={viewMode === "list"}
          onPressedChange={() => onViewModeChange("list")}
          size="sm"
          aria-label="Visualização Lista"
        >
          <List className="h-4 w-4" />
        </Toggle>
      </div>

      <Button onClick={onNewDeal}>
        <Plus className="h-4 w-4 mr-2" />
        Novo negócio
      </Button>
    </div>
  );
}
