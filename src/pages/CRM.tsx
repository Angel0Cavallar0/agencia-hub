import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { CRMHeader } from "@/components/crm/CRMHeader";
import { DealsFilters } from "@/components/crm/DealsFilters";
import { DealsKanban } from "@/components/crm/DealsKanban";
import { DealsList } from "@/components/crm/DealsList";
import { DealDrawer } from "@/components/crm/DealDrawer";
import { NewDealDialog } from "@/components/crm/NewDealDialog";
import { ContactsTab } from "@/components/crm/ContactsTab";
import { CompaniesTab } from "@/components/crm/CompaniesTab";
import { CRMSettingsDialog } from "@/components/crm/CRMSettingsDialog";
import {
  Deal,
  useCRMAccess,
  useDeals,
  useIsCRMAdmin,
  usePipelines,
  useStages,
} from "@/hooks/useCRM";
import { Separator } from "@/components/ui/separator";

export default function CRM() {
  const [activeTab, setActiveTab] = useState("deals");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [selectedPipeline, setSelectedPipeline] = useState<string>("");
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [selectedOwner, setSelectedOwner] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isDealDrawerOpen, setIsDealDrawerOpen] = useState(false);
  const [isNewDealOpen, setIsNewDealOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { data: hasAccess, isLoading: loadingAccess } = useCRMAccess();
  const isCRMAdmin = useIsCRMAdmin();
  const { data: pipelines = [], isLoading: loadingPipelines } = usePipelines();
  const { data: settingsPipelines = [] } = usePipelines(true);
  const { data: stages = [], isLoading: loadingStages } = useStages(selectedPipeline || undefined);
  const { data: allStages = [] } = useStages();

  useEffect(() => {
    if (pipelines.length > 0 && !selectedPipeline) {
      const defaultPipeline = pipelines.find((pipeline) => pipeline.is_default) ?? pipelines[0];
      setSelectedPipeline(defaultPipeline.id);
    }
  }, [pipelines, selectedPipeline]);

  useEffect(() => {
    setSelectedStage("all");
  }, [selectedPipeline]);

  const pipelineFilter = selectedPipeline || undefined;
  const stageFilter = selectedStage !== "all" ? selectedStage : undefined;
  const ownerFilter = isCRMAdmin && selectedOwner !== "all" ? selectedOwner : undefined;

  const { data: deals = [], isLoading: loadingDeals } = useDeals(
    pipelineFilter,
    stageFilter,
    ownerFilter,
    search || undefined
  );

  useEffect(() => {
    if (selectedDeal) {
      const updatedDeal = deals.find((deal) => deal.id === selectedDeal.id);
      if (updatedDeal) {
        setSelectedDeal(updatedDeal);
      }
    }
  }, [deals, selectedDeal?.id]);

  const filteredStages = useMemo(
    () => stages.filter((stage) => stage.pipeline_id === selectedPipeline),
    [stages, selectedPipeline]
  );

  const handleDealClick = (deal: Deal) => {
    setSelectedDeal(deal);
    setIsDealDrawerOpen(true);
  };

  if (loadingAccess || loadingPipelines || loadingStages) {
    return (
      <Layout>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">CRM</h1>
          <p className="text-muted-foreground">Carregando informações do CRM...</p>
        </div>
      </Layout>
    );
  }

  if (!hasAccess) {
    return (
      <Layout>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Acesso não permitido</CardTitle>
            <CardDescription>
              Você não possui permissão para acessar o módulo de CRM. Solicite acesso ao administrador.
            </CardDescription>
          </CardHeader>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <CRMHeader
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenSettings={isCRMAdmin ? () => setIsSettingsOpen(true) : undefined}
        />

        <Separator />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsContent value="deals" className="space-y-4">
            <DealsFilters
              pipelines={pipelines}
              stages={filteredStages}
              selectedPipeline={selectedPipeline}
              selectedStage={selectedStage}
              selectedOwner={selectedOwner}
              search={search}
              viewMode={viewMode}
              onPipelineChange={setSelectedPipeline}
              onStageChange={setSelectedStage}
              onOwnerChange={setSelectedOwner}
              onSearchChange={setSearch}
              onViewModeChange={setViewMode}
              onNewDeal={() => setIsNewDealOpen(true)}
            />

            {loadingDeals ? (
              <Card>
                <CardHeader>
                  <CardTitle>Carregando negócios...</CardTitle>
                  <CardDescription>Buscando oportunidades disponíveis.</CardDescription>
                </CardHeader>
              </Card>
            ) : viewMode === "kanban" ? (
              <DealsKanban stages={filteredStages} deals={deals} onDealClick={handleDealClick} />
            ) : (
              <DealsList deals={deals} onDealClick={handleDealClick} />
            )}
          </TabsContent>

          <TabsContent value="contacts">
            <ContactsTab />
          </TabsContent>

          <TabsContent value="companies">
            <CompaniesTab />
          </TabsContent>
        </Tabs>
      </div>

      <DealDrawer
        deal={selectedDeal}
        stages={filteredStages}
        open={isDealDrawerOpen}
        onOpenChange={setIsDealDrawerOpen}
      />

      <NewDealDialog
        pipelines={pipelines}
        stages={stages}
        open={isNewDealOpen}
        onOpenChange={setIsNewDealOpen}
        defaultPipelineId={selectedPipeline}
      />

      <CRMSettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        pipelines={settingsPipelines}
        stages={allStages}
      />
    </Layout>
  );
}
