import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Pipeline {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  is_default: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Stage {
  id: string;
  pipeline_id: string;
  name: string;
  color: string;
  order_index: number;
  is_won: boolean;
  is_lost: boolean;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  document: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  position: string | null;
  company_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  company?: Company;
}

export interface Deal {
  id: string;
  title: string;
  value: number;
  pipeline_id: string;
  stage_id: string;
  company_id: string | null;
  contact_id: string | null;
  owner_id: string;
  status: "open" | "won" | "lost";
  expected_close_date: string | null;
  closed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  company?: Company;
  contact?: Contact;
  owner?: { id: string; nome: string; sobrenome: string | null };
  stage?: Stage;
  pipeline?: Pipeline;
}

export interface DealNote {
  id: string;
  deal_id: string;
  content: string;
  created_by: string | null;
  created_at: string;
  creator?: { id: string; nome: string; sobrenome: string | null };
}

export interface CRMSetting {
  id: string;
  key: string;
  value: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export function usePipelines(includeInactive = false) {
  return useQuery({
    queryKey: ["crm-pipelines", includeInactive],
    queryFn: async () => {
      let query = supabase.from("crm_pipelines").select("*").order("order_index");

      if (!includeInactive) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Pipeline[];
    },
  });
}

export function useStages(pipelineId?: string) {
  return useQuery({
    queryKey: ["crm-stages", pipelineId],
    queryFn: async () => {
      let query = supabase.from("crm_stages").select("*").order("order_index");

      if (pipelineId) {
        query = query.eq("pipeline_id", pipelineId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Stage[];
    },
    enabled: !!pipelineId || pipelineId === undefined,
  });
}

export function useDeals(pipelineId?: string, stageId?: string, ownerId?: string, search?: string) {
  return useQuery({
    queryKey: ["crm-deals", pipelineId, stageId, ownerId, search],
    queryFn: async () => {
      let query = supabase
        .from("crm_deals")
        .select(`
          *,
          company:crm_companies(*),
          contact:crm_contacts(*),
          stage:crm_stages(*),
          pipeline:crm_pipelines(*)
        `)
        .order("created_at", { ascending: false });

      if (pipelineId) {
        query = query.eq("pipeline_id", pipelineId);
      }

      if (stageId) {
        query = query.eq("stage_id", stageId);
      }

      if (ownerId) {
        query = query.eq("owner_id", ownerId);
      }

      const { data, error } = await query;
      if (error) throw error;

      let deals = data as unknown as Deal[];

      if (search) {
        const searchLower = search.toLowerCase();
        deals = deals.filter(
          (deal) =>
            deal.title.toLowerCase().includes(searchLower) ||
            deal.company?.name?.toLowerCase().includes(searchLower) ||
            deal.contact?.name?.toLowerCase().includes(searchLower)
        );
      }

      return deals;
    },
    enabled: true,
  });
}

export function useCompanies(search?: string) {
  return useQuery({
    queryKey: ["crm-companies", search],
    queryFn: async () => {
      let query = supabase
        .from("crm_companies")
        .select("*")
        .order("name");

      const { data, error } = await query;
      if (error) throw error;

      let companies = data as Company[];

      if (search) {
        const searchLower = search.toLowerCase();
        companies = companies.filter(
          (company) =>
            company.name.toLowerCase().includes(searchLower) ||
            company.document?.toLowerCase().includes(searchLower) ||
            company.city?.toLowerCase().includes(searchLower)
        );
      }

      return companies;
    },
  });
}

export function useContacts(search?: string, companyId?: string) {
  return useQuery({
    queryKey: ["crm-contacts", search, companyId],
    queryFn: async () => {
      let query = supabase
        .from("crm_contacts")
        .select(`
          *,
          company:crm_companies(*)
        `)
        .order("name");

      if (companyId) {
        query = query.eq("company_id", companyId);
      }

      const { data, error } = await query;
      if (error) throw error;

      let contacts = data as Contact[];

      if (search) {
        const searchLower = search.toLowerCase();
        contacts = contacts.filter(
          (contact) =>
            contact.name.toLowerCase().includes(searchLower) ||
            contact.email?.toLowerCase().includes(searchLower) ||
            contact.phone?.toLowerCase().includes(searchLower)
        );
      }

      return contacts;
    },
  });
}

export function useDealNotes(dealId?: string) {
  return useQuery({
    queryKey: ["crm-deal-notes", dealId],
    queryFn: async () => {
      if (!dealId) return [];

      const { data, error } = await supabase
        .from("crm_deal_notes")
        .select("*")
        .eq("deal_id", dealId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as DealNote[];
    },
    enabled: !!dealId,
  });
}

export function useOwners() {
  return useQuery({
    queryKey: ["crm-owners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("colaborador")
        .select("id_colaborador, nome, sobrenome, user_id")
        .eq("colab_ativo", true)
        .not("user_id", "is", null)
        .order("nome");

      if (error) throw error;
      return data as { id_colaborador: string; nome: string; sobrenome: string | null; user_id: string }[];
    },
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (deal: Partial<Deal> & { title: string; pipeline_id: string; stage_id: string; owner_id: string }) => {
      const { data, error } = await supabase
        .from("crm_deals")
        .insert(deal)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-deals"] });
      toast.success("Negócio criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar negócio: " + error.message);
    },
  });
}

export function useUpdateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Deal> & { id: string }) => {
      const { data, error } = await supabase
        .from("crm_deals")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-deals"] });
    },
    onError: (error) => {
      toast.error("Erro ao atualizar negócio: " + error.message);
    },
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (company: Partial<Company> & { name: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("crm_companies")
        .insert({ ...company, created_by: user?.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-companies"] });
      toast.success("Empresa criada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar empresa: " + error.message);
    },
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Company> & { id: string }) => {
      const { data, error } = await supabase
        .from("crm_companies")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-companies"] });
      toast.success("Empresa atualizada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar empresa: " + error.message);
    },
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contact: Partial<Contact> & { name: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("crm_contacts")
        .insert({ ...contact, created_by: user?.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-contacts"] });
      toast.success("Contato criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar contato: " + error.message);
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Contact> & { id: string }) => {
      const { data, error } = await supabase
        .from("crm_contacts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-contacts"] });
      toast.success("Contato atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar contato: " + error.message);
    },
  });
}

export function useCreateDealNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ deal_id, content }: { deal_id: string; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("crm_deal_notes")
        .insert({ deal_id, content, created_by: user?.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["crm-deal-notes", variables.deal_id] });
      toast.success("Nota adicionada!");
    },
    onError: (error) => {
      toast.error("Erro ao adicionar nota: " + error.message);
    },
  });
}

export function useIsCRMAdmin() {
  const { userRole } = useAuth();
  return userRole === "admin" || userRole === "manager";
}

export function useCRMAccess() {
  return useQuery({
    queryKey: ["crm-access"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("user_has_crm_access");

      if (error) throw error;
      return Boolean(data);
    },
  });
}

export function useCRMSetting(key: string) {
  return useQuery({
    queryKey: ["crm-settings", key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_settings")
        .select("*")
        .eq("key", key)
        .maybeSingle();

      if (error) throw error;
      return data as CRMSetting | null;
    },
    enabled: !!key,
  });
}

export function useUpsertCRMSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: Record<string, unknown> }) => {
      const { data, error } = await supabase
        .from("crm_settings")
        .upsert({ key, value }, { onConflict: "key" })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data as CRMSetting | null;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["crm-settings", variables.key] });
      toast.success("Configuração salva com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao salvar configuração: " + error.message);
    },
  });
}
