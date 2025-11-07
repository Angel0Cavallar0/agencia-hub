-- Criar tabela de logs do sistema
CREATE TABLE public.system_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz NOT NULL DEFAULT now(),
  level text NOT NULL CHECK (level IN ('info', 'warning', 'error', 'success')),
  code text,
  message text NOT NULL,
  context jsonb,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Criar índices para melhor performance
CREATE INDEX idx_system_logs_timestamp ON public.system_logs(timestamp DESC);
CREATE INDEX idx_system_logs_level ON public.system_logs(level);
CREATE INDEX idx_system_logs_user_id ON public.system_logs(user_id);

-- Habilitar RLS
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Política: Admins podem ver todos os logs
CREATE POLICY "Admins can view all logs"
ON public.system_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Política: Sistema pode inserir logs
CREATE POLICY "Authenticated users can insert logs"
ON public.system_logs
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Criar tabela de configurações globais
CREATE TABLE public.global_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ler
CREATE POLICY "Everyone can read global settings"
ON public.global_settings
FOR SELECT
USING (true);

-- Política: Apenas admins podem gerenciar
CREATE POLICY "Admins can manage global settings"
ON public.global_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Inserir configurações padrão de cores
INSERT INTO public.global_settings (key, value) VALUES
  ('theme_colors', '{"primary": "166 100% 21%", "secondary": "166 98% 34%"}'::jsonb)
ON CONFLICT (key) DO NOTHING;