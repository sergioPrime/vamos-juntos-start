-- Criar tabela para registro de inutilizações de numeração de NFe
CREATE TABLE IF NOT EXISTS public.nfe_inutilizacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  serie TEXT NOT NULL,
  numero_inicial INTEGER NOT NULL,
  numero_final INTEGER NOT NULL,
  ano TEXT NOT NULL,
  justificativa TEXT NOT NULL,
  protocolo TEXT,
  data_inutilizacao TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT chk_numeros_validos CHECK (numero_inicial <= numero_final),
  CONSTRAINT chk_justificativa_minima CHECK (length(justificativa) >= 15),
  CONSTRAINT chk_status_valido CHECK (status IN ('pendente', 'autorizado', 'rejeitado'))
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_nfe_inutilizacao_org_id ON public.nfe_inutilizacao(org_id);
CREATE INDEX IF NOT EXISTS idx_nfe_inutilizacao_serie ON public.nfe_inutilizacao(org_id, serie);
CREATE INDEX IF NOT EXISTS idx_nfe_inutilizacao_numeros ON public.nfe_inutilizacao(org_id, serie, numero_inicial, numero_final);

-- Habilitar RLS
ALTER TABLE public.nfe_inutilizacao ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Users can view inutilizacoes from their organization"
  ON public.nfe_inutilizacao
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create inutilizacoes in their organization"
  ON public.nfe_inutilizacao
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- Comentários
COMMENT ON TABLE public.nfe_inutilizacao IS 'Registro de inutilização de numeração de NFe não utilizadas';
COMMENT ON COLUMN public.nfe_inutilizacao.serie IS 'Série da NFe';
COMMENT ON COLUMN public.nfe_inutilizacao.numero_inicial IS 'Primeiro número inutilizado';
COMMENT ON COLUMN public.nfe_inutilizacao.numero_final IS 'Último número inutilizado';
COMMENT ON COLUMN public.nfe_inutilizacao.ano IS 'Ano da inutilização (formato YY)';
COMMENT ON COLUMN public.nfe_inutilizacao.justificativa IS 'Motivo da inutilização (mínimo 15 caracteres)';
COMMENT ON COLUMN public.nfe_inutilizacao.protocolo IS 'Protocolo de autorização da SEFAZ';
COMMENT ON COLUMN public.nfe_inutilizacao.status IS 'Status da inutilização: pendente, autorizado, rejeitado';