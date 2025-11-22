-- Create NFC-e table
CREATE TABLE IF NOT EXISTS public.nfce (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  
  -- Identificação
  numero INTEGER NOT NULL,
  serie TEXT NOT NULL DEFAULT '1',
  modelo TEXT NOT NULL DEFAULT '65',
  data_emissao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_saida TIMESTAMP WITH TIME ZONE,
  
  -- Destinatário (consumidor)
  destinatario_tipo TEXT NOT NULL DEFAULT 'person', -- person, company
  destinatario_nome TEXT,
  destinatario_documento TEXT, -- CPF ou CNPJ
  destinatario_email TEXT,
  destinatario_telefone TEXT,
  destinatario_endereco TEXT,
  destinatario_numero TEXT,
  destinatario_complemento TEXT,
  destinatario_bairro TEXT,
  destinatario_cidade TEXT,
  destinatario_uf TEXT,
  destinatario_cep TEXT,
  
  -- Valores
  valor_produtos NUMERIC(15,2) NOT NULL DEFAULT 0,
  valor_frete NUMERIC(15,2) DEFAULT 0,
  valor_seguro NUMERIC(15,2) DEFAULT 0,
  valor_desconto NUMERIC(15,2) DEFAULT 0,
  valor_outras_despesas NUMERIC(15,2) DEFAULT 0,
  valor_total NUMERIC(15,2) NOT NULL DEFAULT 0,
  
  -- Tributos
  base_calculo_icms NUMERIC(15,2) DEFAULT 0,
  valor_icms NUMERIC(15,2) DEFAULT 0,
  valor_icms_st NUMERIC(15,2) DEFAULT 0,
  valor_ipi NUMERIC(15,2) DEFAULT 0,
  valor_pis NUMERIC(15,2) DEFAULT 0,
  valor_cofins NUMERIC(15,2) DEFAULT 0,
  
  -- Tributos Reforma 2026
  valor_total_ibs NUMERIC(15,2) DEFAULT 0,
  valor_total_cbs NUMERIC(15,2) DEFAULT 0,
  valor_total_is NUMERIC(15,2) DEFAULT 0,
  valor_ibs_uf NUMERIC(15,2) DEFAULT 0,
  valor_ibs_municipal NUMERIC(15,2) DEFAULT 0,
  valor_cbs NUMERIC(15,2) DEFAULT 0,
  
  -- Pagamento
  forma_pagamento TEXT, -- dinheiro, cartao_credito, cartao_debito, pix, etc
  troco NUMERIC(15,2) DEFAULT 0,
  
  -- Status e integração SEFAZ
  status TEXT NOT NULL DEFAULT 'pendente', -- pendente, autorizada, cancelada, rejeitada
  chave_acesso TEXT,
  protocolo_autorizacao TEXT,
  data_autorizacao TIMESTAMP WITH TIME ZONE,
  qr_code TEXT,
  url_consulta TEXT,
  
  -- Cancelamento
  data_cancelamento TIMESTAMP WITH TIME ZONE,
  protocolo_cancelamento TEXT,
  justificativa_cancelamento TEXT,
  
  -- Operação e natureza
  tipo_operacao TEXT NOT NULL DEFAULT 'saida', -- saida
  natureza_operacao TEXT NOT NULL DEFAULT 'Venda ao Consumidor',
  finalidade TEXT NOT NULL DEFAULT 'normal', -- normal, devolucao
  presenca_comprador TEXT NOT NULL DEFAULT 'presencial', -- presencial, internet, etc
  
  -- Informações adicionais
  informacoes_complementares TEXT,
  informacoes_fisco TEXT,
  
  -- Origem
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  caixa_sessao_id UUID REFERENCES public.caixa_sessoes(id) ON DELETE SET NULL,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT nfce_org_numero_serie_unique UNIQUE(org_id, numero, serie)
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_nfce_org_id ON public.nfce(org_id);
CREATE INDEX IF NOT EXISTS idx_nfce_status ON public.nfce(status);
CREATE INDEX IF NOT EXISTS idx_nfce_data_emissao ON public.nfce(data_emissao);
CREATE INDEX IF NOT EXISTS idx_nfce_chave_acesso ON public.nfce(chave_acesso);
CREATE INDEX IF NOT EXISTS idx_nfce_order_id ON public.nfce(order_id);
CREATE INDEX IF NOT EXISTS idx_nfce_caixa_sessao_id ON public.nfce(caixa_sessao_id);

-- Enable RLS
ALTER TABLE public.nfce ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view NFC-e from their organization"
  ON public.nfce FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create NFC-e in their organization"
  ON public.nfce FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update NFC-e in their organization"
  ON public.nfce FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM public.user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete NFC-e in their organization"
  ON public.nfce FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM public.user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- Create NFC-e items table
CREATE TABLE IF NOT EXISTS public.nfce_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nfce_id UUID NOT NULL REFERENCES public.nfce(id) ON DELETE CASCADE,
  
  numero_item INTEGER NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  
  -- Produto
  codigo_produto TEXT NOT NULL,
  descricao TEXT NOT NULL,
  ncm TEXT,
  cest TEXT,
  unidade TEXT NOT NULL DEFAULT 'UN',
  quantidade NUMERIC(15,4) NOT NULL,
  valor_unitario NUMERIC(15,2) NOT NULL,
  valor_total NUMERIC(15,2) NOT NULL,
  valor_desconto NUMERIC(15,2) DEFAULT 0,
  
  -- CFOP
  cfop TEXT NOT NULL,
  
  -- ICMS
  icms_origem TEXT,
  icms_cst TEXT,
  icms_base_calculo NUMERIC(15,2) DEFAULT 0,
  icms_aliquota NUMERIC(5,2) DEFAULT 0,
  icms_valor NUMERIC(15,2) DEFAULT 0,
  
  -- IPI
  ipi_cst TEXT,
  ipi_base_calculo NUMERIC(15,2) DEFAULT 0,
  ipi_aliquota NUMERIC(5,2) DEFAULT 0,
  ipi_valor NUMERIC(15,2) DEFAULT 0,
  
  -- PIS
  pis_cst TEXT,
  pis_base_calculo NUMERIC(15,2) DEFAULT 0,
  pis_aliquota NUMERIC(5,2) DEFAULT 0,
  pis_valor NUMERIC(15,2) DEFAULT 0,
  
  -- COFINS
  cofins_cst TEXT,
  cofins_base_calculo NUMERIC(15,2) DEFAULT 0,
  cofins_aliquota NUMERIC(5,2) DEFAULT 0,
  cofins_valor NUMERIC(15,2) DEFAULT 0,
  
  -- Tributos Reforma 2026
  ibs_uf_aliquota NUMERIC(5,2) DEFAULT 0,
  ibs_uf_valor NUMERIC(15,2) DEFAULT 0,
  ibs_mun_aliquota NUMERIC(5,2) DEFAULT 0,
  ibs_mun_valor NUMERIC(15,2) DEFAULT 0,
  cbs_aliquota NUMERIC(5,2) DEFAULT 0,
  cbs_valor NUMERIC(15,2) DEFAULT 0,
  is_aliquota NUMERIC(5,2) DEFAULT 0,
  is_valor NUMERIC(15,2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT nfce_items_nfce_numero_unique UNIQUE(nfce_id, numero_item)
);

CREATE INDEX IF NOT EXISTS idx_nfce_items_nfce_id ON public.nfce_items(nfce_id);
CREATE INDEX IF NOT EXISTS idx_nfce_items_product_id ON public.nfce_items(product_id);

-- Enable RLS for nfce_items
ALTER TABLE public.nfce_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for nfce_items
CREATE POLICY "Users can view NFC-e items from their organization"
  ON public.nfce_items FOR SELECT
  USING (
    nfce_id IN (
      SELECT id FROM public.nfce 
      WHERE org_id IN (
        SELECT org_id FROM public.user_organizations 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create NFC-e items in their organization"
  ON public.nfce_items FOR INSERT
  WITH CHECK (
    nfce_id IN (
      SELECT id FROM public.nfce 
      WHERE org_id IN (
        SELECT org_id FROM public.user_organizations 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update NFC-e items in their organization"
  ON public.nfce_items FOR UPDATE
  USING (
    nfce_id IN (
      SELECT id FROM public.nfce 
      WHERE org_id IN (
        SELECT org_id FROM public.user_organizations 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete NFC-e items in their organization"
  ON public.nfce_items FOR DELETE
  USING (
    nfce_id IN (
      SELECT id FROM public.nfce 
      WHERE org_id IN (
        SELECT org_id FROM public.user_organizations 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Function to generate next NFC-e number
CREATE OR REPLACE FUNCTION public.generate_next_nfce_number(p_org_id UUID, p_serie TEXT DEFAULT '1')
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
BEGIN
  SELECT COALESCE(MAX(numero), 0) + 1
  INTO next_number
  FROM public.nfce
  WHERE org_id = p_org_id
    AND serie = p_serie;
  
  RETURN next_number;
END;
$$;

-- Trigger to auto-generate NFC-e number
CREATE OR REPLACE FUNCTION public.set_nfce_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = 0 THEN
    NEW.numero := public.generate_next_nfce_number(NEW.org_id, NEW.serie);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_nfce_number
  BEFORE INSERT ON public.nfce
  FOR EACH ROW
  EXECUTE FUNCTION public.set_nfce_number();

-- Trigger to update updated_at
CREATE TRIGGER trigger_nfce_updated_at
  BEFORE UPDATE ON public.nfce
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to calculate NFC-e totals when items change
CREATE OR REPLACE FUNCTION public.calculate_nfce_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_totals RECORD;
BEGIN
  -- Calcular totais
  SELECT 
    COALESCE(SUM(valor_total), 0) as total_produtos,
    COALESCE(SUM(icms_valor), 0) as total_icms,
    COALESCE(SUM(ipi_valor), 0) as total_ipi,
    COALESCE(SUM(pis_valor), 0) as total_pis,
    COALESCE(SUM(cofins_valor), 0) as total_cofins,
    COALESCE(SUM(ibs_uf_valor), 0) as total_ibs_uf,
    COALESCE(SUM(ibs_mun_valor), 0) as total_ibs_mun,
    COALESCE(SUM(cbs_valor), 0) as total_cbs,
    COALESCE(SUM(is_valor), 0) as total_is
  INTO v_totals
  FROM nfce_items
  WHERE nfce_id = NEW.nfce_id;

  -- Atualizar NFC-e
  UPDATE nfce SET
    valor_produtos = v_totals.total_produtos,
    valor_icms = v_totals.total_icms,
    valor_ipi = v_totals.total_ipi,
    valor_pis = v_totals.total_pis,
    valor_cofins = v_totais.total_cofins,
    valor_total_ibs = v_totals.total_ibs_uf + v_totals.total_ibs_mun,
    valor_total_cbs = v_totals.total_cbs,
    valor_total_is = v_totals.total_is,
    valor_ibs_uf = v_totals.total_ibs_uf,
    valor_ibs_municipal = v_totals.total_ibs_mun,
    valor_cbs = v_totals.total_cbs,
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
  WHERE id = NEW.nfce_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_calculate_nfce_totals
  AFTER INSERT OR UPDATE OR DELETE ON public.nfce_items
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_nfce_totals();