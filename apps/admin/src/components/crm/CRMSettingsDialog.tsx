import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { GripVertical, Plus, Trash2, Edit2, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Pipeline, Stage, useCRMSetting, useUpsertCRMSetting } from "@/hooks/useCRM";

interface CRMSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pipelines: Pipeline[];
  stages: Stage[];
}

export function CRMSettingsDialog({
  open,
  onOpenChange,
  pipelines,
  stages,
}: CRMSettingsDialogProps) {
  const queryClient = useQueryClient();
  const [selectedPipeline, setSelectedPipeline] = useState<string>("");
  const [localStages, setLocalStages] = useState<Stage[]>([]);
  const [editingStage, setEditingStage] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [newStageName, setNewStageName] = useState("");
  const [newPipelineName, setNewPipelineName] = useState("");
  const [deleteStage, setDeleteStage] = useState<Stage | null>(null);
  const { data: webhookSetting } = useCRMSetting("crm_webhook");
  const upsertSetting = useUpsertCRMSetting();
  const [webhookUrl, setWebhookUrl] = useState("");

  useEffect(() => {
    if (pipelines.length > 0 && !selectedPipeline) {
      setSelectedPipeline(pipelines[0].id);
    }
  }, [pipelines, selectedPipeline]);

  useEffect(() => {
    setLocalStages(stages.filter((s) => s.pipeline_id === selectedPipeline));
  }, [stages, selectedPipeline]);

  useEffect(() => {
    if (webhookSetting?.value && typeof webhookSetting.value === "object") {
      const value = webhookSetting.value as { url?: unknown };
      if (typeof value.url === "string") {
        setWebhookUrl(value.url);
        return;
      }
    }

    if (typeof webhookSetting?.value === "string") {
      setWebhookUrl(webhookSetting.value);
    }
  }, [webhookSetting]);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(localStages);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order_index for all items
    const updatedItems = items.map((item, index) => ({
      ...item,
      order_index: index + 1,
    }));

    setLocalStages(updatedItems);

    // Save to database
    for (const item of updatedItems) {
      await supabase
        .from("crm_stages")
        .update({ order_index: item.order_index })
        .eq("id", item.id);
    }

    queryClient.invalidateQueries({ queryKey: ["crm-stages"] });
    toast.success("Ordem das etapas atualizada");
  };

  const handleAddStage = async () => {
    if (!newStageName.trim() || !selectedPipeline) return;

    const maxOrder = Math.max(...localStages.map((s) => s.order_index), 0);

    const { error } = await supabase.from("crm_stages").insert({
      pipeline_id: selectedPipeline,
      name: newStageName,
      order_index: maxOrder + 1,
      color: "#3B82F6",
    });

    if (error) {
      toast.error("Erro ao criar etapa");
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["crm-stages"] });
    setNewStageName("");
    toast.success("Etapa criada");
  };

  const handleUpdateStageName = async (stageId: string) => {
    if (!editingName.trim()) return;

    const { error } = await supabase
      .from("crm_stages")
      .update({ name: editingName })
      .eq("id", stageId);

    if (error) {
      toast.error("Erro ao atualizar etapa");
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["crm-stages"] });
    setEditingStage(null);
    setEditingName("");
    toast.success("Etapa atualizada");
  };

  const handleDeleteStage = async () => {
    if (!deleteStage) return;

    const { error } = await supabase
      .from("crm_stages")
      .delete()
      .eq("id", deleteStage.id);

    if (error) {
      toast.error("Erro ao excluir etapa. Verifique se não há negócios nesta etapa.");
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["crm-stages"] });
    setDeleteStage(null);
    toast.success("Etapa excluída");
  };

  const handleAddPipeline = async () => {
    if (!newPipelineName.trim()) return;

    const maxOrder = Math.max(...pipelines.map((p) => p.order_index), 0);

    const { data, error } = await supabase
      .from("crm_pipelines")
      .insert({
        name: newPipelineName,
        order_index: maxOrder + 1,
      })
      .select()
      .single();

    if (error) {
      toast.error("Erro ao criar funil");
      return;
    }

    // Add default stages
    await supabase.from("crm_stages").insert([
      { pipeline_id: data.id, name: "Nova etapa", order_index: 1, color: "#6B7280" },
    ]);

    queryClient.invalidateQueries({ queryKey: ["crm-pipelines"] });
    queryClient.invalidateQueries({ queryKey: ["crm-stages"] });
    setNewPipelineName("");
    setSelectedPipeline(data.id);
    toast.success("Funil criado");
  };

  const handleTogglePipeline = async (pipelineId: string, isActive: boolean) => {
    const { error } = await supabase
      .from("crm_pipelines")
      .update({ is_active: isActive })
      .eq("id", pipelineId);

    if (error) {
      toast.error("Erro ao atualizar funil");
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["crm-pipelines"] });
    toast.success(isActive ? "Funil ativado" : "Funil desativado");
  };

  const handleToggleStageWon = async (stageId: string, isWon: boolean) => {
    const { error } = await supabase
      .from("crm_stages")
      .update({ is_won: isWon, is_lost: false })
      .eq("id", stageId);

    if (error) {
      toast.error("Erro ao atualizar etapa");
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["crm-stages"] });
  };

  const handleToggleStageLost = async (stageId: string, isLost: boolean) => {
    const { error } = await supabase
      .from("crm_stages")
      .update({ is_lost: isLost, is_won: false })
      .eq("id", stageId);

    if (error) {
      toast.error("Erro ao atualizar etapa");
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["crm-stages"] });
  };

  const handleSaveWebhook = async () => {
    await upsertSetting.mutateAsync({ key: "crm_webhook", value: { url: webhookUrl } });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Configurações do CRM</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="pipelines" className="mt-4">
            <TabsList className="w-full">
              <TabsTrigger value="pipelines" className="flex-1">
                Funis
              </TabsTrigger>
              <TabsTrigger value="stages" className="flex-1">
                Etapas
              </TabsTrigger>
              <TabsTrigger value="webhook" className="flex-1">
                Webhook
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pipelines" className="mt-4">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Nome do novo funil"
                    value={newPipelineName}
                    onChange={(e) => setNewPipelineName(e.target.value)}
                  />
                  <Button onClick={handleAddPipeline} disabled={!newPipelineName.trim()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar
                  </Button>
                </div>

                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {pipelines.map((pipeline) => (
                      <div
                        key={pipeline.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{pipeline.name}</p>
                          {pipeline.description && (
                            <p className="text-sm text-muted-foreground">
                              {pipeline.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`active-${pipeline.id}`} className="text-sm">
                            Ativo
                          </Label>
                          <Switch
                            id={`active-${pipeline.id}`}
                            checked={pipeline.is_active}
                            onCheckedChange={(checked) =>
                              handleTogglePipeline(pipeline.id, checked)
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="stages" className="mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Selecione o funil</Label>
                  <select
                    className="w-full p-2 border rounded-md bg-background"
                    value={selectedPipeline}
                    onChange={(e) => setSelectedPipeline(e.target.value)}
                  >
                    {pipelines.map((pipeline) => (
                      <option key={pipeline.id} value={pipeline.id}>
                        {pipeline.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Nome da nova etapa"
                    value={newStageName}
                    onChange={(e) => setNewStageName(e.target.value)}
                  />
                  <Button onClick={handleAddStage} disabled={!newStageName.trim()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>

                <ScrollArea className="h-[300px]">
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="stages">
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="space-y-2"
                        >
                          {localStages.map((stage, index) => (
                            <Draggable key={stage.id} draggableId={stage.id} index={index}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className="flex items-center gap-2 p-3 border rounded-lg bg-background"
                                >
                                  <div {...provided.dragHandleProps}>
                                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                                  </div>

                                  <div
                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: stage.color }}
                                  />

                                  {editingStage === stage.id ? (
                                    <div className="flex-1 flex items-center gap-2">
                                      <Input
                                        value={editingName}
                                        onChange={(e) => setEditingName(e.target.value)}
                                        className="h-8"
                                        autoFocus
                                      />
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8"
                                        onClick={() => handleUpdateStageName(stage.id)}
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8"
                                        onClick={() => setEditingStage(null)}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <>
                                      <span className="flex-1">{stage.name}</span>

                                      <div className="flex items-center gap-3 text-xs">
                                        <label className="flex items-center gap-1">
                                          <input
                                            type="checkbox"
                                            checked={stage.is_won}
                                            onChange={(e) =>
                                              handleToggleStageWon(stage.id, e.target.checked)
                                            }
                                          />
                                          Ganho
                                        </label>
                                        <label className="flex items-center gap-1">
                                          <input
                                            type="checkbox"
                                            checked={stage.is_lost}
                                            onChange={(e) =>
                                              handleToggleStageLost(stage.id, e.target.checked)
                                            }
                                          />
                                          Perdido
                                        </label>
                                      </div>

                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8"
                                        onClick={() => {
                                          setEditingStage(stage.id);
                                          setEditingName(stage.name);
                                        }}
                                      >
                                        <Edit2 className="h-4 w-4" />
                                      </Button>

                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-destructive"
                                        onClick={() => setDeleteStage(stage)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="webhook" className="mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>URL do webhook do CRM</Label>
                  <Input
                    placeholder="https://sua-url.com/webhook"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Essa URL será chamada quando eventos importantes do CRM acontecerem.
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveWebhook} disabled={upsertSetting.isPending}>
                    {upsertSetting.isPending ? "Salvando..." : "Salvar webhook"}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteStage} onOpenChange={() => setDeleteStage(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir etapa?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a etapa "{deleteStage?.name}"? Esta ação não
              pode ser desfeita. Negócios nesta etapa precisarão ser movidos antes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStage}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
