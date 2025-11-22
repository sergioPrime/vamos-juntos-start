-- REFORMA TRIBUTÁRIA 2026 - Adequação NFe/NFC-e
-- Nota Técnica 2025.002 - IBS/CBS/IS

-- ========================================
-- 1. ADICIONAR CAMPOS À TABELA NFE
-- ========================================

-- Grupo B - Identificação da NF-e
ALTER TABLE nfe ADD COLUMN IF NOT EXISTS data_prevista_entrega DATE;
ALTER TABLE nfe ADD COLUMN IF NOT EXISTS municipio_fato_gerador_ibs TEXT;
ALTER TABLE nfe ADD COLUMN IF NOT EXISTS tipo_nf_debito TEXT;
ALTER TABLE nfe ADD COLUMN IF NOT EXISTS tipo_nf_credito TEXT;

-- Compra Governamental
ALTER TABLE nfe ADD COLUMN IF NOT EXISTS tipo_ente_governamental TEXT;
ALTER TABLE nfe ADD COLUMN IF NOT EXISTS percentual_redutor_compra_gov NUMERIC(5,2);
ALTER TABLE nfe ADD COLUMN IF NOT EXISTS tipo_operacao_governamental TEXT;

-- Totalizadores IBS/CBS/IS (Grupo W03)
ALTER TABLE nfe ADD COLUMN IF NOT EXISTS valor_bc_ibs_uf NUMERIC(15,2) DEFAULT 0;
ALTER TABLE nfe ADD COLUMN IF NOT EXISTS aliquota_ibs_uf NUMERIC(5,4) DEFAULT 0;
ALTER TABLE nfe ADD COLUMN IF NOT EXISTS valor_ibs_uf NUMERIC(15,2) DEFAULT 0;

ALTER TABLE nfe ADD COLUMN IF NOT EXISTS valor_bc_ibs_municipal NUMERIC(15,2) DEFAULT 0;
ALTER TABLE nfe ADD COLUMN IF NOT EXISTS aliquota_ibs_municipal NUMERIC(5,4) DEFAULT 0;
ALTER TABLE nfe ADD COLUMN IF NOT EXISTS valor_ibs_municipal NUMERIC(15,2) DEFAULT 0;

ALTER TABLE nfe ADD COLUMN IF NOT EXISTS valor_bc_cbs NUMERIC(15,2) DEFAULT 0;
ALTER TABLE nfe ADD COLUMN IF NOT EXISTS aliquota_cbs NUMERIC(5,4) DEFAULT 0;
ALTER TABLE nfe ADD COLUMN IF NOT EXISTS valor_cbs NUMERIC(15,2) DEFAULT 0;

ALTER TABLE nfe ADD COLUMN IF NOT EXISTS valor_bc_is NUMERIC(15,2) DEFAULT 0;
ALTER TABLE nfe ADD COLUMN IF NOT EXISTS aliquota_is NUMERIC(5,4) DEFAULT 0;
ALTER TABLE nfe ADD COLUMN IF NOT EXISTS valor_is NUMERIC(15,2) DEFAULT 0;

-- Total IBS/CBS/IS (tributos "por fora")
ALTER TABLE nfe ADD COLUMN IF NOT EXISTS valor_total_ibs NUMERIC(15,2) DEFAULT 0;
ALTER TABLE nfe ADD COLUMN IF NOT EXISTS valor_total_cbs NUMERIC(15,2) DEFAULT 0;
ALTER TABLE nfe ADD COLUMN IF NOT EXISTS valor_total_is NUMERIC(15,2) DEFAULT 0;

COMMENT ON COLUMN nfe.data_prevista_entrega IS 'Data prevista de entrega ou disponibilização - Reforma 2026';
COMMENT ON COLUMN nfe.municipio_fato_gerador_ibs IS 'Município de ocorrência do fato gerador IBS/CBS';
COMMENT ON COLUMN nfe.tipo_nf_debito IS 'Tipo de Nota de Débito (finalidade=6)';
COMMENT ON COLUMN nfe.tipo_nf_credito IS 'Tipo de Nota de Crédito (finalidade=5)';

-- ========================================
-- 2. ADICIONAR CAMPOS À TABELA NFE_ITEMS
-- ========================================

-- Grupo UB - Tributação IBS/CBS/IS por item
ALTER TABLE nfe_items ADD COLUMN IF NOT EXISTS cst_ibs_cbs TEXT;
ALTER TABLE nfe_items ADD COLUMN IF NOT EXISTS codigo_classificacao_tributaria TEXT;

-- IBS UF (Estadual)
ALTER TABLE nfe_items ADD COLUMN IF NOT EXISTS ibs_uf_aliquota NUMERIC(5,4) DEFAULT 0;
ALTER TABLE nfe_items ADD COLUMN IF NOT EXISTS ibs_uf_valor NUMERIC(15,2) DEFAULT 0;
ALTER TABLE nfe_items ADD COLUMN IF NOT EXISTS ibs_uf_base_calculo NUMERIC(15,2) DEFAULT 0;
ALTER TABLE nfe_items ADD COLUMN IF NOT EXISTS ibs_uf_percentual_diferimento NUMERIC(5,2);
ALTER TABLE nfe_items ADD COLUMN IF NOT EXISTS ibs_uf_valor_diferido NUMERIC(15,2);
ALTER TABLE nfe_items ADD COLUMN IF NOT EXISTS ibs_uf_percentual_devolucao NUMERIC(5,2);
ALTER TABLE nfe_items ADD COLUMN IF NOT EXISTS ibs_uf_valor_devolucao NUMERIC(15,2);
ALTER TABLE nfe_items ADD COLUMN IF NOT EXISTS ibs_uf_percentual_reducao NUMERIC(5,2);

-- IBS Municipal
ALTER TABLE nfe_items ADD COLUMN IF NOT EXISTS ibs_mun_aliquota NUMERIC(5,4) DEFAULT 0;
ALTER TABLE nfe_items ADD COLUMN IF NOT EXISTS ibs_mun_valor NUMERIC(15,2) DEFAULT 0;
ALTER TABLE nfe_items ADD COLUMN IF NOT EXISTS ibs_mun_base_calculo NUMERIC(15,2) DEFAULT 0;
ALTER TABLE nfe_items ADD COLUMN IF NOT EXISTS ibs_mun_percentual_diferimento NUMERIC(5,2);
ALTER TABLE nfe_items ADD COLUMN IF NOT EXISTS ibs_mun_valor_diferido NUMERIC(15,2);
ALTER TABLE nfe_items ADD COLUMN IF NOT EXISTS ibs_mun_percentual_devolucao NUMERIC(5,2);
ALTER TABLE nfe_items ADD COLUMN IF NOT EXISTS ibs_mun_valor_devolucao NUMERIC(15,2);
ALTER TABLE nfe_items ADD COLUMN IF NOT EXISTS ibs_mun_percentual_reducao NUMERIC(5,2);

-- CBS (Federal)
ALTER TABLE nfe_items ADD COLUMN IF NOT EXISTS cbs_aliquota NUMERIC(5,4) DEFAULT 0;
ALTER TABLE nfe_items ADD COLUMN IF NOT EXISTS cbs_valor NUMERIC(15,2) DEFAULT 0;
ALTER TABLE nfe_items ADD COLUMN IF NOT EXISTS cbs_base_calculo NUMERIC(15,2) DEFAULT 0;
ALTER TABLE nfe_items ADD COLUMN IF NOT EXISTS cbs_percentual_diferimento NUMERIC(5,2);
ALTER TABLE nfe_items ADD COLUMN IF NOT EXISTS cbs_valor_diferido NUMERIC(15,2);
ALTER TABLE nfe_items ADD COLUMN IF NOT EXISTS cbs_percentual_devolucao NUMERIC(5,2);
ALTER TABLE nfe_items ADD COLUMN IF NOT EXISTS cbs_valor_devolucao NUMERIC(15,2);
ALTER TABLE nfe_items ADD COLUMN IF NOT EXISTS cbs_percentual_reducao NUMERIC(5,2);
ALTER TABLE nfe_items ADD COLUMN IF NOT EXISTS cbs_indicador_doacao TEXT;

-- IS (Imposto Seletivo)
ALTER TABLE nfe_items ADD COLUMN IF NOT EXISTS is_cst TEXT;
ALTER TABLE nfe_items ADD COLUMN IF NOT EXISTS is_codigo_classificacao TEXT;
ALTER TABLE nfe_items ADD COLUMN IF NOT EXISTS is_aliquota NUMERIC(5,4) DEFAULT 0;
ALTER TABLE nfe_items ADD COLUMN IF NOT EXISTS is_valor NUMERIC(15,2) DEFAULT 0;
ALTER TABLE nfe_items ADD COLUMN IF NOT EXISTS is_base_calculo NUMERIC(15,2) DEFAULT 0;
ALTER TABLE nfe_items ADD COLUMN IF NOT EXISTS is_unidade_medida TEXT;
ALTER TABLE nfe_items ADD COLUMN IF NOT EXISTS is_quantidade_tributavel NUMERIC(15,4);

-- Indicadores especiais
ALTER TABLE nfe_items ADD COLUMN IF NOT EXISTS indicador_bem_movel_usado TEXT;
ALTER TABLE nfe_items ADD COLUMN IF NOT EXISTS classificacao_subapuracao_zfm TEXT;

-- Tributação Monofásica
ALTER TABLE nfe_items ADD COLUMN IF NOT EXISTS ibs_cbs_monofasico BOOLEAN DEFAULT false;
ALTER TABLE nfe_items ADD COLUMN IF NOT EXISTS ibs_cbs_percentual_retencao NUMERIC(5,2);
ALTER TABLE nfe_items ADD COLUMN IF NOT EXISTS ibs_cbs_valor_retido NUMERIC(15,2);

-- ========================================
-- 3. CRIAR TABELA DE CLASSIFICAÇÃO TRIBUTÁRIA
-- ========================================

CREATE TABLE IF NOT EXISTS public.codigos_classificacao_tributaria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  descricao TEXT NOT NULL,
  artigo_lc_214 TEXT,
  tipo_tributo TEXT NOT NULL CHECK (tipo_tributo IN ('IBS_CBS', 'IS')),
  aplicacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS para tabela de códigos (leitura pública, escrita apenas admin)
ALTER TABLE public.codigos_classificacao_tributaria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view classification codes"
ON public.codigos_classificacao_tributaria
FOR SELECT
USING (true);

CREATE POLICY "Only superadmin can manage classification codes"
ON public.codigos_classificacao_tributaria
FOR ALL
USING (has_role(auth.uid(), 'superadmin'::app_role));

-- ========================================
-- 4. ATUALIZAR TABELA FISCAL_OPERATIONS
-- ========================================

-- Adicionar alíquotas IBS/CBS/IS às operações fiscais
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS ibs_uf_aliquota NUMERIC(5,4) DEFAULT 0;
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS ibs_municipal_aliquota NUMERIC(5,4) DEFAULT 0;
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS cbs_aliquota NUMERIC(5,4) DEFAULT 0;
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS is_aliquota NUMERIC(5,4) DEFAULT 0;
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS codigo_classificacao_tributaria TEXT;
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS aplica_ibs_cbs BOOLEAN DEFAULT true;
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS aplica_imposto_seletivo BOOLEAN DEFAULT false;

-- ========================================
-- 5. CRIAR TABELA DE TRANSIÇÃO TRIBUTÁRIA
-- ========================================

CREATE TABLE IF NOT EXISTS public.reforma_tributaria_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Configuração do regime
  regime_tributario TEXT NOT NULL CHECK (regime_tributario IN ('normal', 'simples_nacional', 'mei')),
  data_inicio_obrigatoriedade DATE NOT NULL,
  
  -- Alíquotas padrão por região
  aliquota_ibs_uf_padrao NUMERIC(5,4) DEFAULT 0,
  aliquota_ibs_municipal_padrao NUMERIC(5,4) DEFAULT 0,
  aliquota_cbs_padrao NUMERIC(5,4) DEFAULT 0,
  
  -- Configurações
  habilitar_ibs_cbs BOOLEAN DEFAULT false,
  habilitar_imposto_seletivo BOOLEAN DEFAULT false,
  
  -- Período de transição
  ano_transicao INTEGER NOT NULL,
  percentual_reducao_antigo NUMERIC(5,2) DEFAULT 0,
  percentual_aplicacao_novo NUMERIC(5,2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(org_id)
);

-- RLS para reforma_tributaria_config
ALTER TABLE public.reforma_tributaria_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage reform config from their organization"
ON public.reforma_tributaria_config
FOR ALL
USING (org_id IN (
  SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
));

-- ========================================
-- 6. FUNÇÃO PARA CALCULAR IBS/CBS/IS
-- ========================================

CREATE OR REPLACE FUNCTION public.calcular_ibs_cbs_is(
  p_valor_base NUMERIC,
  p_aliquota_ibs_uf NUMERIC,
  p_aliquota_ibs_mun NUMERIC,
  p_aliquota_cbs NUMERIC,
  p_aliquota_is NUMERIC DEFAULT 0
)
RETURNS TABLE(
  ibs_uf_valor NUMERIC,
  ibs_mun_valor NUMERIC,
  cbs_valor NUMERIC,
  is_valor NUMERIC,
  valor_total_tributos NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY SELECT
    ROUND(p_valor_base * (p_aliquota_ibs_uf / 100), 2) as ibs_uf_valor,
    ROUND(p_valor_base * (p_aliquota_ibs_mun / 100), 2) as ibs_mun_valor,
    ROUND(p_valor_base * (p_aliquota_cbs / 100), 2) as cbs_valor,
    ROUND(p_valor_base * (COALESCE(p_aliquota_is, 0) / 100), 2) as is_valor,
    ROUND(
      p_valor_base * (p_aliquota_ibs_uf / 100) +
      p_valor_base * (p_aliquota_ibs_mun / 100) +
      p_valor_base * (p_aliquota_cbs / 100) +
      p_valor_base * (COALESCE(p_aliquota_is, 0) / 100),
      2
    ) as valor_total_tributos;
END;
$$;

-- ========================================
-- 7. ATUALIZAR FUNÇÃO DE TOTAIS NFE
-- ========================================

CREATE OR REPLACE FUNCTION public.calculate_nfe_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_totals RECORD;
BEGIN
  -- Calcular totais de produtos e tributos tradicionais
  SELECT 
    COALESCE(SUM(valor_total), 0) as total_produtos,
    COALESCE(SUM(icms_valor), 0) as total_icms,
    COALESCE(SUM(ipi_valor), 0) as total_ipi,
    COALESCE(SUM(pis_valor), 0) as total_pis,
    COALESCE(SUM(cofins_valor), 0) as total_cofins,
    -- Novos tributos Reforma 2026
    COALESCE(SUM(ibs_uf_valor), 0) as total_ibs_uf,
    COALESCE(SUM(ibs_mun_valor), 0) as total_ibs_mun,
    COALESCE(SUM(cbs_valor), 0) as total_cbs,
    COALESCE(SUM(is_valor), 0) as total_is
  INTO v_totals
  FROM nfe_items
  WHERE nfe_id = NEW.nfe_id;

  -- Atualizar NFe com os totais
  UPDATE nfe SET
    valor_produtos = v_totals.total_produtos,
    valor_icms = v_totals.total_icms,
    valor_ipi = v_totals.total_ipi,
    valor_pis = v_totals.total_pis,
    valor_cofins = v_totals.total_cofins,
    -- Novos tributos
    valor_total_ibs = v_totals.total_ibs_uf + v_totals.total_ibs_mun,
    valor_total_cbs = v_totals.total_cbs,
    valor_total_is = v_totals.total_is,
    valor_ibs_uf = v_totals.total_ibs_uf,
    valor_ibs_municipal = v_totals.total_ibs_mun,
    valor_cbs = v_totals.total_cbs,
    -- Valor total (tributos "por fora" devem ser somados)
    valor_total = v_totals.total_produtos + 
                  v_totals.total_ipi +
                  v_totals.total_ibs_uf +
                  v_totals.total_ibs_mun +
                  v_totals.total_cbs +
                  v_totals.total_is +
                  COALESCE(valor_frete, 0) +
                  COALESCE(valor_seguro, 0) +
                  COALESCE(valor_outras_despesas, 0) -
                  COALESCE(valor_desconto, 0),
    updated_at = now()
  WHERE id = NEW.nfe_id;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.calcular_ibs_cbs_is IS 'Calcula valores de IBS/CBS/IS conforme Reforma Tributária 2026';
COMMENT ON TABLE public.codigos_classificacao_tributaria IS 'Códigos de Classificação Tributária - Reforma 2026 (Anexo III da NT 2025.002)';
COMMENT ON TABLE public.reforma_tributaria_config IS 'Configurações da Reforma Tributária por organização - Transição 2026-2033';