-- Add client_id and client_user_id to crm_contacts
ALTER TABLE public.crm_contacts
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS client_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create client_user_role table
CREATE TABLE IF NOT EXISTS public.client_user_role (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on client_user_role
ALTER TABLE public.client_user_role ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_user_role
CREATE POLICY "Users can view their own role" ON public.client_user_role
FOR SELECT USING (client_user_id = auth.uid() OR email = auth.jwt()->>'email');

CREATE POLICY "Admin users can manage client roles" ON public.client_user_role
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Update RLS policies for crm_contacts to include client-related access
CREATE POLICY "Clients can view their own contacts" ON public.crm_contacts
FOR SELECT USING (client_id IS NOT NULL AND client_user_id = auth.uid());

CREATE POLICY "Clients can create their own contacts" ON public.crm_contacts
FOR INSERT WITH CHECK (client_id IS NOT NULL AND client_user_id = auth.uid());

CREATE POLICY "Clients can update their own contacts" ON public.crm_contacts
FOR UPDATE USING (client_id IS NOT NULL AND client_user_id = auth.uid());

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_crm_contacts_client ON public.crm_contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_client_user ON public.crm_contacts(client_user_id);
CREATE INDEX IF NOT EXISTS idx_client_user_role_user ON public.client_user_role(client_user_id);
CREATE INDEX IF NOT EXISTS idx_client_user_role_email ON public.client_user_role(email);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_client_user_role_updated_at
    BEFORE UPDATE ON public.client_user_role
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
