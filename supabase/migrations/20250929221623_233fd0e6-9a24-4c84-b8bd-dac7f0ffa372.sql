-- Criar tabela para sessões do caixa
CREATE TABLE public.caixa_sessoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  usuario_abertura UUID NOT NULL,
  usuario_fechamento UUID,
  valor_inicial NUMERIC NOT NULL DEFAULT 0,
  valor_atual NUMERIC NOT NULL DEFAULT 0,
  valor_contado NUMERIC,
  diferenca NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'fechado')),
  abertura_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  fechamento_em TIMESTAMP WITH TIME ZONE,
  observacoes_fechamento TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para movimentações do caixa
CREATE TABLE public.caixa_movimentacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  sessao_id UUID,
  tipo TEXT NOT NULL CHECK (tipo IN ('abertura', 'fechamento', 'suprimento', 'sangria', 'venda', 'devolucao')),
  valor NUMERIC NOT NULL,
  descricao TEXT NOT NULL,
  observacoes TEXT,
  reference_id UUID,
  reference_type TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.caixa_sessoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caixa_movimentacoes ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para caixa_sessoes
CREATE POLICY "Users can manage caixa sessions from their organization" 
ON public.caixa_sessoes 
FOR ALL 
USING (org_id IN (
  SELECT user_organizations.org_id
  FROM user_organizations
  WHERE user_organizations.user_id = auth.uid()
));

-- Criar políticas RLS para caixa_movimentacoes
CREATE POLICY "Users can manage caixa movements from their organization" 
ON public.caixa_movimentacoes 
FOR ALL 
USING (org_id IN (
  SELECT user_organizations.org_id
  FROM user_organizations
  WHERE user_organizations.user_id = auth.uid()
));

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_caixa_sessoes_updated_at
  BEFORE UPDATE ON public.caixa_sessoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Criar índices para melhor performance
CREATE INDEX idx_caixa_sessoes_org_status ON public.caixa_sessoes(org_id, status);
CREATE INDEX idx_caixa_sessoes_abertura ON public.caixa_sessoes(abertura_em);
CREATE INDEX idx_caixa_movimentacoes_org_sessao ON public.caixa_movimentacoes(org_id, sessao_id);
CREATE INDEX idx_caixa_movimentacoes_tipo ON public.caixa_movimentacoes(tipo);
CREATE INDEX idx_caixa_movimentacoes_created_at ON public.caixa_movimentacoes(created_at);