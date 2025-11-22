-- =====================================================
-- MÓDULO NFe - NOTAS FISCAIS ELETRÔNICAS (Modelo 55)
-- =====================================================

-- Tabela principal de NFe
CREATE TABLE IF NOT EXISTS public.nfe (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id),
  
  -- Numeração e identificação
  numero INTEGER NOT NULL,
  serie TEXT NOT NULL DEFAULT '1',
  modelo TEXT NOT NULL DEFAULT '55',
  chave_acesso TEXT,
  numero_protocolo TEXT,
  
  -- Tipo e natureza da operação
  natureza_operacao TEXT NOT NULL DEFAULT 'VENDA',
  tipo_operacao TEXT NOT NULL DEFAULT '1', -- 0=Entrada, 1=Saída
  finalidade TEXT NOT NULL DEFAULT '1', -- 1=Normal, 2=Complementar, 3=Ajuste, 4=Devolução
  
  -- Destinatário (Cliente)
  destinatario_id UUID REFERENCES public.customers(id),
  destinatario_nome TEXT NOT NULL,
  destinatario_cpf_cnpj TEXT NOT NULL,
  destinatario_ie TEXT,
  destinatario_endereco TEXT NOT NULL,
  destinatario_numero TEXT NOT NULL,
  destinatario_complemento TEXT,
  destinatario_bairro TEXT NOT NULL,
  destinatario_cidade TEXT NOT NULL,
  destinatario_uf TEXT NOT NULL,
  destinatario_cep TEXT NOT NULL,
  destinatario_telefone TEXT,
  destinatario_email TEXT,
  
  -- Totalizadores da NFe
  valor_produtos NUMERIC(15,2) NOT NULL DEFAULT 0,
  valor_frete NUMERIC(15,2) DEFAULT 0,
  valor_seguro NUMERIC(15,2) DEFAULT 0,
  valor_desconto NUMERIC(15,2) DEFAULT 0,
  valor_outras_despesas NUMERIC(15,2) DEFAULT 0,
  
  -- Totais de tributos
  bc_icms NUMERIC(15,2) DEFAULT 0,
  valor_icms NUMERIC(15,2) DEFAULT 0,
  valor_icms_st NUMERIC(15,2) DEFAULT 0,
  valor_ipi NUMERIC(15,2) DEFAULT 0,
  valor_pis NUMERIC(15,2) DEFAULT 0,
  valor_cofins NUMERIC(15,2) DEFAULT 0,
  
  valor_total NUMERIC(15,2) NOT NULL DEFAULT 0,
  
  -- Informações adicionais
  informacoes_complementares TEXT,
  informacoes_fisco TEXT,
  
  -- Integração com pedidos
  order_id UUID REFERENCES public.orders(id),
  
  -- Status da NFe
  status TEXT NOT NULL DEFAULT 'pendente', -- pendente, autorizada, cancelada, rejeitada, inutilizada
  motivo_rejeicao TEXT,
  
  -- Datas
  data_emissao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  data_saida_entrada TIMESTAMP WITH TIME ZONE,
  data_autorizacao TIMESTAMP WITH TIME ZONE,
  data_cancelamento TIMESTAMP WITH TIME ZONE,
  motivo_cancelamento TEXT,
  
  -- XML e protocolo
  xml_gerado TEXT,
  xml_autorizado TEXT,
  protocolo_cancelamento TEXT,
  
  -- Auditoria
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT nfe_numero_serie_org_unique UNIQUE(org_id, numero, serie)
);

-- Tabela de itens da NFe
CREATE TABLE IF NOT EXISTS public.nfe_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nfe_id UUID NOT NULL REFERENCES public.nfe(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Produto
  product_id UUID REFERENCES public.products(id),
  item_numero INTEGER NOT NULL,
  codigo_produto TEXT NOT NULL,
  descricao TEXT NOT NULL,
  ncm TEXT NOT NULL,
  cest TEXT,
  cfop TEXT NOT NULL,
  unidade TEXT NOT NULL,
  
  -- Valores
  quantidade NUMERIC(15,4) NOT NULL,
  valor_unitario NUMERIC(15,4) NOT NULL,
  valor_total NUMERIC(15,2) NOT NULL,
  valor_desconto NUMERIC(15,2) DEFAULT 0,
  valor_frete NUMERIC(15,2) DEFAULT 0,
  valor_seguro NUMERIC(15,2) DEFAULT 0,
  valor_outras_despesas NUMERIC(15,2) DEFAULT 0,
  
  -- ICMS
  icms_origem TEXT NOT NULL DEFAULT '0',
  icms_cst TEXT NOT NULL,
  icms_modalidade_bc TEXT DEFAULT '3',
  icms_bc NUMERIC(15,2) DEFAULT 0,
  icms_aliquota NUMERIC(5,2) DEFAULT 0,
  icms_valor NUMERIC(15,2) DEFAULT 0,
  
  -- ICMS ST
  icms_st_bc NUMERIC(15,2) DEFAULT 0,
  icms_st_aliquota NUMERIC(5,2) DEFAULT 0,
  icms_st_valor NUMERIC(15,2) DEFAULT 0,
  
  -- IPI
  ipi_cst TEXT,
  ipi_bc NUMERIC(15,2) DEFAULT 0,
  ipi_aliquota NUMERIC(5,2) DEFAULT 0,
  ipi_valor NUMERIC(15,2) DEFAULT 0,
  
  -- PIS
  pis_cst TEXT NOT NULL,
  pis_bc NUMERIC(15,2) DEFAULT 0,
  pis_aliquota NUMERIC(5,2) DEFAULT 0,
  pis_valor NUMERIC(15,2) DEFAULT 0,
  
  -- COFINS
  cofins_cst TEXT NOT NULL,
  cofins_bc NUMERIC(15,2) DEFAULT 0,
  cofins_aliquota NUMERIC(5,2) DEFAULT 0,
  cofins_valor NUMERIC(15,2) DEFAULT 0,
  
  -- Informações adicionais do item
  informacoes_adicionais TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Função para gerar próximo número de NFe
CREATE OR REPLACE FUNCTION public.generate_next_nfe_number(p_org_id UUID, p_serie TEXT DEFAULT '1')
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
  FROM public.nfe
  WHERE org_id = p_org_id
    AND serie = p_serie;
  
  RETURN next_number;
END;
$$;

-- Trigger para definir número da NFe automaticamente
CREATE OR REPLACE FUNCTION public.set_nfe_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = 0 THEN
    NEW.numero := public.generate_next_nfe_number(NEW.org_id, NEW.serie);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_nfe_number
  BEFORE INSERT ON public.nfe
  FOR EACH ROW
  EXECUTE FUNCTION public.set_nfe_number();

-- Função para calcular totalizadores da NFe
CREATE OR REPLACE FUNCTION public.calculate_nfe_totals(p_nfe_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_totals RECORD;
BEGIN
  -- Calcula os totais dos itens
  SELECT 
    COALESCE(SUM(valor_total), 0) as valor_produtos,
    COALESCE(SUM(valor_frete), 0) as valor_frete,
    COALESCE(SUM(valor_seguro), 0) as valor_seguro,
    COALESCE(SUM(valor_desconto), 0) as valor_desconto,
    COALESCE(SUM(valor_outras_despesas), 0) as valor_outras_despesas,
    COALESCE(SUM(icms_bc), 0) as bc_icms,
    COALESCE(SUM(icms_valor), 0) as valor_icms,
    COALESCE(SUM(icms_st_valor), 0) as valor_icms_st,
    COALESCE(SUM(ipi_valor), 0) as valor_ipi,
    COALESCE(SUM(pis_valor), 0) as valor_pis,
    COALESCE(SUM(cofins_valor), 0) as valor_cofins
  INTO v_totals
  FROM public.nfe_items
  WHERE nfe_id = p_nfe_id;
  
  -- Atualiza a NFe com os totais
  UPDATE public.nfe
  SET 
    valor_produtos = v_totals.valor_produtos,
    valor_frete = v_totals.valor_frete,
    valor_seguro = v_totals.valor_seguro,
    valor_desconto = v_totals.valor_desconto,
    valor_outras_despesas = v_totals.valor_outras_despesas,
    bc_icms = v_totals.bc_icms,
    valor_icms = v_totals.valor_icms,
    valor_icms_st = v_totals.valor_icms_st,
    valor_ipi = v_totals.valor_ipi,
    valor_pis = v_totals.valor_pis,
    valor_cofins = v_totals.valor_cofins,
    valor_total = v_totals.valor_produtos 
                + v_totals.valor_frete 
                + v_totals.valor_seguro 
                + v_totals.valor_outras_despesas 
                + v_totals.valor_icms_st
                + v_totals.valor_ipi
                - v_totals.valor_desconto,
    updated_at = NOW()
  WHERE id = p_nfe_id;
END;
$$;

-- Trigger para recalcular totais ao inserir/atualizar/deletar itens
CREATE OR REPLACE FUNCTION public.trigger_calculate_nfe_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.calculate_nfe_totals(OLD.nfe_id);
    RETURN OLD;
  ELSE
    PERFORM public.calculate_nfe_totals(NEW.nfe_id);
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER trigger_nfe_items_calculate_totals
  AFTER INSERT OR UPDATE OR DELETE ON public.nfe_items
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_calculate_nfe_totals();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_nfe_org_id ON public.nfe(org_id);
CREATE INDEX IF NOT EXISTS idx_nfe_company_id ON public.nfe(company_id);
CREATE INDEX IF NOT EXISTS idx_nfe_numero_serie ON public.nfe(org_id, numero, serie);
CREATE INDEX IF NOT EXISTS idx_nfe_status ON public.nfe(status);
CREATE INDEX IF NOT EXISTS idx_nfe_data_emissao ON public.nfe(data_emissao);
CREATE INDEX IF NOT EXISTS idx_nfe_destinatario_id ON public.nfe(destinatario_id);
CREATE INDEX IF NOT EXISTS idx_nfe_order_id ON public.nfe(order_id);
CREATE INDEX IF NOT EXISTS idx_nfe_chave_acesso ON public.nfe(chave_acesso);

CREATE INDEX IF NOT EXISTS idx_nfe_items_nfe_id ON public.nfe_items(nfe_id);
CREATE INDEX IF NOT EXISTS idx_nfe_items_product_id ON public.nfe_items(product_id);
CREATE INDEX IF NOT EXISTS idx_nfe_items_org_id ON public.nfe_items(org_id);

-- RLS Policies
ALTER TABLE public.nfe ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nfe_items ENABLE ROW LEVEL SECURITY;

-- Política para visualizar NFe da organização
CREATE POLICY "Users can view NFe from their organization"
  ON public.nfe FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Política para criar NFe
CREATE POLICY "Users can create NFe for their organization"
  ON public.nfe FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.user_organizations
      WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- Política para atualizar NFe (apenas pendentes)
CREATE POLICY "Users can update pending NFe from their organization"
  ON public.nfe FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM public.user_organizations
      WHERE user_id = auth.uid()
    )
    AND status = 'pendente'
  );

-- Política para deletar NFe (apenas pendentes)
CREATE POLICY "Users can delete pending NFe from their organization"
  ON public.nfe FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM public.user_organizations
      WHERE user_id = auth.uid()
    )
    AND status = 'pendente'
  );

-- Políticas para itens da NFe
CREATE POLICY "Users can view NFe items from their organization"
  ON public.nfe_items FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage NFe items from their organization"
  ON public.nfe_items FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM public.user_organizations
      WHERE user_id = auth.uid()
    )
    AND nfe_id IN (
      SELECT id FROM public.nfe
      WHERE status = 'pendente'
    )
  );

-- Comentários nas tabelas
COMMENT ON TABLE public.nfe IS 'Notas Fiscais Eletrônicas modelo 55';
COMMENT ON TABLE public.nfe_items IS 'Itens/produtos das NFe';
COMMENT ON COLUMN public.nfe.status IS 'pendente, autorizada, cancelada, rejeitada, inutilizada';
COMMENT ON COLUMN public.nfe.tipo_operacao IS '0=Entrada, 1=Saída';
COMMENT ON COLUMN public.nfe.finalidade IS '1=Normal, 2=Complementar, 3=Ajuste, 4=Devolução';