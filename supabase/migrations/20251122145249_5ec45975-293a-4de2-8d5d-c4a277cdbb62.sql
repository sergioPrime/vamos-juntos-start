-- Tabela para armazenar cancelamentos de NFe
CREATE TABLE IF NOT EXISTS public.nfe_cancelamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nfe_id UUID NOT NULL REFERENCES public.nfe(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  protocolo_cancelamento TEXT,
  motivo TEXT NOT NULL,
  data_cancelamento TIMESTAMP WITH TIME ZONE DEFAULT now(),
  usuario_cancelamento UUID REFERENCES auth.users(id),
  xml_cancelamento TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela para Carta de Correção Eletrônica
CREATE TABLE IF NOT EXISTS public.nfe_carta_correcao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nfe_id UUID NOT NULL REFERENCES public.nfe(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  sequencia INTEGER NOT NULL DEFAULT 1,
  correcao TEXT NOT NULL,
  protocolo TEXT,
  data_evento TIMESTAMP WITH TIME ZONE DEFAULT now(),
  xml_evento TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela para Manifestação do Destinatário
CREATE TABLE IF NOT EXISTS public.nfe_manifestacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nfe_id UUID NOT NULL REFERENCES public.nfe(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  chave_acesso TEXT NOT NULL,
  tipo_evento TEXT NOT NULL CHECK (tipo_evento IN ('ciencia', 'confirmacao', 'desconhecimento', 'nao_realizada')),
  justificativa TEXT,
  protocolo TEXT,
  data_evento TIMESTAMP WITH TIME ZONE DEFAULT now(),
  xml_evento TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_nfe_cancelamentos_nfe_id ON public.nfe_cancelamentos(nfe_id);
CREATE INDEX IF NOT EXISTS idx_nfe_cancelamentos_org_id ON public.nfe_cancelamentos(org_id);
CREATE INDEX IF NOT EXISTS idx_nfe_carta_correcao_nfe_id ON public.nfe_carta_correcao(nfe_id);
CREATE INDEX IF NOT EXISTS idx_nfe_carta_correcao_org_id ON public.nfe_carta_correcao(org_id);
CREATE INDEX IF NOT EXISTS idx_nfe_manifestacao_nfe_id ON public.nfe_manifestacao(nfe_id);
CREATE INDEX IF NOT EXISTS idx_nfe_manifestacao_org_id ON public.nfe_manifestacao(org_id);
CREATE INDEX IF NOT EXISTS idx_nfe_manifestacao_chave ON public.nfe_manifestacao(chave_acesso);

-- RLS Policies para nfe_cancelamentos
ALTER TABLE public.nfe_cancelamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view cancellations from their organization"
  ON public.nfe_cancelamentos FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM public.user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create cancellations in their organization"
  ON public.nfe_cancelamentos FOR INSERT
  WITH CHECK (org_id IN (
    SELECT org_id FROM public.user_organizations WHERE user_id = auth.uid()
  ));

-- RLS Policies para nfe_carta_correcao
ALTER TABLE public.nfe_carta_correcao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage CC-e from their organization"
  ON public.nfe_carta_correcao FOR ALL
  USING (org_id IN (
    SELECT org_id FROM public.user_organizations WHERE user_id = auth.uid()
  ));

-- RLS Policies para nfe_manifestacao
ALTER TABLE public.nfe_manifestacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage manifestations from their organization"
  ON public.nfe_manifestacao FOR ALL
  USING (org_id IN (
    SELECT org_id FROM public.user_organizations WHERE user_id = auth.uid()
  ));

-- Adicionar campo de status de manifestação na tabela nfe
ALTER TABLE public.nfe 
  ADD COLUMN IF NOT EXISTS manifestacao_destinatario TEXT CHECK (manifestacao_destinatario IN ('ciencia', 'confirmacao', 'desconhecimento', 'nao_realizada'));

COMMENT ON TABLE public.nfe_cancelamentos IS 'Armazena os cancelamentos de NFe';
COMMENT ON TABLE public.nfe_carta_correcao IS 'Armazena as Cartas de Correção Eletrônica (CC-e)';
COMMENT ON TABLE public.nfe_manifestacao IS 'Armazena as manifestações do destinatário';
COMMENT ON COLUMN public.nfe_manifestacao.tipo_evento IS 'ciencia: Ciência da Operação, confirmacao: Confirmação da Operação, desconhecimento: Desconhecimento da Operação, nao_realizada: Operação não Realizada';