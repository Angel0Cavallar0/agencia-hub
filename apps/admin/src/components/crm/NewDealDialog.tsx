import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Label,
} from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Pipeline,
  Stage,
  useCreateDeal,
  useCreateCompany,
  useCreateContact,
  useCompanies,
  useContacts,
  useOwners,
  useIsCRMAdmin,
} from "@/hooks/useCRM";
import { useAuth } from "@/contexts/AuthContext";

const dealSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  value: z.number().min(0, "Valor deve ser positivo"),
  pipeline_id: z.string().min(1, "Selecione um funil"),
  stage_id: z.string().min(1, "Selecione uma etapa"),
  company_id: z.string().optional(),
  contact_id: z.string().optional(),
  owner_id: z.string().min(1, "Selecione um dono"),
  notes: z.string().optional(),
});

type DealFormData = z.infer<typeof dealSchema>;

interface NewDealDialogProps {
  pipelines: Pipeline[];
  stages: Stage[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPipelineId?: string;
}

export function NewDealDialog({
  pipelines,
  stages,
  open,
  onOpenChange,
  defaultPipelineId,
}: NewDealDialogProps) {
  const [showNewCompany, setShowNewCompany] = useState(false);
  const [showNewContact, setShowNewContact] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: "",
    document: "",
    email: "",
    phone: "",
    website: "",
    city: "",
    state: "",
    address: "",
    notes: "",
  });
  const [newContact, setNewContact] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
    company_id: "",
    notes: "",
  });
  const [selectedPipelineId, setSelectedPipelineId] = useState(defaultPipelineId || "");

  const createDeal = useCreateDeal();
  const createCompany = useCreateCompany();
  const createContact = useCreateContact();
  const { data: companies } = useCompanies();
  const { data: contacts } = useContacts();
  const { data: owners } = useOwners();
  const isCRMAdmin = useIsCRMAdmin();
  const { user } = useAuth();

  const form = useForm<DealFormData>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      title: "",
      value: 0,
      pipeline_id: defaultPipelineId || "",
      stage_id: "",
      company_id: "",
      contact_id: "",
      owner_id: user?.id || "",
      notes: "",
    },
  });

  const filteredStages = stages.filter((s) => s.pipeline_id === selectedPipelineId);

  useEffect(() => {
    if (defaultPipelineId) {
      setSelectedPipelineId(defaultPipelineId);
      form.setValue("pipeline_id", defaultPipelineId);
    }
  }, [defaultPipelineId, form]);

  useEffect(() => {
    const [firstStage] = filteredStages;
    const currentStage = form.getValues("stage_id");

    if (!currentStage && firstStage) {
      form.setValue("stage_id", firstStage.id);
    }
  }, [filteredStages, form]);

  const handlePipelineChange = (value: string) => {
    setSelectedPipelineId(value);
    form.setValue("pipeline_id", value);
    form.setValue("stage_id", "");
  };

  const resetCompanyForm = () => {
    setNewCompany({
      name: "",
      document: "",
      email: "",
      phone: "",
      website: "",
      city: "",
      state: "",
      address: "",
      notes: "",
    });
  };

  const resetContactForm = () => {
    setNewContact({
      name: "",
      email: "",
      phone: "",
      position: "",
      company_id: form.getValues("company_id") || "",
      notes: "",
    });
  };

  const handleCreateCompany = async () => {
    if (!newCompany.name.trim()) return;
    const result = await createCompany.mutateAsync({
      name: newCompany.name,
      document: newCompany.document || undefined,
      email: newCompany.email || undefined,
      phone: newCompany.phone || undefined,
      website: newCompany.website || undefined,
      city: newCompany.city || undefined,
      state: newCompany.state || undefined,
      address: newCompany.address || undefined,
      notes: newCompany.notes || undefined,
    });
    form.setValue("company_id", result.id);
    resetCompanyForm();
    setShowNewCompany(false);
  };

  const handleCreateContact = async () => {
    if (!newContact.name.trim()) return;
    const result = await createContact.mutateAsync({
      name: newContact.name,
      email: newContact.email || undefined,
      phone: newContact.phone || undefined,
      position: newContact.position || undefined,
      company_id: newContact.company_id || form.getValues("company_id") || undefined,
      notes: newContact.notes || undefined,
    });
    form.setValue("contact_id", result.id);
    if (!form.getValues("company_id") && result.company_id) {
      form.setValue("company_id", result.company_id);
    }
    resetContactForm();
    setShowNewContact(false);
  };

  const onSubmit = async (data: DealFormData) => {
    await createDeal.mutateAsync({
      title: data.title,
      value: data.value,
      pipeline_id: data.pipeline_id,
      stage_id: data.stage_id,
      owner_id: data.owner_id,
      company_id: data.company_id || null,
      contact_id: data.contact_id || null,
      notes: data.notes || null,
    });
    form.reset();
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Negócio</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do negócio" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="pipeline_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Funil</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={handlePipelineChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {pipelines.map((pipeline) => (
                            <SelectItem key={pipeline.id} value={pipeline.id}>
                              {pipeline.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stage_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Etapa</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={!selectedPipelineId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredStages.map((stage) => (
                            <SelectItem key={stage.id} value={stage.id}>
                              {stage.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Company */}
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="company_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empresa</FormLabel>
                      <div className="flex gap-2">
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Selecione ou crie" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {companies?.map((company) => (
                              <SelectItem key={company.id} value={company.id}>
                                {company.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            resetCompanyForm();
                            setShowNewCompany(true);
                          }}
                          aria-label="Nova empresa"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Contact */}
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="contact_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contato principal</FormLabel>
                      <div className="flex gap-2">
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Selecione ou crie" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {contacts?.map((contact) => (
                              <SelectItem key={contact.id} value={contact.id}>
                                {contact.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setNewContact((prev) => ({
                              ...prev,
                              company_id: form.getValues("company_id") || prev.company_id,
                            }));
                            setShowNewContact(true);
                          }}
                          aria-label="Novo contato"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Owner */}
              {isCRMAdmin && owners && (
                <FormField
                  control={form.control}
                  name="owner_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dono do negócio</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {owners.map((owner) => (
                            <SelectItem key={owner.user_id} value={owner.user_id}>
                              {owner.nome} {owner.sobrenome || ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Notas sobre o negócio..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createDeal.isPending}>
                  {createDeal.isPending ? "Criando..." : "Criar negócio"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showNewCompany}
        onOpenChange={(state) => {
          setShowNewCompany(state);
          if (!state) {
            resetCompanyForm();
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Empresa</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={newCompany.name}
                onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                placeholder="Nome da empresa"
              />
            </div>

            <div className="space-y-2">
              <Label>CNPJ</Label>
              <Input
                value={newCompany.document}
                onChange={(e) => setNewCompany({ ...newCompany, document: e.target.value })}
                placeholder="00.000.000/0000-00"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newCompany.email}
                  onChange={(e) => setNewCompany({ ...newCompany, email: e.target.value })}
                  placeholder="contato@empresa.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={newCompany.phone}
                  onChange={(e) => setNewCompany({ ...newCompany, phone: e.target.value })}
                  placeholder="(00) 0000-0000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Site</Label>
              <Input
                value={newCompany.website}
                onChange={(e) => setNewCompany({ ...newCompany, website: e.target.value })}
                placeholder="https://empresa.com.br"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input
                  value={newCompany.city}
                  onChange={(e) => setNewCompany({ ...newCompany, city: e.target.value })}
                  placeholder="Cidade"
                />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Input
                  value={newCompany.state}
                  onChange={(e) => setNewCompany({ ...newCompany, state: e.target.value })}
                  placeholder="UF"
                  maxLength={2}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Endereço</Label>
              <Input
                value={newCompany.address}
                onChange={(e) => setNewCompany({ ...newCompany, address: e.target.value })}
                placeholder="Rua, número, bairro"
              />
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={newCompany.notes}
                onChange={(e) => setNewCompany({ ...newCompany, notes: e.target.value })}
                placeholder="Notas sobre a empresa..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowNewCompany(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreateCompany}
                disabled={!newCompany.name.trim() || createCompany.isPending}
              >
                Criar empresa
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showNewContact}
        onOpenChange={(state) => {
          setShowNewContact(state);
          if (!state) {
            resetContactForm();
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Contato</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                placeholder="Nome do contato"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cargo</Label>
                <Input
                  value={newContact.position}
                  onChange={(e) => setNewContact({ ...newContact, position: e.target.value })}
                  placeholder="Cargo"
                />
              </div>
              <div className="space-y-2">
                <Label>Empresa</Label>
                <Select
                  value={newContact.company_id}
                  onValueChange={(value) => setNewContact({ ...newContact, company_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies?.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={newContact.notes}
                onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                placeholder="Notas sobre o contato..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewContact(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreateContact}
                disabled={!newContact.name.trim() || createContact.isPending}
              >
                Criar contato
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
