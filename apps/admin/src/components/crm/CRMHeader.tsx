import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsCRMAdmin } from "@/hooks/useCRM";

interface CRMHeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenSettings?: () => void;
}

export function CRMHeader({ activeTab, onTabChange, onOpenSettings }: CRMHeaderProps) {
  const isCRMAdmin = useIsCRMAdmin();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CRM</h1>
          <p className="text-muted-foreground">
            Gerencie seus negócios, contatos e empresas em um só lugar
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isCRMAdmin && onOpenSettings && (
            <Button variant="outline" size="icon" onClick={onOpenSettings}>
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={onTabChange}>
        <TabsList>
          <TabsTrigger value="deals">Negócios</TabsTrigger>
          <TabsTrigger value="contacts">Contatos</TabsTrigger>
          <TabsTrigger value="companies">Empresas</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
