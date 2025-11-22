-- Adicionar tabela de envios de email de NFe
CREATE TABLE IF NOT EXISTS public.nfe_envios_email (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nfe_id UUID NOT NULL REFERENCES public.nfe(id) ON DELETE CASCADE,
  email_destinatario TEXT NOT NULL,
  enviado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.nfe_envios_email ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem visualizar envios de email da própria org"
  ON public.nfe_envios_email
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem inserir envios de email da própria org"
  ON public.nfe_envios_email
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

-- Índices
CREATE INDEX IF NOT EXISTS idx_nfe_envios_email_nfe_id ON public.nfe_envios_email(nfe_id);
CREATE INDEX IF NOT EXISTS idx_nfe_envios_email_org_id ON public.nfe_envios_email(org_id);
