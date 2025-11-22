-- Criar tabela de itens da NFe
CREATE TABLE IF NOT EXISTS public.nfe_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nfe_id UUID NOT NULL REFERENCES public.nfe(id) ON DELETE CASCADE,
  numero_item INTEGER NOT NULL,
  codigo_produto TEXT,
  descricao TEXT NOT NULL,
  ncm TEXT,
  cfop TEXT,
  unidade TEXT DEFAULT 'UN',
  quantidade NUMERIC(15,4) NOT NULL,
  valor_unitario NUMERIC(15,4) NOT NULL,
  valor_total NUMERIC(15,2) NOT NULL,
  
  -- Impostos
  base_calculo_icms NUMERIC(15,2) DEFAULT 0,
  aliquota_icms NUMERIC(5,2) DEFAULT 0,
  valor_icms NUMERIC(15,2) DEFAULT 0,
  base_calculo_icms_st NUMERIC(15,2) DEFAULT 0,
  valor_icms_st NUMERIC(15,2) DEFAULT 0,
  aliquota_ipi NUMERIC(5,2) DEFAULT 0,
  valor_ipi NUMERIC(15,2) DEFAULT 0,
  aliquota_pis NUMERIC(5,2) DEFAULT 0,
  valor_pis NUMERIC(15,2) DEFAULT 0,
  aliquota_cofins NUMERIC(5,2) DEFAULT 0,
  valor_cofins NUMERIC(15,2) DEFAULT 0,
  
  -- Campos da Reforma Tributária
  aliquota_ibs_municipal NUMERIC(5,4) DEFAULT 0,
  valor_ibs_municipal NUMERIC(15,2) DEFAULT 0,
  aliquota_ibs_uf NUMERIC(5,4) DEFAULT 0,
  valor_ibs_uf NUMERIC(15,2) DEFAULT 0,
  aliquota_cbs NUMERIC(5,4) DEFAULT 0,
  valor_cbs NUMERIC(15,2) DEFAULT 0,
  codigo_classificacao_tributaria TEXT,
  
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_nfe_itens_nfe_id ON public.nfe_itens(nfe_id);
CREATE INDEX IF NOT EXISTS idx_nfe_itens_org_id ON public.nfe_itens(org_id);

-- RLS
ALTER TABLE public.nfe_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem visualizar itens de NFe da própria org"
  ON public.nfe_itens
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem inserir itens de NFe da própria org"
  ON public.nfe_itens
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar itens de NFe da própria org"
  ON public.nfe_itens
  FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem deletar itens de NFe da própria org"
  ON public.nfe_itens
  FOR DELETE
  USING (
    org_id IN (
      SELECT org_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );
