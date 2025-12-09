import { useState } from "react";
import { Search, Plus, Building2, Phone, Mail, Pencil } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Contact,
  useContacts,
  useCompanies,
  useCreateContact,
  useUpdateContact,
  useDeals,
} from "@/hooks/useCRM";

export function ContactsTab() {
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
    company_id: "",
    notes: "",
  });

  const { data: contacts, isLoading } = useContacts(
    search,
    companyFilter !== "all" ? companyFilter : undefined
  );
  const { data: companies } = useCompanies();
  const { data: deals } = useDeals();
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();

  const resetDialogState = () => {
    setContactForm({ name: "", email: "", phone: "", position: "", company_id: "", notes: "" });
    setEditingContactId(null);
    setDialogMode("create");
  };

  const handleOpenCreate = () => {
    resetDialogState();
    setShowDialog(true);
  };

  const handleOpenEdit = (contact: Contact) => {
    setDialogMode("edit");
    setEditingContactId(contact.id);
    setContactForm({
      name: contact.name,
      email: contact.email || "",
      phone: contact.phone || "",
      position: contact.position || "",
      company_id: contact.company_id || "",
      notes: contact.notes || "",
    });
    setShowDialog(true);
  };

  const handleSaveContact = async () => {
    if (!contactForm.name.trim()) return;

    const payload = {
      name: contactForm.name,
      email: contactForm.email || undefined,
      phone: contactForm.phone || undefined,
      position: contactForm.position || undefined,
      company_id: contactForm.company_id || undefined,
      notes: contactForm.notes || undefined,
    };

    if (dialogMode === "edit" && editingContactId) {
      await updateContact.mutateAsync({ id: editingContactId, ...payload });
      setSelectedContact((current) =>
        current && current.id === editingContactId
          ? { ...current, ...payload, company: companies?.find((c) => c.id === payload.company_id) }
          : current
      );
    } else {
      await createContact.mutateAsync(payload);
    }

    resetDialogState();
    setShowDialog(false);
  };

  const getContactDeals = (contactId: string) => {
    return deals?.filter((deal) => deal.contact_id === contactId) || [];
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar contatos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={companyFilter} onValueChange={setCompanyFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todas as empresas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as empresas</SelectItem>
            {companies?.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Novo contato
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Criado em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                </TableRow>
              ))
            ) : contacts?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum contato encontrado
                </TableCell>
              </TableRow>
            ) : (
              contacts?.map((contact) => (
                <TableRow
                  key={contact.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedContact(contact)}
                >
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell>{contact.email || "-"}</TableCell>
                  <TableCell>{contact.phone || "-"}</TableCell>
                  <TableCell>{contact.company?.name || "-"}</TableCell>
                  <TableCell>{contact.position || "-"}</TableCell>
                  <TableCell>
                    {format(new Date(contact.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Contact Detail Sheet */}
      <Sheet open={!!selectedContact} onOpenChange={() => setSelectedContact(null)}>
        <SheetContent>
          {selectedContact && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedContact.name}</SheetTitle>
              </SheetHeader>

              <div className="flex justify-end pt-2">
                <Button variant="outline" size="sm" onClick={() => handleOpenEdit(selectedContact)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </div>

              <div className="mt-6 space-y-6">
                <div className="space-y-4">
                  {selectedContact.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedContact.email}</span>
                    </div>
                  )}
                  {selectedContact.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedContact.phone}</span>
                    </div>
                  )}
                  {selectedContact.company && (
                    <div className="flex items-center gap-3">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedContact.company.name}</span>
                    </div>
                  )}
                  {selectedContact.position && (
                    <div className="text-sm text-muted-foreground">
                      Cargo: {selectedContact.position}
                    </div>
                  )}
                </div>

                {selectedContact.notes && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm">{selectedContact.notes}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <h4 className="font-medium">Negócios relacionados</h4>
                  {getContactDeals(selectedContact.id).length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum negócio</p>
                  ) : (
                    <div className="space-y-2">
                      {getContactDeals(selectedContact.id).map((deal) => (
                        <div key={deal.id} className="p-2 border rounded text-sm">
                          {deal.title}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Contact Dialog */}
      <Dialog
        open={showDialog}
        onOpenChange={(open) => {
          setShowDialog(open);
          if (!open) {
            resetDialogState();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogMode === "edit" ? "Editar Contato" : "Novo Contato"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={contactForm.name}
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                placeholder="Nome do contato"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cargo</Label>
                <Input
                  value={contactForm.position}
                  onChange={(e) => setContactForm({ ...contactForm, position: e.target.value })}
                  placeholder="Cargo"
                />
              </div>
              <div className="space-y-2">
                <Label>Empresa</Label>
                <Select
                  value={contactForm.company_id || "none"}
                  onValueChange={(value) =>
                    setContactForm({ ...contactForm, company_id: value === "none" ? "" : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem empresa</SelectItem>
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
                value={contactForm.notes}
                onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
                placeholder="Notas sobre o contato..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDialog(false);
                  resetDialogState();
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveContact}
                disabled={!contactForm.name.trim() || createContact.isPending || updateContact.isPending}
              >
                {dialogMode === "edit" ? "Salvar alterações" : "Criar contato"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
