-- Criar tabela principal de NFC-e
CREATE TABLE IF NOT EXISTS public.nfce (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  serie INTEGER NOT NULL DEFAULT 1,
  chave_acesso VARCHAR(44) UNIQUE,
  protocolo VARCHAR(50),
  status VARCHAR(20) NOT NULL DEFAULT 'rascunho',
  tipo_emissao VARCHAR(20) NOT NULL DEFAULT 'normal',
  data_emissao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_autorizacao TIMESTAMPTZ,
  data_cancelamento TIMESTAMPTZ,
  motivo_cancelamento TEXT,
  destinatario_cpf VARCHAR(14),
  destinatario_nome VARCHAR(200),
  destinatario_endereco JSONB,
  valor_produtos DECIMAL(15,2) NOT NULL DEFAULT 0,
  valor_desconto DECIMAL(15,2) NOT NULL DEFAULT 0,
  valor_total DECIMAL(15,2) NOT NULL DEFAULT 0,
  contingencia_motivo TEXT,
  sincronizado BOOLEAN DEFAULT FALSE,
  order_id UUID,
  usuario_id UUID,
  xml_enviado TEXT,
  xml_autorizado TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, serie, numero)
);

CREATE TABLE IF NOT EXISTS public.nfce_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nfce_id UUID NOT NULL REFERENCES public.nfce(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL,
  produto_id UUID,
  codigo_produto VARCHAR(60) NOT NULL,
  descricao VARCHAR(200) NOT NULL,
  ncm VARCHAR(8) NOT NULL,
  quantidade DECIMAL(15,4) NOT NULL,
  valor_unitario DECIMAL(15,4) NOT NULL,
  valor_total DECIMAL(15,2) NOT NULL,
  icms_situacao_tributaria VARCHAR(3) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(nfce_id, ordem)
);

ALTER TABLE public.fiscal_config
ADD COLUMN IF NOT EXISTS nfce_serie INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS nfce_numero_atual INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS nfce_csc TEXT,
ADD COLUMN IF NOT EXISTS nfce_contingencia_ativa BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_nfce_org_id ON public.nfce(org_id);
CREATE INDEX IF NOT EXISTS idx_nfce_status ON public.nfce(status);

ALTER TABLE public.nfce ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nfce_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage nfce" ON public.nfce FOR ALL USING (true);
CREATE POLICY "Users can manage nfce_items" ON public.nfce_items FOR ALL USING (true);