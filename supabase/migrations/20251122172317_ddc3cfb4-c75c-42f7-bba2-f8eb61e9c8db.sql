-- Criar tabela para eventos da NFe (cancelamento, carta de correção, etc)
CREATE TABLE IF NOT EXISTS public.nfe_eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nfe_id UUID NOT NULL REFERENCES public.nfe(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tipo_evento TEXT NOT NULL CHECK (tipo_evento IN ('cancelamento', 'carta_correcao', 'manifestacao')),
  descricao TEXT NOT NULL,
  protocolo TEXT,
  data_evento TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_nfe_eventos_nfe_id ON public.nfe_eventos(nfe_id);
CREATE INDEX IF NOT EXISTS idx_nfe_eventos_org_id ON public.nfe_eventos(org_id);
CREATE INDEX IF NOT EXISTS idx_nfe_eventos_tipo ON public.nfe_eventos(tipo_evento);

-- RLS
ALTER TABLE public.nfe_eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver eventos de suas organizações"
  ON public.nfe_eventos FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem criar eventos"
  ON public.nfe_eventos FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.user_organizations WHERE user_id = auth.uid()
    )
  );

-- Comentários
COMMENT ON TABLE public.nfe_eventos IS 'Eventos da NFe (cancelamento, carta de correção, manifestação)';
COMMENT ON COLUMN public.nfe_eventos.tipo_evento IS 'Tipo do evento: cancelamento, carta_correcao, manifestacao';