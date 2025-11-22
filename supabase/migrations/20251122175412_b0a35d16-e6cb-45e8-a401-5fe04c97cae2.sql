-- Criar tabela para registrar inutilizações de numeração de NFe
CREATE TABLE IF NOT EXISTS public.nfe_inutilizacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  fiscal_config_id UUID NOT NULL REFERENCES public.fiscal_config(id) ON DELETE CASCADE,
  serie TEXT NOT NULL,
  numero_inicial INTEGER NOT NULL,
  numero_final INTEGER NOT NULL,
  justificativa TEXT NOT NULL CHECK (char_length(justificativa) >= 15),
  ano INTEGER NOT NULL,
  modelo TEXT NOT NULL DEFAULT '55',
  protocolo TEXT,
  data_inutilizacao TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'inutilizado', 'rejeitado')),
  mensagem_sefaz TEXT,
  chave_inutilizacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_nfe_inutilizacoes_org_id ON public.nfe_inutilizacoes(org_id);
CREATE INDEX IF NOT EXISTS idx_nfe_inutilizacoes_fiscal_config_id ON public.nfe_inutilizacoes(fiscal_config_id);
CREATE INDEX IF NOT EXISTS idx_nfe_inutilizacoes_status ON public.nfe_inutilizacoes(status);
CREATE INDEX IF NOT EXISTS idx_nfe_inutilizacoes_serie_ano ON public.nfe_inutilizacoes(serie, ano);

-- RLS Policies
ALTER TABLE public.nfe_inutilizacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view inutilizations from their org"
  ON public.nfe_inutilizacoes FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create inutilizations for their org"
  ON public.nfe_inutilizacoes FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.user_organizations 
      WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update inutilizations from their org"
  ON public.nfe_inutilizacoes FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM public.user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_nfe_inutilizacoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_nfe_inutilizacoes_updated_at
  BEFORE UPDATE ON public.nfe_inutilizacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_nfe_inutilizacoes_updated_at();

COMMENT ON TABLE public.nfe_inutilizacoes IS 'Registra as inutilizações de numeração de NFe solicitadas à SEFAZ';